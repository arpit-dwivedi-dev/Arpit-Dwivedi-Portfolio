import LZString from 'lz-string';
import { isSensitiveHeader } from './storage';
import { extractVariableNames } from './environment';
import { normalizeUnknownRequest } from './requestValidation';
import type { ApiRequest } from './types';

// Imported as the CJS default rather than named bindings (`import { compressToEncodedURIComponent }
// from 'lz-string'`) — lz-string assigns `module.exports = LZString` as a single external
// identifier, which Node's CJS/ESM interop (cjs-module-lexer) can't statically resolve into named
// exports. That only ever surfaced once a build script (scripts/generate-sitemap.mjs, via tsx's
// native Node ESM loader) imported this module for the first time; Vite and Jest already tolerate
// either form. Destructuring the default export works identically in every environment.
const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } = LZString;

export const SHARE_QUERY_PARAM = 'request';

// Same soft ceiling used by the DBML Diagram Builder's URL-share feature (see
// tools/dbmlDiagramBuilder/persistence/urlShare.ts): most modern browsers accept URLs
// well past this, but older proxies/chat apps/servers start truncating or rejecting
// GET URLs around 8k characters. 6,000 compressed characters leaves headroom for the
// origin+path prefix while still fitting a JSON request definition tens of KB large —
// lz-string typically compresses repetitive JSON like this 3-6x.
export const MAX_SHARE_ENCODED_LENGTH = 6_000;

const SHARE_FORMAT_VERSION = 1;

interface SharePayload {
  v: number;
  request: ApiRequest;
}

const UNABLE_TO_LOAD = 'Unable to load shared request.';
const TOO_LARGE = 'Request is too large to create a share link.';

// A value that references at least one {{variable}} carries no secret of its own — the
// real value lives in an environment, which a share payload never includes — so it's safe
// to leave untouched. Only a literal (non-templated) value in a credential-shaped field is
// treated as an actual secret and redacted. This is why share sanitization can't just call
// storage.redactSecrets(): that function (correctly, for persistence) redacts every
// sensitive-named field unconditionally, which would also destroy a perfectly safe
// `Authorization: Bearer {{token}}` header — exactly the "keep variable templates intact"
// requirement a share link depends on (see PART 3/4).
const isTemplated = (value: string): boolean => extractVariableNames(value).length > 0;
const redactUnlessTemplated = (value: string): string => (isTemplated(value) ? value : '');

/** Strips literal (non-templated) auth secrets and credential-shaped header values before a
 *  request ever gets JSON-serialized for a share link — a share URL is more exposed than
 *  localStorage (browser history, chat logs, screenshots), so it must never carry a
 *  plaintext credential even if the user typed one in directly instead of using an
 *  environment variable. */
export const sanitizeForShare = (request: ApiRequest): ApiRequest => ({
  ...request,
  headers: request.headers.map((h) => (isSensitiveHeader(h) ? { ...h, value: redactUnlessTemplated(h.value) } : h)),
  body: {
    ...request.body,
    // A File object can never survive JSON/URL serialization — dropped the same way
    // storage.ts strips it before persisting, so only the field's name/label carries over.
    formFields: request.body.formFields.map(({ file: _file, ...field }) => field),
  },
  auth: {
    ...request.auth,
    bearerToken: request.auth.type === 'bearer' ? redactUnlessTemplated(request.auth.bearerToken) : request.auth.bearerToken,
    basicPassword: request.auth.type === 'basic' ? redactUnlessTemplated(request.auth.basicPassword) : request.auth.basicPassword,
    apiKeyValue: request.auth.type === 'api-key' ? redactUnlessTemplated(request.auth.apiKeyValue) : request.auth.apiKeyValue,
  },
});

// Flat shape rather than a discriminated union — this project's tsconfig doesn't enable
// `strict`, so without strictNullChecks TS's control-flow narrowing on a boolean
// discriminant (`if (!result.ok)`) doesn't reliably eliminate union members, so callers
// would need unsafe casts either way (same reasoning as curlParser.ts's CurlParseResult).
export interface EncodeShareResult {
  ok: boolean;
  encoded?: string;
  error?: string;
}

export interface DecodeShareResult {
  ok: boolean;
  request?: ApiRequest;
  error?: string;
}

/** Serializes a request into a compact, URL-safe payload: sanitize → JSON → lz-string
 *  compress. Compression is for URL length only — it is NOT encryption or an access
 *  control mechanism; the only reason this is safe to put in a URL is that secrets were
 *  already stripped by sanitizeForShare above. */
export const encodeShareRequest = (request: ApiRequest): EncodeShareResult => {
  const payload: SharePayload = { v: SHARE_FORMAT_VERSION, request: sanitizeForShare(request) };
  const encoded = compressToEncodedURIComponent(JSON.stringify(payload));
  if (!encoded || encoded.length > MAX_SHARE_ENCODED_LENGTH) {
    return { ok: false, error: TOO_LARGE };
  }
  return { ok: true, encoded };
};

/** Reverses encodeShareRequest, tolerating every way a share URL can go wrong since it's
 *  entirely user-controlled input: hand-edited, truncated by a chat app, copied from an
 *  older/newer version of this tool, or just garbage. Never throws — every failure path
 *  returns the same generic message so a bad link degrades to "couldn't load it" rather
 *  than crashing the editor. */
export const decodeShareRequest = (encoded: string): DecodeShareResult => {
  if (!encoded) return { ok: false, error: UNABLE_TO_LOAD };
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return { ok: false, error: UNABLE_TO_LOAD };

    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) return { ok: false, error: UNABLE_TO_LOAD };

    const request = normalizeUnknownRequest((parsed as { request?: unknown }).request);
    if (!request) return { ok: false, error: UNABLE_TO_LOAD };

    return { ok: true, request };
  } catch {
    return { ok: false, error: UNABLE_TO_LOAD };
  }
};

/** Builds the full shareable URL from a page URL (origin + pathname) and an already
 *  -encoded payload. Any pre-existing query string/hash on `baseUrl` is dropped — a share
 *  link should point at nothing but the shared request. */
export const buildShareUrl = (baseUrl: string, encoded: string): string => {
  const url = new URL(baseUrl);
  url.search = '';
  url.hash = '';
  url.searchParams.set(SHARE_QUERY_PARAM, encoded);
  return url.toString();
};

/** Reads the share payload out of a `location.search` string, or null if absent. */
export const readShareParam = (search: string): string | null => new URLSearchParams(search).get(SHARE_QUERY_PARAM);
