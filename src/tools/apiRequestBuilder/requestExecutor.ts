import type { ApiRequest, ApiResponse, RequestFailure } from './types';
import { resolveRequest } from './resolveRequest';
import { validateJson } from './jsonUtils';
import { validateUrl } from './urlUtils';

export interface ExecuteOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT_MS = 30_000;
// Guards the UI against freezing on a pathological multi-hundred-MB response —
// not a real network cap, just a display/storage safety valve.
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
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const externalSignal = options.signal;
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort);

  const start = performance.now();
  try {
    const response = await fetch(resolved.url, {
      method: request.method,
      headers: resolved.headers,
      body: resolved.bodyInit,
      signal: controller.signal,
    });
    const timeMs = performance.now() - start;

    const headerEntries: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headerEntries[key] = value;
    });

    const bodyText = await response.text();
    const sizeBytes = new Blob([bodyText]).size;
    const truncated = bodyText.length > MAX_BODY_CHARS;
    const finalBodyText = truncated ? bodyText.slice(0, MAX_BODY_CHARS) : bodyText;

    const contentType = headerEntries['content-type'] ?? '';
    const isJson = contentType.includes('application/json') || (!contentType && looksLikeJsonBody(finalBodyText));

    return {
      status: response.status,
      statusText: response.statusText,
      headers: headerEntries,
      body: finalBodyText,
      timeMs,
      sizeBytes,
      isJson,
      truncated,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (timedOut) {
        throw new RequestExecutionError({ kind: 'timeout', message: `Request timed out after ${(timeoutMs / 1000).toFixed(0)}s.` });
      }
      throw new RequestExecutionError({ kind: 'aborted', message: 'Request cancelled.' });
    }
    if (err instanceof TypeError) {
      throw new RequestExecutionError({
        kind: 'network-or-cors',
        message:
          'The request failed before a response came back. This is almost always either a network problem (no connection, DNS failure, the server is down) or your browser blocking the request because the API does not allow requests from this origin (CORS). The browser does not expose enough detail to tell which — check the Network tab in DevTools for more.',
      });
    }
    const message = err instanceof Error ? err.message : 'Something went wrong sending this request.';
    throw new RequestExecutionError({ kind: 'unknown', message });
  } finally {
    window.clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
};
