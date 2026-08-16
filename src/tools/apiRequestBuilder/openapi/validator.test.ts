import { validateOpenApiDocument } from './validator';

describe('validateOpenApiDocument', () => {
  it('accepts a minimal valid OpenAPI 3.0.x document', () => {
    const result = validateOpenApiDocument({ openapi: '3.0.3', paths: { '/users': {} } });
    expect(result.ok).toBe(true);
    expect(result.doc?.version).toBe('3.0.3');
  });

  it('accepts a minimal valid OpenAPI 3.1.x document', () => {
    const result = validateOpenApiDocument({ openapi: '3.1.0', paths: {} });
    expect(result.ok).toBe(true);
    expect(result.doc?.version).toBe('3.1.0');
  });

  it('rejects a Swagger 2.0 document', () => {
    const result = validateOpenApiDocument({ swagger: '2.0', paths: {} });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/OpenAPI 3\.0 and 3\.1/);
  });

  it('rejects a document with no version field at all', () => {
    const result = validateOpenApiDocument({ paths: {} });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/OpenAPI 3\.0 and 3\.1/);
  });

  it('rejects an unsupported version like 4.0.0', () => {
    const result = validateOpenApiDocument({ openapi: '4.0.0', paths: {} });
    expect(result.ok).toBe(false);
  });

  it('rejects OpenAPI 2.0 masquerading under the `openapi` key', () => {
    const result = validateOpenApiDocument({ openapi: '2.0', paths: {} });
    expect(result.ok).toBe(false);
  });

  it('rejects a document with no paths object', () => {
    const result = validateOpenApiDocument({ openapi: '3.0.0' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/paths/i);
  });

  it('rejects a document whose paths is not an object', () => {
    const result = validateOpenApiDocument({ openapi: '3.0.0', paths: [] });
    expect(result.ok).toBe(false);
  });

  it('rejects a non-object root value', () => {
    expect(validateOpenApiDocument('just a string').ok).toBe(false);
    expect(validateOpenApiDocument(null).ok).toBe(false);
    expect(validateOpenApiDocument([1, 2, 3]).ok).toBe(false);
  });

  it('imports with valid paths even when all optional metadata is missing', () => {
    const result = validateOpenApiDocument({ openapi: '3.0.0', paths: { '/ping': { get: {} } } });
    expect(result.ok).toBe(true);
    expect(result.doc?.title).toBe('Imported OpenAPI');
    expect(result.doc?.servers).toEqual([]);
    expect(result.doc?.securitySchemes).toEqual({});
  });

  it('falls back to "Imported OpenAPI" when info.title is missing or blank', () => {
    expect(validateOpenApiDocument({ openapi: '3.0.0', paths: {}, info: {} }).doc?.title).toBe('Imported OpenAPI');
    expect(validateOpenApiDocument({ openapi: '3.0.0', paths: {}, info: { title: '   ' } }).doc?.title).toBe('Imported OpenAPI');
  });

  it('uses info.title when present', () => {
    const result = validateOpenApiDocument({ openapi: '3.0.0', paths: {}, info: { title: 'Petstore API' } });
    expect(result.doc?.title).toBe('Petstore API');
  });

  it('parses servers, including variables with defaults', () => {
    const result = validateOpenApiDocument({
      openapi: '3.0.0',
      paths: {},
      servers: [{ url: 'https://{env}.example.com/{version}', variables: { env: { default: 'staging' }, version: { default: 'v1' } } }],
    });
    expect(result.doc?.servers).toEqual([
      { url: 'https://{env}.example.com/{version}', variables: { env: { default: 'staging' }, version: { default: 'v1' } } },
    ]);
  });

  it('drops a malformed server entry rather than failing the whole document', () => {
    const result = validateOpenApiDocument({ openapi: '3.0.0', paths: {}, servers: [{ url: 'https://good.example.com' }, { no: 'url' }, 'not-an-object'] });
    expect(result.doc?.servers).toEqual([{ url: 'https://good.example.com', variables: {} }]);
  });

  it('extracts securitySchemes from components', () => {
    const result = validateOpenApiDocument({
      openapi: '3.0.0',
      paths: {},
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } },
    });
    expect(result.doc?.securitySchemes).toEqual({ bearerAuth: { type: 'http', scheme: 'bearer' } });
  });

  it('extracts document-level security', () => {
    const result = validateOpenApiDocument({ openapi: '3.0.0', paths: {}, security: [{ bearerAuth: [] }] });
    expect(result.doc?.globalSecurity).toEqual([{ bearerAuth: [] }]);
  });
});
