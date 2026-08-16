import { createRefResolver } from './refs';
import { convertOperation, convertPathTemplate, type OperationConversionContext } from './operationConverter';

const ctx = (overrides: Partial<OperationConversionContext> = {}, root: Record<string, unknown> = {}): OperationConversionContext => ({
  resolve: createRefResolver(root),
  securitySchemes: {},
  globalSecurity: [],
  ...overrides,
});

describe('convertPathTemplate', () => {
  it('converts a single path parameter to {{name}} syntax', () => {
    expect(convertPathTemplate('/users/{userId}')).toBe('/users/{{userId}}');
  });

  it('converts multiple path parameters', () => {
    expect(convertPathTemplate('/orgs/{orgId}/repos/{repoId}')).toBe('/orgs/{{orgId}}/repos/{{repoId}}');
  });

  it('leaves a path with no parameters unchanged', () => {
    expect(convertPathTemplate('/users')).toBe('/users');
  });

  it('never fills in a concrete fake value for a path parameter', () => {
    expect(convertPathTemplate('/users/{userId}')).not.toMatch(/\d/);
  });
});

describe('convertOperation — methods', () => {
  it.each(['get', 'post', 'put', 'patch', 'delete'])('converts a %s operation', (method) => {
    const result = convertOperation('/things', method, {}, { summary: 'Do a thing' }, ctx());
    expect(result?.request.method).toBe(method.toUpperCase());
  });

  it('returns null for a method this app cannot represent (trace)', () => {
    const result = convertOperation('/things', 'trace', {}, { summary: 'Trace' }, ctx());
    expect(result).toBeNull();
  });

  it('returns null when the operation value is not an object', () => {
    const result = convertOperation('/things', 'get', {}, null, ctx());
    expect(result).toBeNull();
  });
});

describe('convertOperation — naming', () => {
  it('prefers operationId', () => {
    const result = convertOperation('/pets', 'get', {}, { operationId: 'listPets', summary: 'List all pets' }, ctx());
    expect(result?.name).toBe('listPets');
  });

  it('falls back to METHOD + path when there is no operationId or summary', () => {
    const result = convertOperation('/pets', 'get', {}, {}, ctx());
    expect(result?.name).toBe('GET /pets');
  });

  it('falls back to METHOD + summary when there is no operationId but there is a summary', () => {
    const result = convertOperation('/users', 'post', {}, { summary: 'Create a user' }, ctx());
    expect(result?.name).toBe('POST Create a user');
  });

  it('collapses internal whitespace in operationId', () => {
    const result = convertOperation('/pets', 'get', {}, { operationId: '  list   pets  ' }, ctx());
    expect(result?.name).toBe('list pets');
  });

  it('truncates an extremely long name', () => {
    const longId = 'x'.repeat(200);
    const result = convertOperation('/pets', 'get', {}, { operationId: longId }, ctx());
    expect(result!.name.length).toBeLessThanOrEqual(80);
    expect(result!.name.endsWith('…')).toBe(true);
  });
});

describe('convertOperation — tags', () => {
  it('captures declared tags', () => {
    const result = convertOperation('/pets', 'get', {}, { tags: ['Pets', 'Public'] }, ctx());
    expect(result?.tags).toEqual(['Pets', 'Public']);
  });

  it('has an empty tags array when none are declared', () => {
    const result = convertOperation('/pets', 'get', {}, {}, ctx());
    expect(result?.tags).toEqual([]);
  });
});

describe('convertOperation — parameters', () => {
  it('converts query parameters into request params', () => {
    const operation = { parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }] };
    const result = convertOperation('/pets', 'get', {}, operation, ctx());
    expect(result?.request.params).toEqual([expect.objectContaining({ key: 'limit', value: '0', enabled: true })]);
  });

  it('converts header parameters into request headers', () => {
    const operation = { parameters: [{ name: 'X-Request-Id', in: 'header', schema: { type: 'string' } }] };
    const result = convertOperation('/pets', 'get', {}, operation, ctx());
    expect(result?.request.headers).toEqual([expect.objectContaining({ key: 'X-Request-Id' })]);
  });

  it('excludes path parameters from params/headers (they become part of the URL)', () => {
    const operation = { parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string' } }] };
    const result = convertOperation('/pets/{petId}', 'get', {}, operation, ctx());
    expect(result?.request.params).toEqual([]);
    expect(result?.request.headers).toEqual([]);
    expect(result?.request.url).toBe('{{baseUrl}}/pets/{{petId}}');
  });

  it('skips browser-restricted headers (e.g. Cookie, Host) and reports the count', () => {
    const operation = { parameters: [{ name: 'Cookie', in: 'header' }, { name: 'X-Ok', in: 'header' }] };
    const result = convertOperation('/pets', 'get', {}, operation, ctx());
    expect(result?.request.headers).toEqual([expect.objectContaining({ key: 'X-Ok' })]);
    expect(result?.skippedHeaderCount).toBe(1);
  });

  it('skips cookie-in parameters and reports the count', () => {
    const operation = { parameters: [{ name: 'session', in: 'cookie' }] };
    const result = convertOperation('/pets', 'get', {}, operation, ctx());
    expect(result?.request.params).toEqual([]);
    expect(result?.skippedCookieCount).toBe(1);
  });

  it('merges path-item-level parameters with operation-level parameters, operation overriding by (name, in)', () => {
    const pathItem = { parameters: [{ name: 'limit', in: 'query', example: 10 }] };
    const operation = { parameters: [{ name: 'limit', in: 'query', example: 99 }, { name: 'offset', in: 'query', example: 0 }] };
    const result = convertOperation('/pets', 'get', pathItem, operation, ctx());
    const params = result?.request.params.map((p) => ({ key: p.key, value: p.value }));
    expect(params).toEqual(expect.arrayContaining([{ key: 'limit', value: '99' }, { key: 'offset', value: '0' }]));
    expect(params).toHaveLength(2);
  });

  it('resolves a $ref parameter', () => {
    const root = { components: { parameters: { LimitParam: { name: 'limit', in: 'query', example: 5 } } } };
    const operation = { parameters: [{ $ref: '#/components/parameters/LimitParam' }] };
    const result = convertOperation('/pets', 'get', {}, operation, ctx({}, root));
    expect(result?.request.params).toEqual([expect.objectContaining({ key: 'limit', value: '5' })]);
  });
});

describe('convertOperation — request body', () => {
  it('builds a JSON body from schema, preferring example', () => {
    const operation = {
      requestBody: { content: { 'application/json': { example: { name: 'Ada' }, schema: { type: 'object', properties: { name: { type: 'string' } } } } } },
    };
    const result = convertOperation('/users', 'post', {}, operation, ctx());
    expect(result?.request.body.mode).toBe('json');
    expect(JSON.parse(result!.request.body.raw)).toEqual({ name: 'Ada' });
  });

  it('builds a JSON body from examples (map) when there is no top-level example', () => {
    const operation = {
      requestBody: { content: { 'application/json': { examples: { sample: { value: { name: 'Grace' } } } } } },
    };
    const result = convertOperation('/users', 'post', {}, operation, ctx());
    expect(JSON.parse(result!.request.body.raw)).toEqual({ name: 'Grace' });
  });

  it('builds a JSON body from schema.default when there is no example', () => {
    const operation = {
      requestBody: { content: { 'application/json': { schema: { type: 'object', default: { active: true } } } } },
    };
    const result = convertOperation('/users', 'post', {}, operation, ctx());
    expect(JSON.parse(result!.request.body.raw)).toEqual({ active: true });
  });

  it('builds a JSON body from a schema-generated sample as the last resort', () => {
    const operation = {
      requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, age: { type: 'integer' } } } } } },
    };
    const result = convertOperation('/users', 'post', {}, operation, ctx());
    expect(JSON.parse(result!.request.body.raw)).toEqual({ name: '', age: 0 });
  });

  it('builds a form-urlencoded body from schema properties', () => {
    const operation = {
      requestBody: {
        content: { 'application/x-www-form-urlencoded': { schema: { type: 'object', properties: { username: { type: 'string' }, remember: { type: 'boolean' } } } } },
      },
    };
    const result = convertOperation('/login', 'post', {}, operation, ctx());
    expect(result?.request.body.mode).toBe('form-urlencoded');
    expect(result?.request.body.formFields.map((f) => ({ key: f.key, value: f.value }))).toEqual([
      { key: 'username', value: '' },
      { key: 'remember', value: 'true' },
    ]);
  });

  it('builds a multipart body and marks binary-format fields as files without content', () => {
    const operation = {
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: { type: 'object', properties: { title: { type: 'string' }, avatar: { type: 'string', format: 'binary' } } },
          },
        },
      },
    };
    const result = convertOperation('/upload', 'post', {}, operation, ctx());
    expect(result?.request.body.mode).toBe('multipart');
    const avatar = result?.request.body.formFields.find((f) => f.key === 'avatar');
    expect(avatar?.isFile).toBe(true);
    expect(avatar?.file).toBeUndefined();
    const title = result?.request.body.formFields.find((f) => f.key === 'title');
    expect(title?.isFile).toBeFalsy();
  });

  it('builds a text/plain body', () => {
    const operation = { requestBody: { content: { 'text/plain': { example: 'hello world' } } } };
    const result = convertOperation('/echo', 'post', {}, operation, ctx());
    expect(result?.request.body).toEqual({ mode: 'text', raw: 'hello world', formFields: [] });
  });

  it('imports without a body and reports the content type for an unsupported media type', () => {
    const operation = { requestBody: { content: { 'application/xml': { example: '<a/>' } } } };
    const result = convertOperation('/legacy', 'post', {}, operation, ctx());
    expect(result?.request.body.mode).toBe('none');
    expect(result?.unsupportedBodyWarning).toMatch(/application\/xml/);
  });

  it('never attaches a body to a GET request even if requestBody is (invalidly) present', () => {
    const operation = { requestBody: { content: { 'application/json': { example: { x: 1 } } } } };
    const result = convertOperation('/pets', 'get', {}, operation, ctx());
    expect(result?.request.body.mode).toBe('none');
  });
});

describe('convertOperation — security', () => {
  it('applies bearer auth resolved via the operation security requirement', () => {
    const root = { components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } } };
    const operation = { security: [{ bearerAuth: [] }] };
    const result = convertOperation(
      '/secure',
      'get',
      {},
      operation,
      ctx({ securitySchemes: (root.components as Record<string, unknown>).securitySchemes as Record<string, unknown>, globalSecurity: [] }, root),
    );
    expect(result?.request.auth.type).toBe('bearer');
    expect(result?.request.auth.bearerToken).toBe('');
  });

  it('inherits document-level security when the operation declares none', () => {
    const securitySchemes = { apiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' } };
    const result = convertOperation('/secure', 'get', {}, {}, ctx({ securitySchemes, globalSecurity: [{ apiKeyAuth: [] }] }));
    expect(result?.request.auth).toEqual(expect.objectContaining({ type: 'api-key', apiKeyName: 'X-API-Key' }));
  });

  it('leaves auth as none when the operation explicitly declares an empty security array', () => {
    const securitySchemes = { bearerAuth: { type: 'http', scheme: 'bearer' } };
    const result = convertOperation('/public', 'get', {}, { security: [] }, ctx({ securitySchemes, globalSecurity: [{ bearerAuth: [] }] }));
    expect(result?.request.auth.type).toBe('none');
  });

  it('surfaces a warning for an unsupported auth scheme (oauth2) without crashing', () => {
    const securitySchemes = { oauth2Auth: { type: 'oauth2', flows: {} } };
    const result = convertOperation('/secure', 'get', {}, { security: [{ oauth2Auth: [] }] }, ctx({ securitySchemes, globalSecurity: [] }));
    expect(result?.request.auth.type).toBe('none');
    expect(result?.unsupportedAuthWarning).toBeTruthy();
  });
});
