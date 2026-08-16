import { createRow, type RequestParameter } from '../types';
import { isNonEmptyString, isObject } from './validator';

export interface ConvertedUrl {
  /** Base URL, query string stripped, with `{{var}}` templates preserved as-is. */
  url: string;
  params: RequestParameter[];
}

// Postman's legacy `:name` path-variable syntax (distinct from `{{name}}` environment/collection
// variables) — converted to this app's `{{name}}` syntax, mirroring how OpenAPI's operationConverter
// turns `{id}` into `{{id}}`. Never fills in a concrete value even when `url.variable` declares one.
const PATH_VAR_PATTERN = /:([A-Za-z0-9_]+)/g;
const convertPathVariables = (raw: string): string => raw.replace(PATH_VAR_PATTERN, (_match, name: string) => `{{${name}}}`);

const stripQueryString = (raw: string): string => raw.split('?')[0];

const buildQueryRowsFromArray = (raw: unknown): RequestParameter[] => {
  if (!Array.isArray(raw)) return [];
  const rows: RequestParameter[] = [];
  for (const entry of raw) {
    if (!isObject(entry) || typeof entry.key !== 'string') continue;
    rows.push({ ...createRow(), key: entry.key, value: typeof entry.value === 'string' ? entry.value : '', enabled: entry.disabled !== true });
  }
  return rows;
};

const buildQueryRowsFromString = (raw: string): RequestParameter[] => {
  const queryIdx = raw.indexOf('?');
  if (queryIdx === -1) return [];
  const search = new URLSearchParams(raw.slice(queryIdx + 1));
  const rows: RequestParameter[] = [];
  search.forEach((value, key) => rows.push({ ...createRow(), key, value, enabled: true }));
  return rows;
};

/** Builds a plausible raw URL string from Postman's structured `{protocol, host, path}` shape
 *  when `raw` is absent — joins host segments with `.` and path segments with `/`, the same way
 *  Postman itself derives `raw` from the structured form. */
const buildRawFromStructured = (urlObj: Record<string, unknown>): string => {
  const protocol = isNonEmptyString(urlObj.protocol) ? `${urlObj.protocol}://` : '';
  const host = Array.isArray(urlObj.host) ? urlObj.host.filter((h): h is string => typeof h === 'string').join('.') : '';
  const path = Array.isArray(urlObj.path) ? urlObj.path.filter((p): p is string => typeof p === 'string').join('/') : '';
  if (!host && !path) return '';
  return `${protocol}${host}${path ? `/${path}` : ''}`;
};

/** Converts a Postman `request.url`, which may be a plain string or a structured object with a
 *  `raw` field, structured `host`/`path` segments, and a `query` array (PART 10). `raw` is
 *  preferred whenever present since it's the URL string Postman itself showed the user; the
 *  structured `query` array is preferred over re-splitting `raw`'s query string since it's the
 *  only place a *disabled* query param survives (PART 13). */
export const convertPostmanUrl = (raw: unknown): ConvertedUrl => {
  if (typeof raw === 'string') {
    return { url: convertPathVariables(stripQueryString(raw)), params: buildQueryRowsFromString(raw) };
  }
  if (isObject(raw)) {
    const rawString = isNonEmptyString(raw.raw) ? raw.raw : buildRawFromStructured(raw);
    const url = convertPathVariables(stripQueryString(rawString));
    const params = Array.isArray(raw.query) ? buildQueryRowsFromArray(raw.query) : buildQueryRowsFromString(rawString);
    return { url, params };
  }
  return { url: '', params: [] };
};
