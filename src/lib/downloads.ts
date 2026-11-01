import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export type ExportableFile = { name: string; blob: Blob };

function safeFileName(value: string): string {
  const cleaned = value.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 120);
  return cleaned || 'codex-output.txt';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not prepare the file for Android storage.'));
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const separator = result.indexOf(',');
      if (separator < 0) reject(new Error('The generated file could not be encoded.'));
      else resolve(result.slice(separator + 1));
    };
    reader.readAsDataURL(blob);
  });
}

export async function exportFileToDevice(file: ExportableFile): Promise<'browser' | 'android'> {
  const filename = safeFileName(file.name);

  if (Capacitor.isNativePlatform()) {
    const base64 = await blobToBase64(file.blob);
    const saved = await Filesystem.writeFile({
      path: `codex-exports/${Date.now()}-${filename}`,
      data: base64,
      directory: Directory.Cache,
      recursive: true
    });

    await Share.share({
      title: `Save ${filename}`,
      text: 'Choose Files or another storage app to keep this CodEX export.',
      url: saved.uri,
      dialogTitle: `Save ${filename}`
    });
    return 'android';
  }

  const url = URL.createObjectURL(file.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return 'browser';
}
