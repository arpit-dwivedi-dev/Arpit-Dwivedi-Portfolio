import { createRow, type RequestParameter } from './types';

/** Appends enabled, non-empty-key params onto `url`'s query string. Params with a value already
 *  containing `%` are assumed pre-encoded (common when pasted from a browser) and passed through as-is. */
export const buildUrlWithParams = (url: string, params: RequestParameter[]): string => {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  const enabled = params.filter((p) => p.enabled && p.key.trim() !== '');
  if (enabled.length === 0) return trimmed;

  const [base, existingQuery = ''] = trimmed.split('?');
  const search = new URLSearchParams(existingQuery);
  for (const param of enabled) {
    search.set(param.key, param.value);
  }
  const query = search.toString();
  return query ? `${base}?${query}` : base;
};

/** Splits a pasted URL's query string into param rows, so typing `?a=b&c=d` into the URL bar
 *  populates the Params tab the way Postman does. Returns the bare base URL alongside the rows. */
export const splitUrlIntoParams = (url: string): { base: string; params: RequestParameter[] } => {
  const [base, query] = url.split('?');
  if (!query) return { base, params: [] };

  const search = new URLSearchParams(query);
  const params: RequestParameter[] = [];
  search.forEach((value, key) => {
    params.push({ ...createRow(), key, value });
  });
  return { base, params };
};

export interface UrlValidation {
  valid: boolean;
  error?: string;
}

export const validateUrl = (url: string): UrlValidation => {
  const trimmed = url.trim();
  if (!trimmed) return { valid: false, error: 'URL is required.' };

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: `Unsupported protocol "${parsed.protocol}" — use http:// or https://.` };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'That doesn\'t look like a valid URL. Include the protocol, e.g. https://example.com.' };
  }
};

export const encodeUrlComponent = (text: string): string => {
  try {
    return encodeURIComponent(text);
  } catch {
    return text;
  }
};

export const decodeUrlComponent = (text: string): string => {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};
