import type { ApiRequest, HistoryEntry, SavedRequest } from './types';
import { DEFAULT_CORS_PROXY_SETTINGS, type CorsProxySettings } from './corsProxy';

// Versioned keys — bumping the suffix (not migrating in place) is deliberate:
// this tool has no backend to run a migration against, so a shape change
// just starts fresh rather than risk crashing on old records.
const HISTORY_KEY = '101tl_api_builder_history_v1';
const SAVED_KEY = '101tl_api_builder_saved_v1';
const CORS_PROXY_KEY = '101tl_api_builder_cors_proxy_v1';
const MAX_HISTORY_ENTRIES = 50;

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable (private browsing) — the in-memory state
    // still works for this session, it just won't persist across reloads.
  }
};

// File objects can't survive JSON serialization — strip them so multipart
// file fields persist as name/label only, never binary content.
const stripFiles = (request: ApiRequest): ApiRequest => ({
  ...request,
  body: {
    ...request.body,
    formFields: request.body.formFields.map(({ file: _file, ...field }) => field),
  },
});

const REDACTED = '';

/** History records requests automatically, without the user opting in per-entry —
 *  so unlike Saved Requests, secrets never get written to localStorage here. */
const redactSecrets = (request: ApiRequest): ApiRequest => {
  const sensitiveHeaderNames = new Set(['authorization', 'cookie', 'x-api-key', 'api-key', 'apikey']);
  return {
    ...stripFiles(request),
    headers: request.headers.map((h) =>
      sensitiveHeaderNames.has(h.key.trim().toLowerCase()) ? { ...h, value: REDACTED } : h,
    ),
    auth: {
      ...request.auth,
      bearerToken: request.auth.type === 'bearer' ? REDACTED : request.auth.bearerToken,
      basicPassword: request.auth.type === 'basic' ? REDACTED : request.auth.basicPassword,
      apiKeyValue: request.auth.type === 'api-key' ? REDACTED : request.auth.apiKeyValue,
    },
  };
};

export const listHistory = (): HistoryEntry[] => readJson<HistoryEntry[]>(HISTORY_KEY, []).sort((a, b) => b.timestamp - a.timestamp);

export const addHistoryEntry = (entry: HistoryEntry): void => {
  const redacted: HistoryEntry = { ...entry, request: redactSecrets(entry.request) };
  const all = readJson<HistoryEntry[]>(HISTORY_KEY, []);
  all.unshift(redacted);
  writeJson(HISTORY_KEY, all.slice(0, MAX_HISTORY_ENTRIES));
};

export const deleteHistoryEntry = (id: string): void => {
  const all = readJson<HistoryEntry[]>(HISTORY_KEY, []).filter((entry) => entry.id !== id);
  writeJson(HISTORY_KEY, all);
};

export const clearHistory = (): void => writeJson(HISTORY_KEY, []);

export const listSavedRequests = (): SavedRequest[] =>
  readJson<SavedRequest[]>(SAVED_KEY, []).sort((a, b) => b.updatedAt - a.updatedAt);

export const getSavedRequest = (id: string): SavedRequest | undefined => listSavedRequests().find((s) => s.id === id);

export const upsertSavedRequest = (saved: SavedRequest): void => {
  const sanitized: SavedRequest = { ...saved, request: stripFiles(saved.request) };
  const all = readJson<SavedRequest[]>(SAVED_KEY, []);
  const idx = all.findIndex((existing) => existing.id === sanitized.id);
  if (idx >= 0) all[idx] = sanitized;
  else all.push(sanitized);
  writeJson(SAVED_KEY, all);
};

export const renameSavedRequest = (id: string, name: string): void => {
  const all = readJson<SavedRequest[]>(SAVED_KEY, []);
  const idx = all.findIndex((existing) => existing.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], name, updatedAt: Date.now() };
  writeJson(SAVED_KEY, all);
};

export const deleteSavedRequest = (id: string): void => {
  const all = readJson<SavedRequest[]>(SAVED_KEY, []).filter((existing) => existing.id !== id);
  writeJson(SAVED_KEY, all);
};

// Off by default, and only ever changed by an explicit action in the CORS
// Proxy settings modal — never flipped on implicitly.
export const getCorsProxySettings = (): CorsProxySettings => readJson(CORS_PROXY_KEY, DEFAULT_CORS_PROXY_SETTINGS);

export const saveCorsProxySettings = (settings: CorsProxySettings): void => writeJson(CORS_PROXY_KEY, settings);
