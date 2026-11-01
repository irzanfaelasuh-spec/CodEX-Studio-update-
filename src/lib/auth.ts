export interface SignedInUser {
  uid: string;
  username: string;
  mode: 'local';
}

type LocalAccount = {
  uid: string;
  username: string;
  salt: string;
  passwordHash: string;
  createdAt: number;
};

const USERS_KEY = 'codex.local.users.v1';
const SESSION_KEY = 'codex.local.session.v1';

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateCredentials(username: string, password: string): string | null {
  const normalized = normalizeUsername(username);
  if (!/^[a-z0-9_-]{3,20}$/.test(normalized)) {
    return 'Use 3–20 characters: letters, numbers, underscore or hyphen.';
  }
  if (password.length < 6) return 'Password must contain at least 6 characters.';
  return null;
}

function readLocalUsers(): Record<string, LocalAccount> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '{}') as Record<string, LocalAccount>;
  } catch {
    return {};
  }
}

function writeLocalUsers(users: Record<string, LocalAccount>): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  if (!crypto.subtle) throw new Error('Secure password storage requires HTTPS. Open CodEX through GitHub Pages or the installed app.');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 180000, hash: 'SHA-256' }, key, 256);
  return toBase64(new Uint8Array(bits));
}

export async function registerAccount(usernameInput: string, password: string): Promise<SignedInUser> {
  const validation = validateCredentials(usernameInput, password);
  if (validation) throw new Error(validation);
  const username = normalizeUsername(usernameInput);
  const users = readLocalUsers();
  if (users[username]) throw new Error('This name is already in use. Please try another one.');

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const account: LocalAccount = {
    uid: `local-${crypto.randomUUID()}`,
    username,
    salt: toBase64(salt),
    passwordHash: await hashPassword(password, salt),
    createdAt: Date.now()
  };
  users[username] = account;
  writeLocalUsers(users);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ uid: account.uid, username }));
  return { uid: account.uid, username, mode: 'local' };
}

export async function loginAccount(usernameInput: string, password: string): Promise<SignedInUser> {
  const validation = validateCredentials(usernameInput, password);
  if (validation) throw new Error(validation);
  const username = normalizeUsername(usernameInput);
  const account = readLocalUsers()[username];
  if (!account) throw new Error('Name or password is incorrect.');
  const actual = await hashPassword(password, fromBase64(account.salt));
  if (actual !== account.passwordHash) throw new Error('Name or password is incorrect.');
  localStorage.setItem(SESSION_KEY, JSON.stringify({ uid: account.uid, username }));
  return { uid: account.uid, username, mode: 'local' };
}

export async function restoreSession(): Promise<SignedInUser | null> {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as { uid: string; username: string } | null;
    if (!session) return null;
    const account = readLocalUsers()[session.username];
    if (!account || account.uid !== session.uid) return null;
    return { uid: account.uid, username: account.username, mode: 'local' };
  } catch {
    return null;
  }
}

export async function logoutAccount(): Promise<void> {
  localStorage.removeItem(SESSION_KEY);
}
