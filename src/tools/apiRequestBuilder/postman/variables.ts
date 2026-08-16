import { type ApiRequest } from '../types';
import { isNonEmptyString, isObject } from './validator';

// Postman's built-in dynamic variables ({{$randomUUID}}, {{$timestamp}}, {{$guid}}, ...) use a
// `$`-prefixed name this app's own VARIABLE_PATTERN (environment.ts) never matches — that pattern
// only allows [A-Za-z0-9_-], so `{{$randomUUID}}` already passes through resolveVariables()
// untouched as literal text. This importer only needs to *detect* them, to warn the user rather
// than let them silently appear to be a normal, resolvable `{{variable}}`.
const DYNAMIC_VARIABLE_PATTERN = /\{\{\$([A-Za-z0-9_]+)\}\}/g;

/** Dynamic Postman variable names (without the `$` or braces) referenced in `text`, deduped. */
export const findDynamicVariableNames = (text: string): string[] => {
  if (!text) return [];
  const names = new Set<string>();
  for (const match of text.matchAll(DYNAMIC_VARIABLE_PATTERN)) names.add(match[1]);
  return [...names];
};

/** Every text field a dynamic-variable scan needs to cover — mirrors environment.ts's
 *  requestTextFields so nothing importable is missed. */
export const findDynamicVariableNamesInRequest = (request: ApiRequest): string[] => {
  const fields = [
    request.url,
    ...request.params.flatMap((p) => [p.key, p.value]),
    ...request.headers.flatMap((h) => [h.key, h.value]),
    request.auth.bearerToken,
    request.auth.basicUsername,
    request.auth.basicPassword,
    request.auth.apiKeyName,
    request.auth.apiKeyValue,
    request.body.raw,
    ...request.body.formFields.flatMap((f) => [f.key, f.value]),
  ];
  const names = new Set<string>();
  for (const field of fields) for (const name of findDynamicVariableNames(field)) names.add(name);
  return [...names];
};

export interface PostmanVariableEntry {
  key: string;
  value: string;
  /** True when the value looks like a literal secret rather than a safe default/template, so the
   *  caller can leave it blank in the generated environment instead of persisting it (PART 12/30). */
  redacted: boolean;
}

const SECRET_KEY_PATTERN = /secret|token|password|passwd|api[-_]?key|auth|credential/i;

/** Heuristic used only for collection/folder/request-level `variable` *declarations* (their
 *  default values live directly in the collection file, unlike a request's own auth/header
 *  fields which already flow through storage.upsertSavedRequest's redactSecrets). A value that's
 *  itself a `{{...}}` template is never a literal secret. Otherwise a secret-shaped key name with
 *  a non-empty value is treated as one and blanked — better to under-import a default than to
 *  write a real credential to localStorage in plaintext (PART 30). */
const sanitizeVariableEntry = (key: string, value: string): PostmanVariableEntry => {
  if (value.includes('{{') || value === '') return { key, value, redacted: false };
  if (SECRET_KEY_PATTERN.test(key)) return { key, value: '', redacted: true };
  return { key, value, redacted: false };
};

const parseVariableArray = (raw: unknown): PostmanVariableEntry[] => {
  if (!Array.isArray(raw)) return [];
  const entries: PostmanVariableEntry[] = [];
  for (const item of raw) {
    if (!isObject(item) || !isNonEmptyString(item.key)) continue;
    const value = typeof item.value === 'string' ? item.value : item.value != null ? String(item.value) : '';
    entries.push(sanitizeVariableEntry(item.key, value));
  }
  return entries;
};

/** Merges collection → folder → request variable declarations into one flat, deduplicated list —
 *  later scopes override earlier ones by key, the same "most specific wins" rule used for auth
 *  inheritance (PART 22/23). Kept intentionally lightweight: this never introduces a new variable
 *  scope into the app, it only decides what one merged environment's defaults should be. */
export const mergePostmanVariables = (...scopes: unknown[][]): PostmanVariableEntry[] => {
  const byKey = new Map<string, PostmanVariableEntry>();
  for (const scope of scopes) {
    for (const entry of parseVariableArray(scope)) byKey.set(entry.key, entry);
  }
  return [...byKey.values()];
};
