export interface GeminiModel {
  name: string;
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
}

export interface GeminiTurn {
  role: 'user' | 'model';
  text: string;
}

export interface GeminiAttachment {
  name: string;
  mimeType: string;
  data: string;
}

export interface GeminiReply {
  text: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  finishReason?: string;
  model: string;
}

type GeminiPayload = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: { message?: string };
};

function parseApiError(payload: unknown, status: number): string {
  const message = typeof payload === 'object' && payload !== null && 'error' in payload
    ? String((payload as GeminiPayload).error?.message ?? '')
    : '';
  if (status === 400) return `Gemini rejected the request: ${message || 'Check the selected model and request.'}`;
  if (status === 401 || status === 403) return 'Gemini API key is invalid or does not have access to this model.';
  if (status === 404) return `Gemini model not found: ${message || 'Refresh the live model catalogue and choose an available model.'}`;
  if (status === 429) return `Gemini rate limit reached: ${message || 'Wait for Google quota to become available.'}`;
  if (status >= 500) return `Gemini server error (${status}): ${message || 'The service is temporarily unavailable. Retry the request.'}`;
  return message || `Gemini request failed (${status}).`;
}

async function readError(response: Response): Promise<string> {
  let payload: unknown = null;
  try { payload = await response.json(); } catch { payload = null; }
  return parseApiError(payload, response.status);
}

export async function fetchGeminiModels(apiKey: string): Promise<GeminiModel[]> {
  const allModels: GeminiModel[] = [];
  let pageToken = '';
  let pageCount = 0;

  do {
    const url = new URL('https://generativelanguage.googleapis.com/v1beta/models');
    url.searchParams.set('pageSize', '1000');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url.toString(), { headers: { 'x-goog-api-key': apiKey } });
    if (!response.ok) throw new Error(await readError(response));
    const payload = await response.json() as { models?: GeminiModel[]; nextPageToken?: string };
    allModels.push(...(payload.models ?? []));
    pageToken = payload.nextPageToken ?? '';
    pageCount += 1;
  } while (pageToken && pageCount < 10);

  return allModels
    .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function generateGeminiReply(
  apiKey: string,
  model: string,
  history: GeminiTurn[],
  userPrompt: string,
  attachments: GeminiAttachment[] = [],
  memoryContext = '',
  options: { signal?: AbortSignal; onText?: (text: string) => void } = {}
): Promise<GeminiReply> {
  const content = [
    ...history.slice(-20).map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
    {
      role: 'user',
      parts: [
        { text: userPrompt },
        ...attachments.map((attachment) => ({ inlineData: { mimeType: attachment.mimeType, data: attachment.data } }))
      ]
    }
  ];

  const systemInstruction = [
    'You are CodEX AI, a capable programming and terminal assistant. Be accurate, transparent, and practical.',
    'When asked to create code, return complete working files, never partial snippets or ellipses. For each file, use a fenced code block with a path attribute, such as ```tsx filename="src/App.tsx".',
    'When asked to create a folder or project, create all necessary files and use relative paths in the filename attributes so the application can package them into a downloadable ZIP.',
    'When a user attaches an image, inspect the actual visual content and answer based on what can be seen. Do not claim to see details that are not visible.',
    'When a user attaches documents or a ZIP archive, use the extracted text and file manifest included in the request. Clearly state when a file could not be read.',
    'Do not claim consciousness, feelings, hidden thoughts, or independent personal experiences. You may provide brief, high-level task status labels such as reading an attachment, preparing a response, or formatting files.',
    memoryContext ? `USER MEMORY CONTEXT:\n${memoryContext}` : 'No additional user profile memory has been provided.'
  ].join('\n\n');

  const modelId = model.replace(/^models\//, '').trim();
  if (!modelId) throw new Error('Choose a Gemini model before sending a request.');
  const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:streamGenerateContent`);
  url.searchParams.set('alt', 'sse');
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: content,
      generationConfig: { temperature: 0.68, topP: 0.92, maxOutputTokens: 8192 }
    }),
    signal: options.signal
  });

  if (!response.ok) throw new Error(await readError(response));
  if (!response.body) throw new Error('Streaming is unavailable in this browser. Try reloading CodEX or use a supported browser.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let inputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;
  let finishReason: string | undefined;

  const consumeEvent = (eventText: string) => {
    const data = eventText.split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .join('\n');
    if (!data || data === '[DONE]') return;
    let payload: GeminiPayload;
    try { payload = JSON.parse(data) as GeminiPayload; }
    catch { return; }

    const chunkText = (payload.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? '').join('');
    if (chunkText) {
      fullText += chunkText;
      options.onText?.(fullText);
    }
    const usage = payload.usageMetadata;
    if (usage) {
      inputTokens = usage.promptTokenCount ?? inputTokens;
      outputTokens = usage.candidatesTokenCount ?? outputTokens;
      totalTokens = usage.totalTokenCount ?? totalTokens;
    }
    finishReason = payload.candidates?.[0]?.finishReason ?? finishReason;
  };

  try {
    while (true) {
      if (options.signal?.aborted) throw new DOMException('Request cancelled.', 'AbortError');
      const result = await reader.read();
      buffer += decoder.decode(result.value ?? new Uint8Array(), { stream: !result.done });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? '';
      events.forEach(consumeEvent);
      if (result.done) break;
    }
    if (buffer.trim()) consumeEvent(buffer);
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }

  if (!fullText.trim()) throw new Error('Gemini returned an empty response. Try again or choose another available model.');
  return {
    text: fullText.trim(),
    inputTokens,
    outputTokens,
    totalTokens: totalTokens || inputTokens + outputTokens,
    finishReason,
    model
  };
}

export function extractCodeBlocks(text: string): Array<{ language: string; filename: string; code: string }> {
  const results: Array<{ language: string; filename: string; code: string }> = [];
  const expression = /```([\w+#.-]*)(?:\s+filename=["']([^"']+)["'])?\s*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let index = 1;
  while ((match = expression.exec(text)) !== null) {
    const language = match[1] || 'text';
    const code = match[3].replace(/\n$/, '');
    const filename = match[2] || `codex-output-${index}.${extensionForLanguage(language)}`;
    results.push({ language, filename, code });
    index += 1;
  }
  return results;
}

function extensionForLanguage(language: string): string {
  const map: Record<string, string> = {
    ts: 'ts', tsx: 'tsx', js: 'js', jsx: 'jsx', html: 'html', css: 'css', json: 'json',
    py: 'py', python: 'py', java: 'java', c: 'c', cpp: 'cpp', cs: 'cs', csharp: 'cs',
    sh: 'sh', bash: 'sh', sql: 'sql', yaml: 'yml', yml: 'yml', xml: 'xml', rust: 'rs',
    go: 'go', php: 'php', kotlin: 'kt', swift: 'swift', lua: 'lua', text: 'txt'
  };
  return map[language.toLowerCase()] ?? 'txt';
}
