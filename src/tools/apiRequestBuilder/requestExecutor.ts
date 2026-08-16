import { DEFAULT_TIMEOUT_MS, type ApiRequest, type ApiResponse, type RequestFailure, type ResponseBodyKind } from './types';
import { resolveRequest } from './resolveRequest';
import { validateJson } from './jsonUtils';
import { validateUrl } from './urlUtils';
import { classifyContentType, defaultFilename, parseContentDispositionFilename } from './contentType';

export interface ExecuteOptions {
  /** Overrides `request.timeoutMs` — used by the CORS-proxy pool fallback to probe each
   *  candidate with its own short, fixed budget regardless of the user's configured timeout. */
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Rewrites the resolved target URL (e.g. to route through an opt-in CORS proxy) right
   *  before fetch — kept separate from resolveRequest so cURL export never includes it. */
  rewriteUrl?: (url: string) => string;
}

// Guards the UI against freezing on a pathological multi-hundred-MB text response —
// not a real network cap, just a display/storage safety valve. Never applied to binary/image
// bytes: truncating those would corrupt them, so they're left whole (see PART 9 of the response
// handling spec) and only their metadata is shown until the user asks to preview/download.
const MAX_BODY_CHARS = 2_000_000;

const looksLikeJsonBody = (text: string): boolean => {
  const trimmed = text.trim();
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
};

export class RequestExecutionError extends Error {
  kind: RequestFailure['kind'];
  constructor(failure: RequestFailure) {
    super(failure.message);
    this.kind = failure.kind;
  }
}

export const executeRequest = async (request: ApiRequest, options: ExecuteOptions = {}): Promise<ApiResponse> => {
  const urlValidation = validateUrl(request.url);
  if (!urlValidation.valid) {
    throw new RequestExecutionError({ kind: 'invalid-url', message: urlValidation.error ?? 'Invalid URL.' });
  }

  if (request.body.mode === 'json' && request.body.raw.trim() !== '') {
    const validation = validateJson(request.body.raw);
    if (!validation.valid) {
      throw new RequestExecutionError({ kind: 'invalid-json', message: `Request body isn't valid JSON: ${validation.error}` });
    }
  }

  const resolved = resolveRequest(request);
  const controller = new AbortController();
  let timedOut = false;
  // request.timeoutMs is the user-configured value; options.timeoutMs (proxy-pool probes) wins when set.
  const timeoutMs = options.timeoutMs ?? request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const externalSignal = options.signal;
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort);

  const fetchUrl = options.rewriteUrl ? options.rewriteUrl(resolved.url) : resolved.url;

  const start = performance.now();
  try {
    const response = await fetch(fetchUrl, {
      method: request.method,
      headers: resolved.headers,
      body: resolved.bodyInit,
      signal: controller.signal,
      credentials: request.credentials ?? 'same-origin',
    });
    const timeMs = performance.now() - start;

    const headerEntries: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headerEntries[key] = value;
    });

    // Always read as bytes, never response.text() — decoding a binary body (image, pdf, zip...)
    // as text and later re-encoding it for download is lossy and corrupts the payload (PART 1/8).
    const bytes = await response.arrayBuffer();
    const sizeBytes = bytes.byteLength;

    const contentType = headerEntries['content-type'] ?? '';
    const classification = classifyContentType(contentType);
    let bodyKind: ResponseBodyKind = classification.kind;

    let bodyText = '';
    let bodyBytes: ArrayBuffer | undefined;
    let truncated = false;

    if (bodyKind === 'image' || bodyKind === 'binary') {
      bodyBytes = bytes;
    } else {
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      truncated = decoded.length > MAX_BODY_CHARS;
      bodyText = truncated ? decoded.slice(0, MAX_BODY_CHARS) : decoded;

      if (bodyKind === 'json') {
        // Content-Type claimed JSON but the body doesn't actually parse — fall back to a plain
        // text view instead of crashing the JSON tree (PART 4). A truncated body can legitimately
        // fail to parse even when the untruncated original was valid, so only demote when whole.
        if (!truncated && !looksLikeJsonBody(bodyText)) bodyKind = 'text';
      } else if (bodyKind === 'text' && !contentType && looksLikeJsonBody(bodyText)) {
        // No Content-Type header at all — same conservative auto-detection the tool always did.
        bodyKind = 'json';
      }
    }

    const dispositionFilename = parseContentDispositionFilename(headerEntries['content-disposition']);
    const filename = dispositionFilename ?? defaultFilename(bodyKind, classification.mimeType);

    return {
      status: response.status,
      statusText: response.statusText,
      headers: headerEntries,
      timeMs,
      sizeBytes,
      truncated,
      contentType: classification.mimeType,
      bodyKind,
      isJson: bodyKind === 'json',
      bodyText,
      bodyBytes,
      filename,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (timedOut) {
        throw new RequestExecutionError({
          kind: 'timeout',
          message: `Request timed out after ${(timeoutMs / 1000).toFixed(0)}s — this is your configured request timeout, adjustable from the Timeout control in the toolbar.`,
        });
      }
      throw new RequestExecutionError({ kind: 'aborted', message: 'Request cancelled.' });
    }
    if (err instanceof TypeError) {
      throw new RequestExecutionError({
        kind: 'network-or-cors',
        message:
          'The request failed before a response came back. This is almost always either a network problem (no connection, DNS failure, the server is down) or your browser blocking the request because the API does not allow requests from this origin (CORS). The browser does not expose enough detail to tell which — check the Network tab in DevTools for more. If it is CORS, you can opt into routing this request through a proxy from the CORS Proxy button in the toolbar.',
      });
    }
    const message = err instanceof Error ? err.message : 'Something went wrong sending this request.';
    throw new RequestExecutionError({ kind: 'unknown', message });
  } finally {
    window.clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
};
