import {
  AUTH_TYPES,
  BODY_MODES,
  CREDENTIALS_MODES,
  DEFAULT_CREDENTIALS,
  DEFAULT_TIMEOUT_MS,
  HTTP_METHODS,
  createEmptyAuth,
  createEmptyBody,
  nextId,
  type ApiRequest,
  type Authentication,
  type FormField,
  type HttpMethod,
  type RequestBody,
  type RequestHeader,
  type RequestParameter,
} from './types';

// Shared by shareRequest.ts (decoding a share URL) and importFormat.ts (reading an
// imported JSON file) — both hand this module data that came from outside the app
// (a URL a stranger sent, a file picked from disk), so every field here is treated
// as untrusted and rebuilt from scratch rather than cast.

const isString = (v: unknown): v is string => typeof v === 'string';
const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean';
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const sanitizeRow = (raw: unknown): RequestParameter | RequestHeader | null => {
  if (!isObject(raw) || !isString(raw.key) || !isString(raw.value)) return null;
  return { id: nextId(), key: raw.key, value: raw.value, enabled: isBoolean(raw.enabled) ? raw.enabled : true };
};

const sanitizeRows = (raw: unknown): RequestParameter[] =>
  Array.isArray(raw) ? raw.map(sanitizeRow).filter((r): r is RequestParameter => r !== null) : [];

const sanitizeFormField = (raw: unknown): FormField | null => {
  if (!isObject(raw) || !isString(raw.key) || !isString(raw.value)) return null;
  const field: FormField = { id: nextId(), key: raw.key, value: raw.value, enabled: isBoolean(raw.enabled) ? raw.enabled : true };
  if (raw.isFile === true) {
    field.isFile = true;
    // No `file` — a File object can never survive JSON/URL serialization, so an
    // imported/shared file field always needs to be re-attached manually.
    if (isString(raw.fileName)) field.fileName = raw.fileName;
  }
  return field;
};

const sanitizeBody = (raw: unknown): RequestBody => {
  if (!isObject(raw)) return createEmptyBody();
  const mode = isString(raw.mode) && (BODY_MODES as readonly string[]).includes(raw.mode) ? (raw.mode as RequestBody['mode']) : 'none';
  const formFields = Array.isArray(raw.formFields)
    ? raw.formFields.map(sanitizeFormField).filter((f): f is FormField => f !== null)
    : [];
  return { mode, raw: isString(raw.raw) ? raw.raw : '', formFields };
};

const sanitizeAuth = (raw: unknown): Authentication => {
  const base = createEmptyAuth();
  if (!isObject(raw)) return base;
  return {
    type: isString(raw.type) && (AUTH_TYPES as readonly string[]).includes(raw.type) ? (raw.type as Authentication['type']) : 'none',
    bearerToken: isString(raw.bearerToken) ? raw.bearerToken : '',
    basicUsername: isString(raw.basicUsername) ? raw.basicUsername : '',
    basicPassword: isString(raw.basicPassword) ? raw.basicPassword : '',
    apiKeyName: isString(raw.apiKeyName) ? raw.apiKeyName : '',
    apiKeyValue: isString(raw.apiKeyValue) ? raw.apiKeyValue : '',
    apiKeyLocation: raw.apiKeyLocation === 'query' ? 'query' : 'header',
  };
};

/** Rebuilds an `ApiRequest` from an untrusted, unknown-shaped value — a decoded share
 *  payload or an entry from an imported JSON file. Every field falls back to a safe
 *  default (unsupported method → GET, invalid credentials → same-origin, unrecognized
 *  extra fields are simply never read) rather than rejecting outright, so a share link
 *  or export file from a slightly different app version still loads instead of hard
 *  failing. Only `url` is required — with nothing else recognizable as a request, there's
 *  no reasonable request to reconstruct, so this returns `null` and the caller treats the
 *  whole payload/entry as invalid. */
export const normalizeUnknownRequest = (raw: unknown): ApiRequest | null => {
  if (!isObject(raw) || !isString(raw.url)) return null;

  const method: HttpMethod = isString(raw.method) && (HTTP_METHODS as readonly string[]).includes(raw.method) ? (raw.method as HttpMethod) : 'GET';
  const timeoutMs =
    typeof raw.timeoutMs === 'number' && Number.isFinite(raw.timeoutMs) && raw.timeoutMs > 0 ? raw.timeoutMs : DEFAULT_TIMEOUT_MS;
  const credentials: RequestCredentials =
    isString(raw.credentials) && (CREDENTIALS_MODES as readonly string[]).includes(raw.credentials)
      ? (raw.credentials as RequestCredentials)
      : DEFAULT_CREDENTIALS;

  return {
    id: nextId(),
    method,
    url: raw.url,
    params: sanitizeRows(raw.params),
    headers: sanitizeRows(raw.headers) as RequestHeader[],
    body: sanitizeBody(raw.body),
    auth: sanitizeAuth(raw.auth),
    timeoutMs,
    credentials,
  };
};
