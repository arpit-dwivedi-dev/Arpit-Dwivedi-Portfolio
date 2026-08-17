import { TOOLS } from '../registry';
import { SHARE_QUERY_PARAM, encodeShareRequest } from './shareRequest';
import {
  DEFAULT_CREDENTIALS,
  DEFAULT_TIMEOUT_MS,
  createBlankRequest,
  createEmptyAuth,
  createEmptyBody,
  createRow,
  nextId,
  type ApiRequest,
  type Authentication,
  type BodyMode,
  type HttpMethod,
  type RequestBody,
} from './types';

// Content-level model for an interactive API example embedded in guide/article
// content (see PART 2 of the content brief). This is deliberately NOT a second
// HTTP request schema — `ApiExample.request` is a real `ApiRequest`, built by
// createApiExample() below from a smaller, author-friendly shape. Content
// authors never construct headers/params/body rows by hand.
export interface ApiExample {
  title: string;
  description?: string;
  request: ApiRequest;
}

export interface ApiExampleKeyValueInput {
  key: string;
  value: string;
  enabled?: boolean;
}

// A multipart form row. `isFile` marks the row as a file field, which is the only
// safe way a static example can express one: it opens in the tool as an empty file
// picker ("Choose file…" — see FormFieldsEditor) that the reader attaches their own
// local file to. Deliberately no filename and no path — a public, static content
// example can never reference a real file on disk, and a `File` object can't survive
// JSON/URL serialization into a share link anyway (sanitizeForShare drops it).
export interface ApiExampleFormFieldInput extends ApiExampleKeyValueInput {
  /** multipart only — `form-urlencoded` has no file rows (see BodyEditor's `allowFiles`). */
  isFile?: boolean;
}

// Either a convenience `json` value (stringified for the author) or the raw
// RequestBody shape for text/form-urlencoded/multipart examples.
export type ApiExampleBodyInput =
  | { mode: Exclude<BodyMode, 'none'>; raw: string; formFields?: never }
  | { mode: Extract<BodyMode, 'form-urlencoded' | 'multipart'>; formFields: ApiExampleFormFieldInput[]; raw?: never };

export interface ApiExampleAuthInput extends Partial<Authentication> {
  type: Authentication['type'];
}

export interface ApiExampleInput {
  title: string;
  description?: string;
  method?: HttpMethod;
  url: string;
  params?: ApiExampleKeyValueInput[];
  headers?: ApiExampleKeyValueInput[];
  /** Convenience for a JSON body — sets body.mode to 'json' and stringifies this value.
   *  Ignored if `body` is also given. */
  json?: unknown;
  body?: ApiExampleBodyInput;
  auth?: ApiExampleAuthInput;
  timeoutMs?: number;
  credentials?: ApiRequest['credentials'];
}

const buildKeyValueRows = (inputs: ApiExampleKeyValueInput[] | undefined) =>
  (inputs ?? []).map((input) => ({ ...createRow(), key: input.key, value: input.value, enabled: input.enabled ?? true }));

const buildBody = (input: ApiExampleInput): RequestBody => {
  if (input.body) {
    return {
      mode: input.body.mode,
      raw: input.body.raw ?? '',
      formFields: (input.body.formFields ?? []).map((field) => ({
        id: nextId(),
        key: field.key,
        value: field.value,
        enabled: field.enabled ?? true,
        // Only ever set when true — an absent `isFile` keeps the row byte-identical to
        // what it was before file fields were expressible here, and `fileName`/`file`
        // are never set at all, so the row arrives as an empty "Choose file…" picker.
        ...(field.isFile ? { isFile: true } : {}),
      })),
    };
  }
  if (input.json !== undefined) {
    return { mode: 'json', raw: JSON.stringify(input.json, null, 2), formFields: [] };
  }
  return createEmptyBody();
};

const buildAuth = (input: ApiExampleAuthInput | undefined): Authentication => ({ ...createEmptyAuth(), ...input });

/** Builds a full, valid `ApiRequest` from a small author-friendly description — the
 *  same pattern as EXAMPLE_REQUESTS in exampleRequests.ts, just parameterized so guide
 *  content can define its own examples instead of the tool's built-in empty-state ones.
 *  Every field not supplied falls back to the same defaults `createBlankRequest()` uses,
 *  so an example request behaves identically to one a user typed in by hand. */
export const createApiExample = (input: ApiExampleInput): ApiExample => ({
  title: input.title,
  description: input.description,
  request: {
    ...createBlankRequest(),
    method: input.method ?? 'GET',
    url: input.url,
    params: buildKeyValueRows(input.params),
    headers: buildKeyValueRows(input.headers),
    body: buildBody(input),
    auth: buildAuth(input.auth),
    timeoutMs: input.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    credentials: input.credentials ?? DEFAULT_CREDENTIALS,
  },
});

const API_REQUEST_BUILDER_TOOL = TOOLS.find((tool) => tool.id === 'api-request-builder')!;

/** Canonical relative route for the API Request Builder — derived from the tool
 *  registry (see PART 11) rather than a literal string, so it can never drift out of
 *  sync with the tool's actual category/path. Never an absolute URL: no origin, no
 *  localhost, no deployment domain baked in. */
export const API_REQUEST_BUILDER_PATH = `/tools/${API_REQUEST_BUILDER_TOOL.category}/${API_REQUEST_BUILDER_TOOL.path}`;

/** Converts a content example's request into the exact share-URL format the API
 *  Request Builder itself produces (see shareRequest.ts's Share button) — sanitization,
 *  compression, and the 6,000-character ceiling are all inherited from
 *  `encodeShareRequest`, not reimplemented here. Only the relative path + query string
 *  are assembled locally.
 *
 *  Throws rather than returning an error union: this runs synchronously from a guide
 *  page's render (and is snapshotted verbatim by the Puppeteer prerender pass — see
 *  scripts/prerender.mjs), so an unencodable example (oversized, in practice) must fail
 *  loudly in dev/tests rather than silently render a dead CTA (see PART 12).
 *
 *  Security note: because this delegates to encodeShareRequest, the returned URL can
 *  never contain a literal secret — sanitizeForShare (called internally) strips any
 *  non-templated credential-shaped value first. `{{variable}}` templates are preserved
 *  untouched, exactly as they are for the tool's own Share button. */
export const buildApiExampleUrl = (request: ApiRequest): string => {
  const encoded = encodeShareRequest(request);
  if (!encoded.ok || !encoded.encoded) {
    throw new Error(
      `Could not build an "Open in API Request Builder" link for ${request.method} ${request.url}: ${encoded.error ?? 'unknown encoding error'}`,
    );
  }
  const query = new URLSearchParams({ [SHARE_QUERY_PARAM]: encoded.encoded }).toString();
  return `${API_REQUEST_BUILDER_PATH}?${query}`;
};

const CONTENT_TYPE_BY_BODY_MODE: Partial<Record<BodyMode, string>> = {
  json: 'application/json',
  'form-urlencoded': 'application/x-www-form-urlencoded',
  multipart: 'multipart/form-data',
};

/** A short, human-readable preview of a request — method + URL, plus at most one
 *  supplementary line, never a dump of every header/body field (see PART 7). Kept as a
 *  plain pure function (rather than inline JSX) so it's independently testable without
 *  a DOM/React renderer, which this repo's Jest config doesn't set up (node test env). */
export const summarizeApiExampleRequest = (request: ApiRequest): string[] => {
  const lines = [`${request.method} ${request.url}`];
  const contentType = CONTENT_TYPE_BY_BODY_MODE[request.body.mode];
  if (contentType) lines.push(`Content-Type: ${contentType}`);
  return lines;
};
