import { createBlankRequest, HTTP_METHODS, nextId, type ApiRequest, type FormField, type HttpMethod } from '../types';
import { derefOnce, type RefResolver } from './refs';
import { generateSchemaSample } from './sampleGenerator';
import { convertSecurityScheme, resolveOperationSecurity } from './security';
import { isNonEmptyString, isObject } from './validator';

export interface OperationConversionContext {
  resolve: RefResolver;
  securitySchemes: Record<string, unknown>;
  globalSecurity: unknown[];
}

export interface ConvertedOperation {
  name: string;
  tags: string[];
  request: ApiRequest;
  /** Structured signals rather than prose — the caller aggregates these across every operation
   *  into concise counts ("3 operations use unsupported authentication schemes") instead of
   *  repeating the same sentence once per operation (see PART 24/25/26: keep summaries concise). */
  unsupportedAuthWarning: string | null;
  skippedHeaderCount: number;
  skippedCookieCount: number;
  unsupportedBodyWarning: string | null;
}

const MAX_NAME_LENGTH = 80;

// Headers a browser's fetch() silently strips or refuses to let script set (the Fetch spec's
// "forbidden request-header name" list, trimmed to the ones an OpenAPI doc plausibly declares).
// Importing them as visible header rows would be misleading — they'd never actually go out.
const BROWSER_RESTRICTED_HEADERS = new Set([
  'host', 'content-length', 'connection', 'cookie', 'cookie2', 'date', 'dnt', 'expect',
  'keep-alive', 'origin', 'referer', 'set-cookie', 'trailer', 'transfer-encoding', 'upgrade', 'via',
]);

const collapseWhitespace = (s: string): string => s.replace(/\s+/g, ' ').trim();

const truncateName = (name: string): string => (name.length > MAX_NAME_LENGTH ? `${name.slice(0, MAX_NAME_LENGTH - 1)}…` : name);

const deriveOperationName = (method: string, path: string, operationId: unknown, summary: unknown): string => {
  if (isNonEmptyString(operationId)) return truncateName(collapseWhitespace(operationId));
  const fallbackSubject = isNonEmptyString(summary) ? collapseWhitespace(summary) : path;
  return truncateName(`${method} ${fallbackSubject}`);
};

const INVALID_VAR_CHARS = /[^A-Za-z0-9_-]/g;
const toVariableName = (raw: string): string => raw.trim().replace(INVALID_VAR_CHARS, '_') || 'param';

/** `/users/{userId}` -> `/users/{{userId}}` — OpenAPI's single-brace path templating converted
 *  to this app's `{{name}}` variable syntax (PART 11). Never fills in a fake concrete value. */
export const convertPathTemplate = (path: string): string => path.replace(/\{([^{}]+)\}/g, (_match, name: string) => `{{${toVariableName(name)}}}`);

const stringifyScalar = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
};

/** Shared by Parameter Objects and Media Type Objects — both carry the same `example` /
 *  `examples` (map of named Example Objects) / `schema` shape, so one function covers the
 *  priority order in PART 16 for both parameters and request bodies. */
const resolveExampleValue = (container: Record<string, unknown>, resolve: RefResolver): unknown => {
  if ('example' in container) return container.example;
  if (isObject(container.examples)) {
    const first = Object.values(container.examples)[0];
    if (isObject(first) && 'value' in first) return first.value;
  }
  const schema = derefOnce(container.schema, resolve);
  if (isObject(schema) && 'default' in schema) return schema.default;
  if (isObject(schema)) return generateSchemaSample(schema, resolve);
  return undefined;
};

interface ParsedParameter {
  name: string;
  in: string;
  value: string;
}

const parseParameters = (raw: unknown, resolve: RefResolver): ParsedParameter[] => {
  if (!Array.isArray(raw)) return [];
  const result: ParsedParameter[] = [];
  for (const entry of raw) {
    const param = derefOnce(entry, resolve);
    if (!isObject(param) || !isNonEmptyString(param.name) || !isNonEmptyString(param.in)) continue;
    result.push({ name: param.name, in: param.in, value: stringifyScalar(resolveExampleValue(param, resolve)) });
  }
  return result;
};

/** Path-item-level `parameters` apply to every operation under that path; operation-level
 *  `parameters` with the same (name, in) override them. Both may contain `$ref`s. */
const mergeParameters = (pathItemParams: unknown, operationParams: unknown, resolve: RefResolver): ParsedParameter[] => {
  const byKey = new Map<string, ParsedParameter>();
  for (const p of parseParameters(pathItemParams, resolve)) byKey.set(`${p.in}:${p.name}`, p);
  for (const p of parseParameters(operationParams, resolve)) byKey.set(`${p.in}:${p.name}`, p);
  return [...byKey.values()];
};

const BODY_TYPE_PRIORITY = ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'];

const chooseContentType = (contentTypes: string[]): string | undefined =>
  BODY_TYPE_PRIORITY.find((t) => contentTypes.includes(t)) ?? contentTypes.find((t) => t.endsWith('+json'));

/** Builds form rows (urlencoded/multipart) from a resolved object schema's declared properties
 *  when available (so field order/names match the spec even if the example value is partial),
 *  falling back to whatever keys the generated/explicit example value actually has. */
const buildFormFields = (schema: unknown, value: unknown, resolve: RefResolver, detectFiles: boolean): FormField[] => {
  const resolvedSchema = derefOnce(schema, resolve);
  const properties = isObject(resolvedSchema) && isObject(resolvedSchema.properties) ? resolvedSchema.properties : {};
  const valueObj = isObject(value) ? value : {};
  const keys = Object.keys(properties).length > 0 ? Object.keys(properties) : Object.keys(valueObj);

  return keys.map((key) => {
    const propSchema = derefOnce(properties[key], resolve);
    const isFile = detectFiles && isObject(propSchema) && (propSchema.format === 'binary' || typeof propSchema.contentMediaType === 'string');
    if (isFile) return { id: nextId(), key, value: '', enabled: true, isFile: true, fileName: '' };
    return { id: nextId(), key, value: stringifyScalar(valueObj[key]), enabled: true };
  });
};

interface BodyResult {
  body: ApiRequest['body'] | null;
  unsupportedBodyWarning: string | null;
}

const buildRequestBody = (requestBodyRaw: unknown, resolve: RefResolver): BodyResult => {
  const requestBody = derefOnce(requestBodyRaw, resolve);
  if (!isObject(requestBody) || !isObject(requestBody.content)) return { body: null, unsupportedBodyWarning: null };

  const contentTypes = Object.keys(requestBody.content);
  const chosen = chooseContentType(contentTypes);
  if (!chosen) {
    const warning = contentTypes.length > 0 ? `unsupported content type${contentTypes.length > 1 ? 's' : ''} (${contentTypes.join(', ')})` : null;
    return { body: null, unsupportedBodyWarning: warning };
  }

  const mediaTypeObj = requestBody.content[chosen];
  if (!isObject(mediaTypeObj)) return { body: null, unsupportedBodyWarning: null };
  const value = resolveExampleValue(mediaTypeObj, resolve);

  if (chosen === 'application/json' || chosen.endsWith('+json')) {
    return { body: { mode: 'json', raw: JSON.stringify(value ?? {}, null, 2), formFields: [] }, unsupportedBodyWarning: null };
  }
  if (chosen === 'application/x-www-form-urlencoded') {
    return {
      body: { mode: 'form-urlencoded', raw: '', formFields: buildFormFields(mediaTypeObj.schema, value, resolve, false) },
      unsupportedBodyWarning: null,
    };
  }
  if (chosen === 'multipart/form-data') {
    return {
      body: { mode: 'multipart', raw: '', formFields: buildFormFields(mediaTypeObj.schema, value, resolve, true) },
      unsupportedBodyWarning: null,
    };
  }
  // text/plain
  const raw = typeof value === 'string' ? value : value !== undefined ? JSON.stringify(value, null, 2) : '';
  return { body: { mode: 'text', raw, formFields: [] }, unsupportedBodyWarning: null };
};

/** Converts one OpenAPI operation (a method under a path) into a ready-to-save ApiRequest.
 *  Returns null for a method this app's request model can't represent (e.g. `trace`) or an
 *  operation entry that isn't an object — the caller counts those as skipped rather than
 *  failing the whole document (PART 26: one malformed endpoint shouldn't block the rest). */
export const convertOperation = (
  path: string,
  method: string,
  pathItem: Record<string, unknown>,
  operationRaw: unknown,
  ctx: OperationConversionContext,
): ConvertedOperation | null => {
  const httpMethod = method.toUpperCase();
  if (!(HTTP_METHODS as readonly string[]).includes(httpMethod)) return null;
  if (!isObject(operationRaw)) return null;
  const operation = operationRaw;

  const name = deriveOperationName(httpMethod, path, operation.operationId, operation.summary);
  const tags = Array.isArray(operation.tags) ? operation.tags.filter(isNonEmptyString).map((t) => t.trim()) : [];

  const params = mergeParameters(pathItem.parameters, operation.parameters, ctx.resolve);
  const queryRows = params.filter((p) => p.in === 'query').map((p) => ({ id: nextId(), key: p.name, value: p.value, enabled: true }));

  const headerRows: { id: string; key: string; value: string; enabled: boolean }[] = [];
  let skippedHeaderCount = 0;
  let skippedCookieCount = 0;
  for (const p of params) {
    if (p.in === 'header') {
      if (BROWSER_RESTRICTED_HEADERS.has(p.name.toLowerCase())) skippedHeaderCount++;
      else headerRows.push({ id: nextId(), key: p.name, value: p.value, enabled: true });
    } else if (p.in === 'cookie') {
      skippedCookieCount++;
    }
  }

  const request: ApiRequest = {
    ...createBlankRequest(),
    method: httpMethod as HttpMethod,
    url: `{{baseUrl}}${convertPathTemplate(path)}`,
    params: queryRows,
    headers: headerRows,
  };

  let unsupportedBodyWarning: string | null = null;
  if (httpMethod !== 'GET' && httpMethod !== 'HEAD') {
    const bodyResult = buildRequestBody(operation.requestBody, ctx.resolve);
    if (bodyResult.body) request.body = bodyResult.body;
    unsupportedBodyWarning = bodyResult.unsupportedBodyWarning;
  }

  let unsupportedAuthWarning: string | null = null;
  const { schemeName } = resolveOperationSecurity(operation.security, ctx.globalSecurity);
  if (schemeName) {
    const converted = convertSecurityScheme(ctx.securitySchemes[schemeName], schemeName);
    if (converted.auth) request.auth = converted.auth;
    if (converted.warning) unsupportedAuthWarning = converted.warning;
  }

  return { name, tags, request, unsupportedAuthWarning, skippedHeaderCount, skippedCookieCount, unsupportedBodyWarning };
};
