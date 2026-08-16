import { nextId, type ApiRequest } from './types';

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
}

export const createEnvironmentVariable = (): EnvironmentVariable => ({ id: nextId(), key: '', value: '' });

export const createEnvironment = (name: string): Environment => ({ id: nextId(), name, variables: [] });

// Conservative, developer-friendly charset — letters, numbers, underscore, hyphen. No inner
// whitespace or punctuation, so the parser stays a single regex with no ambiguity about where a
// name ends (e.g. `{{a b}}` is just literal text, not a variable).
const VARIABLE_PATTERN = /\{\{([A-Za-z0-9_-]+)\}\}/g;

/** Names referenced by `{{name}}` syntax inside a single string, deduped, in first-seen order. */
export const extractVariableNames = (text: string): string[] => {
  if (!text) return [];
  const names: string[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(VARIABLE_PATTERN)) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
};

/** Replaces every `{{name}}` in `input` with `variables[name]`. A name with no matching entry is
 *  left untouched rather than becoming an empty string — that way a typo or an environment switch
 *  that's missing a variable fails loudly (`{{baseUrl}}` stays visible) instead of quietly sending
 *  a broken request. `hasOwnProperty` (not truthiness) is what lets a variable defined with an
 *  empty value still resolve to `''` instead of being treated as unknown. */
export const resolveVariables = (input: string, variables: Record<string, string>): string => {
  if (!input) return input;
  return input.replace(VARIABLE_PATTERN, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(variables, name) ? variables[name] : match,
  );
};

/** Every text field variables can appear in — the single source of truth for both resolution
 *  (resolveRequestVariables) and detection (findReferencedVariableNames), so a new field only
 *  needs to be added here once for both to pick it up. */
const requestTextFields = (request: ApiRequest): string[] => [
  request.url,
  ...request.params.flatMap((p) => [p.key, p.value]),
  ...request.headers.flatMap((h) => [h.key, h.value]),
  request.auth.bearerToken,
  request.auth.basicUsername,
  request.auth.basicPassword,
  request.auth.apiKeyName,
  request.auth.apiKeyValue,
  request.body.raw,
  ...request.body.formFields.flatMap((f) => [f.key, f.value]),
];

/** Every `{{name}}` referenced anywhere in the request, deduped and sorted. */
export const findReferencedVariableNames = (request: ApiRequest): string[] => {
  const names = new Set<string>();
  for (const text of requestTextFields(request)) {
    for (const name of extractVariableNames(text)) names.add(name);
  }
  return [...names].sort();
};

/** Referenced variable names that `variables` has no entry for — used to warn the user rather
 *  than silently sending `{{token}}` literally to the server. */
export const findUnknownVariableNames = (request: ApiRequest, variables: Record<string, string>): string[] =>
  findReferencedVariableNames(request).filter((name) => !Object.prototype.hasOwnProperty.call(variables, name));

/** Applies environment variable substitution to every field variables can appear in, producing a
 *  new ApiRequest with `{{name}}` replaced. This is the resolver stage that runs immediately
 *  before resolveRequest()/executeRequest() — its output is only ever handed to fetch() or a cURL
 *  string, never stored back into editor/history/saved-request state (see useApiRequestBuilder's
 *  `send`). Returns the same object when there's nothing to substitute, both as a cheap no-op path
 *  and so a request with no active environment behaves exactly as it did before this feature. */
export const resolveRequestVariables = (request: ApiRequest, variables: Record<string, string>): ApiRequest => {
  if (Object.keys(variables).length === 0) return request;

  const resolve = (text: string) => resolveVariables(text, variables);

  return {
    ...request,
    url: resolve(request.url),
    params: request.params.map((p) => ({ ...p, key: resolve(p.key), value: resolve(p.value) })),
    headers: request.headers.map((h) => ({ ...h, key: resolve(h.key), value: resolve(h.value) })),
    auth: {
      ...request.auth,
      bearerToken: resolve(request.auth.bearerToken),
      basicUsername: resolve(request.auth.basicUsername),
      basicPassword: resolve(request.auth.basicPassword),
      apiKeyName: resolve(request.auth.apiKeyName),
      apiKeyValue: resolve(request.auth.apiKeyValue),
    },
    body: {
      ...request.body,
      raw: resolve(request.body.raw),
      formFields: request.body.formFields.map((f) => ({ ...f, key: resolve(f.key), value: resolve(f.value) })),
    },
  };
};

/** Trims each key, drops rows with a blank name, and keeps only the last row for a repeated name
 *  — the rule applied right before persistence (empty/duplicate variable names never get saved)
 *  and reused by variablesToMap so resolution always agrees with what's actually stored. */
export const sanitizeVariables = (variables: EnvironmentVariable[]): EnvironmentVariable[] => {
  const byKey = new Map<string, EnvironmentVariable>();
  for (const variable of variables) {
    const key = variable.key.trim();
    if (!key) continue;
    byKey.set(key, { ...variable, key });
  }
  return [...byKey.values()];
};

/** Builds the flat key→value map resolveVariables() consumes, from an environment's variable
 *  rows. No active environment (`null`/`undefined`) resolves to an empty map, which is what makes
 *  "No Environment" a true no-op — every resolve() call becomes the identity function. */
export const variablesToMap = (environment: Environment | null | undefined): Record<string, string> => {
  const map: Record<string, string> = {};
  if (!environment) return map;
  for (const variable of sanitizeVariables(environment.variables)) {
    map[variable.key] = variable.value;
  }
  return map;
};
