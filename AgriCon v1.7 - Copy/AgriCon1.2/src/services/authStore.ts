import { AuthUser } from '../types';

/**
 * Mock, local-only authentication.
 *
 * There is no user-accounts backend in this project (the FastAPI service in
 * `backend/` only serves crop diagnosis, see `claude/api-service-decisions.md`).
 * Accounts and the active session are kept in the browser's localStorage so
 * Login / Sign Up are fully functional for a single device without requiring
 * a server — consistent with this app's offline-first design. This is a demo
 * mechanism, not secure storage: passwords are kept in plain text locally and
 * nothing is sent anywhere. Swap this module for real API calls whenever a
 * user-accounts backend exists.
 */

const SESSION_KEY = 'agricon_session';
const ACCOUNTS_KEY = 'agricon_accounts';

interface StoredAccount {
  name: string;
  contact: string; // normalized (trimmed, lowercased) phone/email, used as the unique id
  password: string;
  farmName?: string;
}

export type AuthResult = { user: AuthUser } | { error: string };

function normalizeContact(contact: string): string {
  return contact.trim().toLowerCase();
}

function loadAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Storage full/unavailable — accounts just won't persist this session.
  }
}

export function avatarUrlFor(name: string): string {
  const label = (name || 'Farmer').trim() || 'Farmer';
  return `https://ui-avatars.com/api/?background=2d6a4f&color=ffffff&bold=true&name=${encodeURIComponent(
    label
  )}`;
}

export function getSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function persistSession(user: AuthUser): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // Session just won't survive a reload — sign-in for this run still works.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // no-op
  }
}

export function signUp(input: {
  name: string;
  contact: string;
  password: string;
  farmName?: string;
}): AuthResult {
  const contact = normalizeContact(input.contact);
  const accounts = loadAccounts();

  if (accounts.some((a) => a.contact === contact)) {
    return { error: 'auth.errorAccountExists' };
  }

  const account: StoredAccount = {
    name: input.name.trim(),
    contact,
    password: input.password,
    farmName: input.farmName?.trim() || undefined,
  };

  saveAccounts([...accounts, account]);

  const user: AuthUser = {
    name: account.name,
    contact: account.contact,
    farmName: account.farmName,
    avatarUrl: avatarUrlFor(account.name),
    isGuest: false,
  };
  persistSession(user);
  return { user };
}

export function logIn(input: { contact: string; password: string }): AuthResult {
  const contact = normalizeContact(input.contact);
  const accounts = loadAccounts();
  const account = accounts.find((a) => a.contact === contact);

  if (!account) {
    return { error: 'auth.errorAccountMissing' };
  }
  if (account.password !== input.password) {
    return { error: 'auth.errorInvalidCredentials' };
  }

  const user: AuthUser = {
    name: account.name,
    contact: account.contact,
    farmName: account.farmName,
    avatarUrl: avatarUrlFor(account.name),
    isGuest: false,
  };
  persistSession(user);
  return { user };
}

export function continueAsGuest(): AuthUser {
  const user: AuthUser = {
    name: 'Guest Farmer',
    contact: '',
    avatarUrl: avatarUrlFor('Guest Farmer'),
    isGuest: true,
  };
  persistSession(user);
  return user;
}
