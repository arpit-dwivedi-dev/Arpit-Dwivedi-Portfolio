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

export interface ApiRequest {
  id: string;
  method: HttpMethod;
  url: string;
  params: RequestParameter[];
  headers: RequestHeader[];
  body: RequestBody;
  auth: Authentication;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timeMs: number;
  sizeBytes: number;
  isJson: boolean;
  /** true when `body` was truncated for display/storage safety. */
  truncated: boolean;
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
});

export const cloneRequest = (request: ApiRequest): ApiRequest => ({
  ...request,
  id: nextId(),
  params: request.params.map((p) => ({ ...p })),
  headers: request.headers.map((h) => ({ ...h })),
  body: { ...request.body, formFields: request.body.formFields.map((f) => ({ ...f })) },
  auth: { ...request.auth },
});
