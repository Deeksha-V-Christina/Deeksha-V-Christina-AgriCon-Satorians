import { useSyncExternalStore } from 'react';

/**
 * Runtime-configurable base URL for the diagnosis backend.
 *
 * In a browser tab — the Vite dev server, or a plain web deploy — `/api` is
 * either proxied (see vite.config.ts) or served same-origin, so no
 * configuration is needed and this resolves to ''.
 *
 * Packaged as a native app (Capacitor Android/iOS), there is no dev-server
 * proxy and no shared origin: the app runs inside a WebView at
 * `https://localhost`, while `backend/run_backend.bat` runs on whatever PC
 * is on the farm LAN. The app has no way to guess that machine's address, so
 * it is entered once — in the "Diagnosis engine not running" panel, which
 * doubles as the settings field — and kept in localStorage, which the
 * WebView persists across launches exactly like a browser does.
 */
const STORAGE_KEY = 'agricon_api_base';

function readStored(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    // Storage can throw in locked-down/private contexts — fall back to the
    // build-time default rather than crashing the app over a settings read.
    return '';
  }
}

let override = readStored();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** The base URL to prefix every `/api/...` request with. */
export function getApiBase(): string {
  if (override) return override;
  return import.meta.env.VITE_AGRICON_API ?? '';
}

/** Persist a new backend URL (e.g. `http://192.168.1.23:8000`). Pass '' to clear it. */
export function setApiBase(url: string) {
  const trimmed = url.trim().replace(/\/+$/, '');
  override = trimmed;
  try {
    if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Not persisted this time, but still applied for the rest of this
    // session — better than losing the change entirely.
  }
  emit();
}

/** True inside the Capacitor Android/iOS shell; false in any ordinary browser tab. */
export function isRunningNative(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return typeof cap !== 'undefined' && cap.isNativePlatform?.() === true;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Read the configured backend URL, re-rendering when it changes. */
export function useApiBase(): string {
  return useSyncExternalStore(subscribe, getApiBase, getApiBase);
}
