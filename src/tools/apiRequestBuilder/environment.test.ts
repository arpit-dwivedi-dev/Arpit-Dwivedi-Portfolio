import { createBlankRequest, createRow, type ApiRequest, type FormField } from './types';
import { resolveRequest } from './resolveRequest';
import {
  createEnvironment,
  extractVariableNames,
  findReferencedVariableNames,
  findUnknownVariableNames,
  resolveRequestVariables,
  resolveVariables,
  sanitizeVariables,
  variablesToMap,
  type EnvironmentVariable,
} from './environment';

describe('resolveVariables', () => {
  it('substitutes a single variable', () => {
    expect(resolveVariables('{{baseUrl}}/users', { baseUrl: 'https://api.example.com' })).toBe('https://api.example.com/users');
  });

  it('substitutes multiple different variables in the same string', () => {
    expect(resolveVariables('{{baseUrl}}/users/{{userId}}', { baseUrl: 'https://api.example.com', userId: '123' })).toBe(
      'https://api.example.com/users/123',
    );
  });

  it('substitutes a repeated occurrence of the same variable', () => {
    expect(resolveVariables('{{id}}-{{id}}', { id: 'abc' })).toBe('abc-abc');
  });

  it('leaves an unknown variable unchanged rather than replacing it with an empty string', () => {
    expect(resolveVariables('{{missing}}', {})).toBe('{{missing}}');
  });

  it('leaves an unknown variable unchanged even when other variables in the same string resolve', () => {
    expect(resolveVariables('{{baseUrl}}/{{missing}}', { baseUrl: 'https://api.example.com' })).toBe(
      'https://api.example.com/{{missing}}',
    );
  });

  it('resolves plain text mixed with variables', () => {
    expect(resolveVariables('hello {{name}}, welcome', { name: 'Ada' })).toBe('hello Ada, welcome');
  });

  it('substitutes a variable explicitly defined with an empty value, distinct from an unknown one', () => {
    expect(resolveVariables('[{{empty}}]', { empty: '' })).toBe('[]');
  });

  it('does not treat `{{var name}}` (a space inside the braces) as a variable', () => {
    expect(resolveVariables('{{var name}}', { 'var name': 'x' })).toBe('{{var name}}');
  });

  it('does not treat an empty `{{}}` as a variable', () => {
    expect(resolveVariables('{{}}', {})).toBe('{{}}');
  });

  it('does not treat single braces `{var}` as variable syntax', () => {
    expect(resolveVariables('{var}', { var: 'x' })).toBe('{var}');
  });

  it('allows letters, numbers, underscore, and hyphen in a variable name', () => {
    expect(resolveVariables('{{api-key_2}}', { 'api-key_2': 'ok' })).toBe('ok');
  });

  it('returns an empty string unchanged', () => {
    expect(resolveVariables('', { baseUrl: 'x' })).toBe('');
  });
});

describe('extractVariableNames', () => {
  it('returns names referenced in a string, deduped', () => {
    expect(extractVariableNames('{{a}}/{{b}}/{{a}}')).toEqual(['a', 'b']);
  });

  it('returns an empty array when there is nothing to extract', () => {
    expect(extractVariableNames('no variables here')).toEqual([]);
  });
});

describe('sanitizeVariables', () => {
  const row = (key: string, value: string): EnvironmentVariable => ({ id: `${key}-id`, key, value });

  it('drops rows with a blank (or whitespace-only) key', () => {
    const result = sanitizeVariables([row('', 'x'), row('   ', 'y'), row('baseUrl', 'https://api.example.com')]);
    expect(result).toEqual([row('baseUrl', 'https://api.example.com')]);
  });

  it('trims a key with leading/trailing whitespace', () => {
    const result = sanitizeVariables([{ id: '1', key: '  baseUrl  ', value: 'x' }]);
    expect(result).toEqual([{ id: '1', key: 'baseUrl', value: 'x' }]);
  });

  it('keeps only the last row when two rows share the same trimmed key', () => {
    const result = sanitizeVariables([row('token', 'first'), row('token', 'second')]);
    expect(result).toEqual([row('token', 'second')]);
  });
});

describe('variablesToMap', () => {
  it('builds a key/value map from an environment, applying sanitization', () => {
    const env = createEnvironment('Staging');
    env.variables = [
      { id: '1', key: 'baseUrl', value: 'https://staging.example.com' },
      { id: '2', key: '', value: 'ignored' },
    ];
    expect(variablesToMap(env)).toEqual({ baseUrl: 'https://staging.example.com' });
  });

  it('returns an empty map for a null/undefined environment ("No Environment")', () => {
    expect(variablesToMap(null)).toEqual({});
    expect(variablesToMap(undefined)).toEqual({});
  });
});

describe('findReferencedVariableNames / findUnknownVariableNames', () => {
  const requestWithVariables = (): ApiRequest => ({
    ...createBlankRequest(),
    url: '{{baseUrl}}/users/{{userId}}',
    params: [{ ...createRow(), key: 'q', value: '{{query}}' }],
    headers: [{ ...createRow(), key: 'X-Client-{{env}}', value: '{{clientId}}' }],
    auth: { type: 'bearer', bearerToken: '{{token}}', basicUsername: '', basicPassword: '', apiKeyName: '', apiKeyValue: '', apiKeyLocation: 'header' },
    body: { mode: 'json', raw: '{"email":"{{email}}"}', formFields: [] },
  });

  it('collects every variable referenced across url/params/headers/auth/body', () => {
    expect(findReferencedVariableNames(requestWithVariables())).toEqual(
      ['baseUrl', 'clientId', 'email', 'env', 'query', 'token', 'userId'].sort(),
    );
  });

  it('returns an empty list for a request with no variable syntax', () => {
    expect(findReferencedVariableNames(createBlankRequest())).toEqual([]);
  });

  it('reports only the names missing from the variables map', () => {
    const unknown = findUnknownVariableNames(requestWithVariables(), { baseUrl: 'https://api.example.com', token: 'abc' });
    expect(unknown).toEqual(['clientId', 'email', 'env', 'query', 'userId'].sort());
  });

  it('reports every referenced name as unknown when the map is empty (no environment selected)', () => {
    expect(findUnknownVariableNames(requestWithVariables(), {})).toEqual(
      ['baseUrl', 'clientId', 'email', 'env', 'query', 'token', 'userId'].sort(),
    );
  });
});

describe('resolveRequestVariables', () => {
  it('returns the same object reference when there are no variables to apply (no active environment)', () => {
    const request = createBlankRequest();
    expect(resolveRequestVariables(request, {})).toBe(request);
  });

  it('resolves a variable in the URL', () => {
    const request: ApiRequest = { ...createBlankRequest(), url: '{{baseUrl}}/users' };
    expect(resolveRequestVariables(request, { baseUrl: 'https://api.example.com' }).url).toBe('https://api.example.com/users');
  });

  it('resolves a variable in a query parameter value', () => {
    const request: ApiRequest = { ...createBlankRequest(), params: [{ ...createRow(), key: 'userId', value: '{{userId}}' }] };
    const resolved = resolveRequestVariables(request, { userId: '123' });
    expect(resolved.params[0].value).toBe('123');
  });

  it('resolves a variable in a header value', () => {
    const request: ApiRequest = { ...createBlankRequest(), headers: [{ ...createRow(), key: 'X-Client-ID', value: '{{clientId}}' }] };
    const resolved = resolveRequestVariables(request, { clientId: 'abc-123' });
    expect(resolved.headers[0].value).toBe('abc-123');
  });

  it('resolves a variable in a bearer token', () => {
    const request: ApiRequest = {
      ...createBlankRequest(),
      auth: { type: 'bearer', bearerToken: '{{token}}', basicUsername: '', basicPassword: '', apiKeyName: '', apiKeyValue: '', apiKeyLocation: 'header' },
    };
    const resolved = resolveRequestVariables(request, { token: 'secret-token' });
    expect(resolved.auth.bearerToken).toBe('secret-token');
  });

  it('resolves a variable in an API key value', () => {
    const request: ApiRequest = {
      ...createBlankRequest(),
      auth: { type: 'api-key', bearerToken: '', basicUsername: '', basicPassword: '', apiKeyName: 'X-Api-Key', apiKeyValue: '{{apiKey}}', apiKeyLocation: 'header' },
    };
    const resolved = resolveRequestVariables(request, { apiKey: 'super-secret' });
    expect(resolved.auth.apiKeyValue).toBe('super-secret');
  });

  it('resolves a variable inside a JSON body', () => {
    const request: ApiRequest = {
      ...createBlankRequest(),
      method: 'POST',
      body: { mode: 'json', raw: '{"email":"{{email}}"}', formFields: [] },
    };
    const resolved = resolveRequestVariables(request, { email: 'a@example.com' });
    expect(resolved.body.raw).toBe('{"email":"a@example.com"}');
  });

  it('resolves a variable inside a raw text body', () => {
    const request: ApiRequest = { ...createBlankRequest(), method: 'POST', body: { mode: 'text', raw: 'hello {{name}}', formFields: [] } };
    const resolved = resolveRequestVariables(request, { name: 'Ada' });
    expect(resolved.body.raw).toBe('hello Ada');
  });

  it('resolves a variable inside a form-urlencoded field value', () => {
    const fields: FormField[] = [{ ...createRow(), key: 'username', value: '{{username}}' }];
    const request: ApiRequest = { ...createBlankRequest(), method: 'POST', body: { mode: 'form-urlencoded', raw: '', formFields: fields } };
    const resolved = resolveRequestVariables(request, { username: 'ada' });
    expect(resolved.body.formFields[0].value).toBe('ada');
  });

  it('resolves a variable inside a multipart form-data field value', () => {
    const fields: FormField[] = [{ ...createRow(), key: 'note', value: '{{note}}' }];
    const request: ApiRequest = { ...createBlankRequest(), method: 'POST', body: { mode: 'multipart', raw: '', formFields: fields } };
    const resolved = resolveRequestVariables(request, { note: 'hello' });
    expect(resolved.body.formFields[0].value).toBe('hello');
  });

  it('leaves unknown variables in place across every field, rather than blanking them', () => {
    const request: ApiRequest = { ...createBlankRequest(), url: '{{baseUrl}}/users' };
    expect(resolveRequestVariables(request, {}).url).toBe('{{baseUrl}}/users');
  });

  it('never mutates the original request object', () => {
    const request: ApiRequest = { ...createBlankRequest(), url: '{{baseUrl}}/users' };
    const snapshot = JSON.stringify(request);
    resolveRequestVariables(request, { baseUrl: 'https://api.example.com' });
    expect(JSON.stringify(request)).toBe(snapshot);
  });

  it('feeds correctly into resolveRequest() end-to-end (url + header + bearer token + JSON body)', () => {
    const request: ApiRequest = {
      ...createBlankRequest(),
      method: 'POST',
      url: '{{baseUrl}}/users',
      headers: [{ ...createRow(), key: 'X-Client-ID', value: '{{clientId}}' }],
      auth: { type: 'bearer', bearerToken: '{{token}}', basicUsername: '', basicPassword: '', apiKeyName: '', apiKeyValue: '', apiKeyLocation: 'header' },
      body: { mode: 'json', raw: '{"email":"{{email}}"}', formFields: [] },
    };
    const variables = { baseUrl: 'https://api.example.com', clientId: 'c-1', token: 'tok-1', email: 'a@example.com' };
    const resolved = resolveRequest(resolveRequestVariables(request, variables));

    expect(resolved.url).toBe('https://api.example.com/users');
    expect(resolved.headers).toContainEqual(['X-Client-ID', 'c-1']);
    expect(resolved.headers).toContainEqual(['Authorization', 'Bearer tok-1']);
    expect(resolved.bodyText).toBe('{"email":"a@example.com"}');
  });
});
