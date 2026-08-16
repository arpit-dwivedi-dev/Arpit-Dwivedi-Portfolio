import { cloneRequest, nextId, type ApiRequest, type HistoryEntry, type SavedRequest } from './types';
import { DEFAULT_CORS_PROXY_SETTINGS, type CorsProxySettings } from './corsProxy';
import type { Environment, EnvironmentVariable } from './environment';
import { descendantFolderIds, type Collection, type Folder } from './collections';

// Versioned keys — bumping the suffix (not migrating in place) is deliberate:
// this tool has no backend to run a migration against, so a shape change
// just starts fresh rather than risk crashing on old records.
const HISTORY_KEY = '101tl_api_builder_history_v1';
const SAVED_KEY = '101tl_api_builder_saved_v1';
const CORS_PROXY_KEY = '101tl_api_builder_cors_proxy_v1';
const ENVIRONMENTS_KEY = '101tl_api_builder_environments_v1';
const COLLECTIONS_KEY = '101tl_api_builder_collections_v1';
const MAX_HISTORY_ENTRIES = 50;

// Fixed rather than nextId()-generated so both the saved-request migration and a brand-new
// user's very first Save land in the *same* collection deterministically.
export const DEFAULT_COLLECTION_ID = 'default';
const DEFAULT_COLLECTION_NAME = 'My Requests';

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

export const SENSITIVE_HEADER_NAMES = new Set(['authorization', 'cookie', 'x-api-key', 'api-key', 'apikey']);
export const isSensitiveHeader = (h: { key: string }) => SENSITIVE_HEADER_NAMES.has(h.key.trim().toLowerCase());

/** True when persisting this request as-is would write a plaintext credential
 *  to localStorage — used to warn the user before Save, not to decide whether
 *  to redact (redactSecrets always runs regardless). */
export const hasStorableSecrets = (request: ApiRequest): boolean =>
  request.headers.some((h) => isSensitiveHeader(h) && h.value !== '') ||
  (request.auth.type === 'bearer' && request.auth.bearerToken !== '') ||
  (request.auth.type === 'basic' && request.auth.basicPassword !== '') ||
  (request.auth.type === 'api-key' && request.auth.apiKeyValue !== '');

/** Shared by History (recorded automatically) and Saved Requests (opted into by
 *  name) — both persist to localStorage, so neither should write auth secrets
 *  or credential-shaped headers to disk in plaintext. */
export const redactSecrets = (request: ApiRequest): ApiRequest => {
  return {
    ...stripFiles(request),
    headers: request.headers.map((h) => (isSensitiveHeader(h) ? { ...h, value: REDACTED } : h)),
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

const isValidSavedRequestShape = (r: unknown): r is SavedRequest =>
  typeof r === 'object' &&
  r !== null &&
  typeof (r as SavedRequest).id === 'string' &&
  typeof (r as SavedRequest).name === 'string' &&
  typeof (r as SavedRequest).createdAt === 'number' &&
  typeof (r as SavedRequest).updatedAt === 'number' &&
  typeof (r as SavedRequest).request === 'object' &&
  (r as SavedRequest).request !== null;

/** A saved request written before Collections existed has no `collectionId`/`folderId` — this
 *  is the migration: the first read after upgrading assigns every such record to the default
 *  collection ("My Requests") and persists the result. Safe to call on every read: once every
 *  record has a `collectionId`, `needsMigration` is false and nothing gets rewritten, so this
 *  never re-runs or creates duplicates, and is equally safe if a previous run only got partway
 *  through (each record is migrated independently, keyed by its own stable id). */
const migrateSavedRequests = (records: SavedRequest[]): SavedRequest[] => {
  const needsMigration = records.some((r) => typeof r.collectionId !== 'string');
  if (!needsMigration) return records;

  readCollectionsState(); // ensures + persists the default collection as a side effect
  const migrated = records.map((r) =>
    typeof r.collectionId === 'string' ? r : { ...r, collectionId: DEFAULT_COLLECTION_ID, folderId: null },
  );
  writeJson(SAVED_KEY, migrated);
  return migrated;
};

const readSavedRequests = (): SavedRequest[] => {
  const raw = readJson<unknown[]>(SAVED_KEY, []);
  const records = Array.isArray(raw) ? raw.filter(isValidSavedRequestShape) : [];
  return migrateSavedRequests(records);
};

export const listSavedRequests = (): SavedRequest[] => [...readSavedRequests()].sort((a, b) => b.updatedAt - a.updatedAt);

export const getSavedRequest = (id: string): SavedRequest | undefined => readSavedRequests().find((s) => s.id === id);

export const upsertSavedRequest = (saved: SavedRequest): void => {
  const sanitized: SavedRequest = { ...saved, request: redactSecrets(saved.request) };
  const all = readSavedRequests();
  const idx = all.findIndex((existing) => existing.id === sanitized.id);
  if (idx >= 0) all[idx] = sanitized;
  else all.push(sanitized);
  writeJson(SAVED_KEY, all);
};

export const renameSavedRequest = (id: string, name: string): void => {
  const all = readSavedRequests();
  const idx = all.findIndex((existing) => existing.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], name, updatedAt: Date.now() };
  writeJson(SAVED_KEY, all);
};

export const deleteSavedRequest = (id: string): void => {
  writeJson(SAVED_KEY, readSavedRequests().filter((existing) => existing.id !== id));
};

/** Relocates a saved request between collections/folders/collection-root. Only organizational
 *  metadata changes — the request configuration itself (url, headers, body, {{variables}}, …)
 *  is left completely untouched. */
export const moveSavedRequest = (id: string, collectionId: string, folderId: string | null): void => {
  const all = readSavedRequests();
  const idx = all.findIndex((existing) => existing.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], collectionId, folderId, updatedAt: Date.now() };
  writeJson(SAVED_KEY, all);
};

/** Creates an independent copy right alongside the original (same collection/folder) with a new
 *  id and fresh timestamps. `original.request` is already redacted/unresolved from when it was
 *  first saved, and cloneRequest() deep-copies every array/object on it, so the copy can never
 *  share mutable state with — or leak a secret that wasn't already in — the original. */
export const duplicateSavedRequest = (id: string): SavedRequest | undefined => {
  const all = readSavedRequests();
  const original = all.find((existing) => existing.id === id);
  if (!original) return undefined;

  const now = Date.now();
  const copy: SavedRequest = {
    ...original,
    id: nextId(),
    name: `${original.name} (copy)`,
    createdAt: now,
    updatedAt: now,
    request: cloneRequest(original.request),
  };
  writeJson(SAVED_KEY, [...all, copy]);
  return copy;
};

// Off by default, and only ever changed by an explicit action in the CORS
// Proxy settings modal — never flipped on implicitly.
export const getCorsProxySettings = (): CorsProxySettings => readJson(CORS_PROXY_KEY, DEFAULT_CORS_PROXY_SETTINGS);

export const saveCorsProxySettings = (settings: CorsProxySettings): void => writeJson(CORS_PROXY_KEY, settings);

interface EnvironmentsState {
  environments: Environment[];
  activeEnvironmentId: string | null;
}

const EMPTY_ENVIRONMENTS_STATE: EnvironmentsState = { environments: [], activeEnvironmentId: null };

const isValidVariable = (v: unknown): v is EnvironmentVariable =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as EnvironmentVariable).id === 'string' &&
  typeof (v as EnvironmentVariable).key === 'string' &&
  typeof (v as EnvironmentVariable).value === 'string';

const isValidEnvironment = (e: unknown): e is Environment =>
  typeof e === 'object' &&
  e !== null &&
  typeof (e as Environment).id === 'string' &&
  typeof (e as Environment).name === 'string' &&
  Array.isArray((e as Environment).variables) &&
  (e as Environment).variables.every(isValidVariable);

// Defensive beyond readJson's own try/catch: guards against well-formed JSON in the wrong shape
// (e.g. hand-edited localStorage, or a future format change) so a corrupt record can never crash
// the app — it just falls back to an empty environment list.
const readEnvironmentsState = (): EnvironmentsState => {
  const raw = readJson<Partial<EnvironmentsState>>(ENVIRONMENTS_KEY, EMPTY_ENVIRONMENTS_STATE);
  const environments = Array.isArray(raw.environments) ? raw.environments.filter(isValidEnvironment) : [];
  const activeEnvironmentId =
    typeof raw.activeEnvironmentId === 'string' && environments.some((e) => e.id === raw.activeEnvironmentId)
      ? raw.activeEnvironmentId
      : null;
  return { environments, activeEnvironmentId };
};

const writeEnvironmentsState = (state: EnvironmentsState): void => writeJson(ENVIRONMENTS_KEY, state);

export const listEnvironments = (): Environment[] => readEnvironmentsState().environments;

export const getActiveEnvironmentId = (): string | null => readEnvironmentsState().activeEnvironmentId;

// No validity check against the environment list here — deletion already clears the id when it
// was pointing at the deleted environment, and this setter runs right after the caller read a
// known-good id from the same list, so re-validating would only add a redundant read.
export const setActiveEnvironmentId = (id: string | null): void => {
  const state = readEnvironmentsState();
  writeEnvironmentsState({ ...state, activeEnvironmentId: id });
};

export const upsertEnvironment = (environment: Environment): void => {
  const state = readEnvironmentsState();
  const idx = state.environments.findIndex((e) => e.id === environment.id);
  const environments =
    idx >= 0 ? state.environments.map((e, i) => (i === idx ? environment : e)) : [...state.environments, environment];
  writeEnvironmentsState({ ...state, environments });
};

export const deleteEnvironment = (id: string): void => {
  const state = readEnvironmentsState();
  writeEnvironmentsState({
    environments: state.environments.filter((e) => e.id !== id),
    activeEnvironmentId: state.activeEnvironmentId === id ? null : state.activeEnvironmentId,
  });
};

interface CollectionsState {
  collections: Collection[];
  folders: Folder[];
}

const EMPTY_COLLECTIONS_STATE: CollectionsState = { collections: [], folders: [] };

const isValidCollection = (c: unknown): c is Collection =>
  typeof c === 'object' &&
  c !== null &&
  typeof (c as Collection).id === 'string' &&
  typeof (c as Collection).name === 'string' &&
  typeof (c as Collection).createdAt === 'number' &&
  typeof (c as Collection).updatedAt === 'number';

const isValidFolder = (f: unknown): f is Folder =>
  typeof f === 'object' &&
  f !== null &&
  typeof (f as Folder).id === 'string' &&
  typeof (f as Folder).collectionId === 'string' &&
  ((f as Folder).parentFolderId === null || typeof (f as Folder).parentFolderId === 'string') &&
  typeof (f as Folder).name === 'string' &&
  typeof (f as Folder).createdAt === 'number' &&
  typeof (f as Folder).updatedAt === 'number';

const ensureDefaultCollection = (state: CollectionsState): CollectionsState => {
  if (state.collections.some((c) => c.id === DEFAULT_COLLECTION_ID)) return state;
  const now = Date.now();
  return {
    ...state,
    collections: [...state.collections, { id: DEFAULT_COLLECTION_ID, name: DEFAULT_COLLECTION_NAME, createdAt: now, updatedAt: now }],
  };
};

// Defensive beyond readJson's own try/catch, same as environments: guards against well-formed
// JSON in the wrong shape so a corrupt record can never crash the app. Also always guarantees the
// default collection exists — every function in this section reads through here, so a folder or
// saved request that references it (including one from a save that happens before the user has
// ever opened the collection browser) is never mistaken for an orphan pointing at a deleted
// collection and dropped.
const readCollectionsState = (): CollectionsState => {
  const raw = readJson<Partial<CollectionsState>>(COLLECTIONS_KEY, EMPTY_COLLECTIONS_STATE);
  const collections = Array.isArray(raw.collections) ? raw.collections.filter(isValidCollection) : [];
  const collectionIds = new Set(collections.map((c) => c.id));
  const validFolders = (Array.isArray(raw.folders) ? raw.folders.filter(isValidFolder) : []).filter((f) =>
    collectionIds.has(f.collectionId),
  );
  const folderIds = new Set(validFolders.map((f) => f.id));
  // A folder whose parent no longer exists (corrupt/partial write) is promoted to root rather
  // than dropped — safer than silently deleting a whole subtree over one bad ancestor record.
  const folders = validFolders.map((f) => (f.parentFolderId && !folderIds.has(f.parentFolderId) ? { ...f, parentFolderId: null } : f));

  const ensured = ensureDefaultCollection({ collections, folders });
  if (ensured.collections !== collections) writeJson(COLLECTIONS_KEY, ensured);
  return ensured;
};

const writeCollectionsState = (state: CollectionsState): void => writeJson(COLLECTIONS_KEY, state);

export const listCollections = (): Collection[] => [...readCollectionsState().collections].sort((a, b) => a.createdAt - b.createdAt);

export const listFolders = (): Folder[] => readCollectionsState().folders;

export const upsertCollection = (collection: Collection): void => {
  const state = readCollectionsState();
  const idx = state.collections.findIndex((c) => c.id === collection.id);
  const collections = idx >= 0 ? state.collections.map((c, i) => (i === idx ? collection : c)) : [...state.collections, collection];
  writeCollectionsState({ ...state, collections });
};

/** Cascades: every folder in the collection, and every saved request in the collection (folder
 *  or root), goes with it. The UI is responsible for confirming this scope with the user first
 *  (see collectionContentsSummary) — this function trusts the caller and just executes it. */
export const deleteCollection = (id: string): void => {
  const state = readCollectionsState();
  writeCollectionsState({ collections: state.collections.filter((c) => c.id !== id), folders: state.folders.filter((f) => f.collectionId !== id) });
  writeJson(SAVED_KEY, readSavedRequests().filter((r) => r.collectionId !== id));
};

export const upsertFolder = (folder: Folder): void => {
  const state = readCollectionsState();
  const idx = state.folders.findIndex((f) => f.id === folder.id);
  const folders = idx >= 0 ? state.folders.map((f, i) => (i === idx ? folder : f)) : [...state.folders, folder];
  writeCollectionsState({ ...state, folders });
};

/** Cascades to the folder's whole subtree (see descendantFolderIds) and every saved request
 *  inside any of those folders — same "UI confirms first, this just executes" contract as
 *  deleteCollection. */
export const deleteFolder = (id: string): void => {
  const state = readCollectionsState();
  const idsToRemove = new Set([id, ...descendantFolderIds(state.folders, id)]);
  writeCollectionsState({ ...state, folders: state.folders.filter((f) => !idsToRemove.has(f.id)) });
  writeJson(
    SAVED_KEY,
    readSavedRequests().filter((r) => !(r.folderId && idsToRemove.has(r.folderId))),
  );
};
