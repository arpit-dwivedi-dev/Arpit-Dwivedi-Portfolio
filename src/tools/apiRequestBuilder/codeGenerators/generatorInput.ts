import type { ApiRequest, Authentication, FormField, HttpMethod } from '../types';
import { resolveRequest, hasEnabledCookieHeader } from '../resolveRequest';
import { resolveRequestVariables } from '../environment';
import { tryParseJson } from '../jsonUtils';

export interface GeneratorFormField {
  key: string;
  value: string;
  isFile: boolean;
  fileName?: string;
}

export type GeneratorBody =
  | { mode: 'none' }
  | { mode: 'json'; raw: string; parsed: ReturnType<typeof tryParseJson> }
  | { mode: 'text'; raw: string }
  | { mode: 'form-urlencoded'; fields: GeneratorFormField[] }
  | { mode: 'multipart'; fields: GeneratorFormField[] };

export interface GeneratorInput {
  method: HttpMethod;
  /** Fully resolved — enabled params merged in, bearer/basic/api-key-in-header auth merged in as
   *  headers, api-key-in-query merged into the query string, auto Content-Type applied. The same
   *  representation every generator (cURL included) reads from, so there's exactly one place that
   *  interprets what a request "actually" sends. */
  url: string;
  headers: Array<[string, string]>;
  body: GeneratorBody;
  /** Raw (variable-resolved) auth config, kept alongside the merged `headers` above so a generator
   *  that wants idiomatic native auth support (e.g. Python's `auth=(user, pass)`) can special-case
   *  it instead of only ever seeing the pre-encoded Authorization header. */
  auth: Authentication;
  timeoutMs: number;
  credentials: RequestCredentials;
  cookieHeaderPresent: boolean;
}

const enabledFormFields = (fields: FormField[]): GeneratorFormField[] =>
  fields
    .filter((f) => f.enabled && f.key.trim() !== '')
    .map((f) => ({ key: f.key, value: f.value, isFile: Boolean(f.isFile), fileName: f.fileName }));

/** Builds the single normalized representation every code generator works from — variable
 *  substitution then request resolution, exactly like send() and generateCurlCommand() do, so
 *  generated code can never drift from what the tool would actually send. */
export const buildGeneratorInput = (request: ApiRequest, variables: Record<string, string> = {}): GeneratorInput => {
  const resolvedRequest = resolveRequestVariables(request, variables);
  const resolved = resolveRequest(resolvedRequest);

  const bodyAllowed = resolvedRequest.method !== 'GET' && resolvedRequest.method !== 'HEAD';
  let body: GeneratorBody = { mode: 'none' };
  if (bodyAllowed) {
    switch (resolvedRequest.body.mode) {
      case 'json':
        body = { mode: 'json', raw: resolvedRequest.body.raw, parsed: tryParseJson(resolvedRequest.body.raw) };
        break;
      case 'text':
        body = { mode: 'text', raw: resolvedRequest.body.raw };
        break;
      case 'form-urlencoded':
        body = { mode: 'form-urlencoded', fields: enabledFormFields(resolvedRequest.body.formFields) };
        break;
      case 'multipart':
        body = { mode: 'multipart', fields: enabledFormFields(resolvedRequest.body.formFields) };
        break;
      default:
        body = { mode: 'none' };
    }
  }

  return {
    method: resolvedRequest.method,
    url: resolved.url,
    headers: resolved.headers,
    body,
    auth: resolvedRequest.auth,
    timeoutMs: resolvedRequest.timeoutMs,
    credentials: resolvedRequest.credentials,
    cookieHeaderPresent: hasEnabledCookieHeader(resolvedRequest.headers),
  };
};
