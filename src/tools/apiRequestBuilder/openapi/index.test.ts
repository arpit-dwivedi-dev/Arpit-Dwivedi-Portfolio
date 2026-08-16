import { MAX_FOLDER_DEPTH, folderDepth } from '../collections';
import { buildOpenApiImportPlan } from './index';

const PETSTORE = JSON.stringify({
  openapi: '3.0.3',
  info: { title: 'Petstore API', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com/v1' }],
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        tags: ['Pets'],
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
        responses: { 200: { description: 'ok' } },
      },
      post: {
        operationId: 'createPet',
        tags: ['Pets'],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } },
        },
        responses: { 201: { description: 'created' } },
      },
    },
    '/pets/{petId}': {
      delete: {
        operationId: 'deletePet',
        tags: ['Pets'],
        parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 204: { description: 'deleted' } },
      },
    },
    '/users': {
      get: { operationId: 'listUsers', tags: ['Users'], responses: { 200: { description: 'ok' } } },
    },
    '/health': {
      get: { responses: { 200: { description: 'ok' } } },
    },
  },
});

describe('buildOpenApiImportPlan — parsing/validation errors surface without a plan', () => {
  it('reports malformed JSON/YAML', () => {
    const result = buildOpenApiImportPlan('{ not valid', [], []);
    expect(result.ok).toBe(false);
    expect(result.plan).toBeUndefined();
  });

  it('rejects Swagger 2.0', () => {
    const result = buildOpenApiImportPlan(JSON.stringify({ swagger: '2.0', paths: {} }), [], []);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/OpenAPI 3\.0 and 3\.1/);
  });

  it('rejects a document with no operations to import', () => {
    const result = buildOpenApiImportPlan(JSON.stringify({ openapi: '3.0.0', paths: { '/x': {} } }), [], []);
    expect(result.ok).toBe(false);
  });
});

describe('buildOpenApiImportPlan — collection conversion', () => {
  it('creates exactly one new collection named after info.title', () => {
    const result = buildOpenApiImportPlan(PETSTORE, [], []);
    expect(result.ok).toBe(true);
    expect(result.plan?.collection.name).toBe('Petstore API (Imported)');
  });

  it('falls back to "Imported OpenAPI" when info.title is absent', () => {
    const doc = JSON.stringify({ openapi: '3.0.0', paths: { '/x': { get: {} } } });
    const result = buildOpenApiImportPlan(doc, [], []);
    expect(result.plan?.collection.name).toBe('Imported OpenAPI (Imported)');
  });

  it('disambiguates the collection name against existing collections, then increments', () => {
    const first = buildOpenApiImportPlan(PETSTORE, ['Petstore API'], []);
    expect(first.plan?.collection.name).toBe('Petstore API (Imported)');

    // Same disambiguation convention as importFormat.ts's collection-export import and the
    // page's New Collection/New Folder flow — the counter is appended after the whole
    // collided string, not folded inside the parens.
    const second = buildOpenApiImportPlan(PETSTORE, ['Petstore API', 'Petstore API (Imported)'], []);
    expect(second.plan?.collection.name).toBe('Petstore API (Imported) 2');
  });

  it('groups operations into tag folders, first tag wins, no duplicate folders per tag', () => {
    const result = buildOpenApiImportPlan(PETSTORE, [], []);
    const folderNames = result.plan?.folders.map((f) => f.name).sort();
    expect(folderNames).toEqual(['General', 'Pets', 'Users']);
    // Two Pets operations share one folder, not one each.
    const petsFolders = result.plan?.folders.filter((f) => f.name === 'Pets');
    expect(petsFolders).toHaveLength(1);
  });

  it('falls back untagged operations to a "General" folder', () => {
    const result = buildOpenApiImportPlan(PETSTORE, [], []);
    const generalFolder = result.plan?.folders.find((f) => f.name === 'General');
    expect(generalFolder).toBeTruthy();
    const healthRequest = result.plan?.requests.find((r) => r.name === 'listHealth' || r.request.url.endsWith('/health'));
    expect(healthRequest?.folderId).toBe(generalFolder?.id);
  });

  it('keeps every folder within the app-wide max folder depth', () => {
    const result = buildOpenApiImportPlan(PETSTORE, [], []);
    for (const folder of result.plan?.folders ?? []) {
      expect(folderDepth(result.plan!.folders, folder.id)).toBeLessThanOrEqual(MAX_FOLDER_DEPTH);
    }
  });

  it('gives every collection/folder/request a fresh unique id', () => {
    const result = buildOpenApiImportPlan(PETSTORE, [], []);
    const ids = [result.plan!.collection.id, ...result.plan!.folders.map((f) => f.id), ...result.plan!.requests.map((r) => r.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('converts every valid operation to a request in the new collection', () => {
    const result = buildOpenApiImportPlan(PETSTORE, [], []);
    expect(result.plan?.requests).toHaveLength(5);
    expect(result.plan?.requests.every((r) => r.collectionId === result.plan?.collection.id)).toBe(true);
    expect(result.summary?.operationCount).toBe(5);
  });

  it('converts the path parameter and server into {{baseUrl}}/pets/{{petId}} style URLs', () => {
    const result = buildOpenApiImportPlan(PETSTORE, [], []);
    const deletePet = result.plan?.requests.find((r) => r.name === 'deletePet');
    expect(deletePet?.request.url).toBe('{{baseUrl}}/pets/{{petId}}');
  });

  it('creates an environment with baseUrl resolved from the first server', () => {
    const result = buildOpenApiImportPlan(PETSTORE, [], []);
    expect(result.plan?.environment?.variables).toEqual([expect.objectContaining({ key: 'baseUrl', value: 'https://api.example.com/v1' })]);
  });

  it('resolves server variables using their declared defaults', () => {
    const doc = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Multi-env API' },
      servers: [{ url: 'https://{env}.example.com/{version}', variables: { env: { default: 'staging' }, version: { default: 'v2' } } }],
      paths: { '/ping': { get: { operationId: 'ping' } } },
    });
    const result = buildOpenApiImportPlan(doc, [], []);
    expect(result.plan?.environment?.variables[0].value).toBe('https://staging.example.com/v2');
  });

  it('uses only the first server when multiple are declared, without duplicating requests', () => {
    const doc = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Multi-server API' },
      servers: [{ url: 'https://one.example.com' }, { url: 'https://two.example.com' }],
      paths: { '/ping': { get: { operationId: 'ping' } } },
    });
    const result = buildOpenApiImportPlan(doc, [], []);
    expect(result.plan?.requests).toHaveLength(1);
    expect(result.plan?.environment?.variables[0].value).toBe('https://one.example.com');
    expect(result.summary?.serverCount).toBe(2);
  });

  it('still creates a baseUrl environment (empty) and warns when there are no servers at all', () => {
    const doc = JSON.stringify({ openapi: '3.0.0', info: { title: 'No Server API' }, paths: { '/ping': { get: { operationId: 'ping' } } } });
    const result = buildOpenApiImportPlan(doc, [], []);
    expect(result.plan?.environment?.variables[0]).toEqual(expect.objectContaining({ key: 'baseUrl', value: '' }));
    expect(result.warnings?.some((w) => /no server url/i.test(w))).toBe(true);
  });

  it('reports the security scheme count', () => {
    const doc = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Secure API' },
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' }, apiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-Key' } } },
      paths: { '/ping': { get: { operationId: 'ping' } } },
    });
    const result = buildOpenApiImportPlan(doc, [], []);
    expect(result.summary?.securitySchemeCount).toBe(2);
  });
});

describe('buildOpenApiImportPlan — partial import on malformed operations', () => {
  it('imports the valid operations and reports the malformed ones as skipped, rather than failing the whole document', () => {
    const doc = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Partial API' },
      paths: {
        '/good-one': { get: { operationId: 'good1' } },
        '/good-two': { get: { operationId: 'good2' } },
        '/bad-trace': { trace: { operationId: 'unsupportedMethod' } },
        '/bad-path-item': 'this is not an object',
      },
    });
    const result = buildOpenApiImportPlan(doc, [], []);
    expect(result.ok).toBe(true);
    expect(result.plan?.requests).toHaveLength(2);
    expect(result.skippedOperationCount).toBe(2);
  });
});

describe('buildOpenApiImportPlan — security regression: no literal credentials are ever persisted', () => {
  it('never stores a bearer token, basic password, or api key value from the document', () => {
    const doc = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Credentialed API' },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', description: 'Use token sk_live_51H8xTEST_SECRET_VALUE' },
          apiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key', 'x-example': 'sk_live_ANOTHER_SECRET' },
        },
      },
      security: [{ bearerAuth: [] }],
      paths: {
        '/secure': {
          get: {
            operationId: 'getSecure',
            security: [{ apiKeyAuth: [] }],
          },
        },
      },
    });
    const result = buildOpenApiImportPlan(doc, [], []);
    expect(result.ok).toBe(true);

    // Neither security-scheme description text nor an `x-example` sitting on the scheme object
    // itself (never read for anything but `name`) ever makes it into the plan.
    const serialized = JSON.stringify(result.plan);
    expect(serialized).not.toContain('sk_live_51H8xTEST_SECRET_VALUE');
    expect(serialized).not.toContain('sk_live_ANOTHER_SECRET');

    for (const request of result.plan?.requests ?? []) {
      expect(request.request.auth.bearerToken).toBe('');
      expect(request.request.auth.basicPassword).toBe('');
      expect(request.request.auth.apiKeyValue).toBe('');
    }
  });

  it('imports the Authorization header parameter itself as browser-restricted-safe (skipped like any other reserved header)', () => {
    // Authorization is not in the browser-forbidden-header list (script CAN set it), but the
    // main point of this regression test is simply that its example value never survives into
    // request.auth.* as a live secret — it may appear as a plain header row value, which is
    // exactly what an explicit `example` on a Parameter Object is: example data to review/replace.
    const doc = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Header Example API' },
      paths: { '/secure': { get: { operationId: 'getSecure', parameters: [{ name: 'Authorization', in: 'header', example: 'Bearer sk_live_X' }] } } },
    });
    const result = buildOpenApiImportPlan(doc, [], []);
    const request = result.plan?.requests[0];
    expect(request?.request.auth.type).toBe('none');
    expect(request?.request.auth.bearerToken).toBe('');
  });
});

describe('buildOpenApiImportPlan — warnings summary', () => {
  it('aggregates unsupported-auth warnings across operations into one concise line', () => {
    const doc = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'OAuth API' },
      components: { securitySchemes: { oauth2Auth: { type: 'oauth2', flows: {} } } },
      paths: {
        '/a': { get: { operationId: 'a', security: [{ oauth2Auth: [] }] } },
        '/b': { get: { operationId: 'b', security: [{ oauth2Auth: [] }] } },
      },
    });
    const result = buildOpenApiImportPlan(doc, [], []);
    const authWarnings = result.warnings?.filter((w) => /unsupported authentication/i.test(w));
    expect(authWarnings).toHaveLength(1);
    expect(authWarnings?.[0]).toMatch(/^2 operations/);
  });
});
