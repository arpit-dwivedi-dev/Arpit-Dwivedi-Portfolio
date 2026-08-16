export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface RequestParameter {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestHeader {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export const BODY_MODES = ['none', 'json', 'text', 'form-urlencoded', 'multipart'] as const;
export type BodyMode = (typeof BODY_MODES)[number];

export interface FormField {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  /** multipart only. */
  isFile?: boolean;
  fileName?: string;
  /** In-memory only — never persisted (localStorage can't hold binary data), so
   *  saved requests/history keep the field's name but drop the actual file. */
  file?: File;
}

export interface RequestBody {
  mode: BodyMode;
  /** Raw editor content, used for 'json' and 'text' modes. */
  raw: string;
  /** Row editor content, used for 'form-urlencoded' and 'multipart' modes. */
  formFields: FormField[];
}

export const AUTH_TYPES = ['none', 'bearer', 'basic', 'api-key'] as const;
export type AuthType = (typeof AUTH_TYPES)[number];

export type ApiKeyLocation = 'header' | 'query';

export interface Authentication {
  type: AuthType;
  bearerToken: string;
  basicUsername: string;
  basicPassword: string;
  apiKeyName: string;
  apiKeyValue: string;
  apiKeyLocation: ApiKeyLocation;
}

// `RequestCredentials` is the built-in DOM lib type for fetch()'s `credentials` option
// ('omit' | 'same-origin' | 'include') — reused directly rather than redeclared so the
// request model can never drift out of sync with what fetch() actually accepts.
export const CREDENTIALS_MODES: readonly RequestCredentials[] = ['same-origin', 'include', 'omit'] as const;
export const DEFAULT_CREDENTIALS: RequestCredentials = 'same-origin';

// Fixed, curated set rather than a free-text field — an arbitrary timeout invites typos
// (`3000` vs `30000`) and an "unlimited" option is deliberately omitted: a hung request
// with no ceiling can only ever be stopped by remembering to hit Cancel, which is worse
// UX than picking a generous upper bound (120s) up front.
export const TIMEOUT_OPTIONS_MS: readonly number[] = [5_000, 10_000, 30_000, 60_000, 120_000] as const;
export const DEFAULT_TIMEOUT_MS = 30_000;

export interface ApiRequest {
  id: string;
  method: HttpMethod;
  url: string;
  params: RequestParameter[];
  headers: RequestHeader[];
  body: RequestBody;
  auth: Authentication;
  timeoutMs: number;
  credentials: RequestCredentials;
}

export type ResponseBodyKind = 'json' | 'xml' | 'html' | 'image' | 'text' | 'binary';

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  timeMs: number;
  sizeBytes: number;
  /** true when `bodyText` was truncated for display/storage safety. Never true for binary/image
   *  bodies — those are never converted to a giant string in the first place, see requestExecutor. */
  truncated: boolean;

  /** `type/subtype` from the response's Content-Type header, lowercased and stripped of
   *  parameters (e.g. `charset`). Empty string when the header was absent. */
  contentType: string;
  /** How the response body was classified — drives which viewer the UI renders. */
  bodyKind: ResponseBodyKind;
  /** Convenience flag mirroring `bodyKind === 'json'`, kept so existing JSON-tree logic doesn't
   *  need to compare the union type everywhere. */
  isJson: boolean;
  /** Decoded text — populated for json/xml/html/text bodies. Empty string for image/binary bodies,
   *  which are never decoded to text (avoids duplicating megabytes of binary as a string). */
  bodyText: string;
  /** Raw bytes — populated only for image/binary bodies. Undefined for text-kind bodies, so a
   *  response body only ever exists as one representation at a time, never both. */
  bodyBytes?: ArrayBuffer;
  /** Sanitized filename suggested by the response (from Content-Disposition, or a content-kind
   *  default) — used by the download button. */
  filename: string;
}

export type RequestErrorKind = 'invalid-url' | 'invalid-json' | 'network-or-cors' | 'timeout' | 'aborted' | 'unknown';

export interface RequestFailure {
  kind: RequestErrorKind;
  message: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  request: ApiRequest;
  status?: number;
  statusText?: string;
  timeMs?: number;
  error?: string;
}

export interface SavedRequest {
  id: string;
  /** Always set — every saved request belongs to a collection, including the auto-created
   *  default one so saving never requires the user to create a collection first. */
  collectionId: string;
  /** null = collection root, not inside any folder. */
  folderId: string | null;
  name: string;
  createdAt: number;
  updatedAt: number;
  request: ApiRequest;
}

let idCounter = 0;
/** Deterministic-enough unique id for row keys — no crypto dependency needed for local-only state. */
export const nextId = (): string => {
  idCounter += 1;
  return `${Date.now().toString(36)}-${idCounter.toString(36)}`;
};

export const createRow = (): RequestParameter => ({ id: nextId(), key: '', value: '', enabled: true });

export const createEmptyAuth = (): Authentication => ({
  type: 'none',
  bearerToken: '',
  basicUsername: '',
  basicPassword: '',
  apiKeyName: '',
  apiKeyValue: '',
  apiKeyLocation: 'header',
});

export const createEmptyBody = (): RequestBody => ({
  mode: 'none',
  raw: '',
  formFields: [],
});

export const createBlankRequest = (): ApiRequest => ({
  id: nextId(),
  method: 'GET',
  url: '',
  params: [],
  headers: [],
  body: createEmptyBody(),
  auth: createEmptyAuth(),
  timeoutMs: DEFAULT_TIMEOUT_MS,
  credentials: DEFAULT_CREDENTIALS,
});

/** Backfills fields that didn't exist when a request was written to localStorage, so
 *  history/saved records from before this feature keep loading and behaving exactly as
 *  they did before (30s timeout, same-origin credentials) instead of ending up `undefined`. */
export const normalizeRequest = (request: ApiRequest): ApiRequest => ({
  ...request,
  timeoutMs:
    typeof request.timeoutMs === 'number' && Number.isFinite(request.timeoutMs) && request.timeoutMs > 0
      ? request.timeoutMs
      : DEFAULT_TIMEOUT_MS,
  credentials: (CREDENTIALS_MODES as readonly string[]).includes(request.credentials)
    ? request.credentials
    : DEFAULT_CREDENTIALS,
});

export const cloneRequest = (request: ApiRequest): ApiRequest => ({
  ...request,
  id: nextId(),
  params: request.params.map((p) => ({ ...p })),
  headers: request.headers.map((h) => ({ ...h })),
  body: { ...request.body, formFields: request.body.formFields.map((f) => ({ ...f })) },
  auth: { ...request.auth },
});
