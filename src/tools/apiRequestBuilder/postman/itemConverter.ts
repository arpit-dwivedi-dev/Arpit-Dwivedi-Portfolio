import { createBlankRequest, createRow, HTTP_METHODS, type ApiRequest, type HttpMethod, type RequestHeader } from '../types';
import { convertPostmanAuth, resolveEffectiveAuth } from './auth';
import { convertPostmanBody } from './body';
import { convertPostmanUrl } from './url';
import { isObject } from './validator';
import { findDynamicVariableNamesInRequest } from './variables';

export interface ConvertedItem {
  name: string;
  request: ApiRequest;
  unsupportedAuthWarning: string | null;
  unsupportedBodyWarning: string | null;
  dynamicVariableNames: string[];
}

const MAX_NAME_LENGTH = 80;
const collapseWhitespace = (s: string): string => s.replace(/\s+/g, ' ').trim();
const truncateName = (name: string): string => (name.length > MAX_NAME_LENGTH ? `${name.slice(0, MAX_NAME_LENGTH - 1)}…` : name);

/** `METHOD path` fallback when `item.name` is absent (PART 8) — mirrors OpenAPI's
 *  deriveOperationName fallback, capped the same way so a long URL never produces an unusable row. */
const deriveItemName = (method: string, url: string): string => truncateName(`${method} ${collapseWhitespace(url) || '(no URL)'}`);

const buildHeaders = (raw: unknown): RequestHeader[] => {
  if (!Array.isArray(raw)) return [];
  const rows: RequestHeader[] = [];
  for (const entry of raw) {
    if (!isObject(entry) || typeof entry.key !== 'string') continue;
    rows.push({ ...createRow(), key: entry.key, value: typeof entry.value === 'string' ? entry.value : '', enabled: entry.disabled !== true });
  }
  return rows;
};

/** Converts one Postman request item into a ready-to-save ApiRequest (PART 7/9/10/13/14/15/16).
 *  Returns null only when the item's method isn't one this app's model supports — never fabricates
 *  a method, the caller counts it as skipped instead (PART 9, PART 26: one bad item shouldn't fail
 *  the whole collection). `inheritedAuth` is the raw Postman auth resolved from the item's folder/
 *  collection ancestors (PART 22) — already itself resolved, so this function only needs to apply
 *  the request's own override rule once. */
export const convertItem = (item: Record<string, unknown>, inheritedAuth: unknown): ConvertedItem | null => {
  const request = isObject(item.request) ? item.request : {};

  const rawMethod = typeof request.method === 'string' ? request.method.toUpperCase() : 'GET';
  if (!(HTTP_METHODS as readonly string[]).includes(rawMethod)) return null;
  const method = rawMethod as HttpMethod;

  const { url, params } = convertPostmanUrl(request.url);
  const name = typeof item.name === 'string' && item.name.trim() !== '' ? truncateName(collapseWhitespace(item.name)) : deriveItemName(method, url);

  const apiRequest: ApiRequest = {
    ...createBlankRequest(),
    method,
    url,
    params,
    headers: buildHeaders(request.header),
  };

  let unsupportedBodyWarning: string | null = null;
  if (method !== 'GET' && method !== 'HEAD') {
    const bodyResult = convertPostmanBody(request.body);
    apiRequest.body = bodyResult.body;
    unsupportedBodyWarning = bodyResult.warning;
  }

  const effectiveAuth = resolveEffectiveAuth(request.auth, inheritedAuth);
  const { auth, warning: unsupportedAuthWarning } = convertPostmanAuth(effectiveAuth);
  if (auth) apiRequest.auth = auth;

  return {
    name,
    request: apiRequest,
    unsupportedAuthWarning: unsupportedAuthWarning ?? null,
    unsupportedBodyWarning,
    dynamicVariableNames: findDynamicVariableNamesInRequest(apiRequest),
  };
};
