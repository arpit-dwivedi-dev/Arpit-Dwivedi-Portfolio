import { MAX_FOLDER_DEPTH, folderDepth } from '../collections';
import { redactSecrets } from '../storage';
import { buildPostmanImportPlan } from './index';

const SCHEMA_V21 = 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json';

const DEMO_COLLECTION = JSON.stringify({
  info: { name: 'Demo API', schema: SCHEMA_V21 },
  variable: [
    { key: 'baseUrl', value: 'https://httpbin.org' },
    { key: 'token', value: '{{externalToken}}' },
  ],
  auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}' }] },
  item: [
    {
      name: 'Users',
      item: [
        {
          name: 'Admin',
          item: [
            {
              name: 'Get admin',
              request: { method: 'GET', url: '{{baseUrl}}/get', header: [] },
            },
          ],
        },
        {
          name: 'List users',
          request: {
            method: 'GET',
            url: { raw: '{{baseUrl}}/anything/{{userId}}?page=1', host: ['{{baseUrl}}'], path: ['anything', '{{userId}}'], query: [{ key: 'page', value: '1' }] },
            header: [{ key: 'X-Api-Key', value: '{{apiKey}}' }],
          },
        },
      ],
    },
    {
      name: 'Create user',
      request: {
        method: 'POST',
        url: '{{baseUrl}}/anything',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: { mode: 'raw', raw: '{"name":"Ada"}', options: { raw: { language: 'json' } } },
      },
      event: [
        { listen: 'prerequest', script: { type: 'text/javascript', exec: ['pm.environment.set("x", 1);'] } },
        { listen: 'test', script: { type: 'text/javascript', exec: ['pm.test("ok", () => {});'] } },
      ],
    },
  ],
});

describe('buildPostmanImportPlan — parsing/validation errors surface without a plan', () => {
  it('reports malformed JSON', () => {
    const result = buildPostmanImportPlan('{ not valid', [], []);
    expect(result.ok).toBe(false);
    expect(result.plan).toBeUndefined();
  });

  it('rejects an unsupported schema version', () => {
    const doc = JSON.stringify({ info: { name: 'x', schema: 'https://schema.getpostman.com/json/collection/v1.0.0/collection.json' }, item: [] });
    const result = buildPostmanImportPlan(doc, [], []);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/v2\.0 and v2\.1/);
  });

  it('rejects a collection with no importable requests', () => {
    const doc = JSON.stringify({ info: { name: 'Empty', schema: SCHEMA_V21 }, item: [] });
    const result = buildPostmanImportPlan(doc, [], []);
    expect(result.ok).toBe(false);
  });
});

describe('buildPostmanImportPlan — collection/folder hierarchy', () => {
  it('creates exactly one new collection named after info.name, with the (Imported) suffix', () => {
    const result = buildPostmanImportPlan(DEMO_COLLECTION, [], []);
    expect(result.ok).toBe(true);
    expect(result.plan?.collection.name).toBe('Demo API (Imported)');
  });

  it('falls back to "Imported Postman Collection" when info.name is absent', () => {
    const doc = JSON.stringify({ info: { schema: SCHEMA_V21 }, item: [{ name: 'ping', request: { method: 'GET', url: 'https://x.test' } }] });
    const result = buildPostmanImportPlan(doc, [], []);
    expect(result.plan?.collection.name).toBe('Imported Postman Collection (Imported)');
  });

  it('disambiguates the collection name against existing collections, then increments', () => {
    const first = buildPostmanImportPlan(DEMO_COLLECTION, ['Demo API'], []);
    expect(first.plan?.collection.name).toBe('Demo API (Imported)');
    const second = buildPostmanImportPlan(DEMO_COLLECTION, ['Demo API', 'Demo API (Imported)'], []);
    expect(second.plan?.collection.name).toBe('Demo API (Imported) 2');
  });

  it('never overwrites an existing collection — every id is freshly generated', () => {
    const result = buildPostmanImportPlan(DEMO_COLLECTION, [], []);
    const ids = [result.plan!.collection.id, ...result.plan!.folders.map((f) => f.id), ...result.plan!.requests.map((r) => r.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('maps nested Postman folders onto folder/subfolder, preserving structure', () => {
    const result = buildPostmanImportPlan(DEMO_COLLECTION, [], []);
    const folderNames = result.plan?.folders.map((f) => f.name).sort();
    expect(folderNames).toEqual(['Admin', 'Users']);

    const usersFolder = result.plan!.folders.find((f) => f.name === 'Users')!;
    const adminFolder = result.plan!.folders.find((f) => f.name === 'Admin')!;
    expect(adminFolder.parentFolderId).toBe(usersFolder.id);

    const getAdmin = result.plan!.requests.find((r) => r.name === 'Get admin')!;
    expect(getAdmin.folderId).toBe(adminFolder.id);

    const listUsers = result.plan!.requests.find((r) => r.name === 'List users')!;
    expect(listUsers.folderId).toBe(usersFolder.id);

    const createUser = result.plan!.requests.find((r) => r.name === 'Create user')!;
    expect(createUser.folderId).toBeNull();
  });

  it('respects the app-wide MAX_FOLDER_DEPTH and flattens deeper source folders instead of failing', () => {
    // 5 levels deep — one more than MAX_FOLDER_DEPTH (3).
    const deep = JSON.stringify({
      info: { name: 'Deep', schema: SCHEMA_V21 },
      item: [
        { name: 'L1', item: [{ name: 'L2', item: [{ name: 'L3', item: [{ name: 'L4', item: [{ name: 'L5', request: { method: 'GET', url: 'https://x.test' } }] }] }] }] },
      ],
    });
    const result = buildPostmanImportPlan(deep, [], []);
    expect(result.ok).toBe(true);
    for (const folder of result.plan?.folders ?? []) {
      expect(folderDepth(result.plan!.folders, folder.id)).toBeLessThanOrEqual(MAX_FOLDER_DEPTH);
    }
    // The request from the too-deep L5 folder still gets imported (attached to the deepest
    // folder that could be created), not dropped.
    expect(result.plan?.requests).toHaveLength(1);
    expect(result.warnings?.some((w) => /flattened/i.test(w))).toBe(true);
  });
});

describe('buildPostmanImportPlan — request conversion', () => {
  it('converts every valid request into the new collection', () => {
    const result = buildPostmanImportPlan(DEMO_COLLECTION, [], []);
    expect(result.plan?.requests).toHaveLength(3);
    expect(result.summary?.requestCount).toBe(3);
    expect(result.plan?.requests.every((r) => r.collectionId === result.plan?.collection.id)).toBe(true);
  });

  it('preserves {{variable}} templates in the URL rather than resolving them', () => {
    const getAdmin = buildPostmanImportPlan(DEMO_COLLECTION, [], []).plan!.requests.find((r) => r.name === 'Get admin')!;
    expect(getAdmin.request.url).toBe('{{baseUrl}}/get');
  });

  it('imports query params from the structured url.query array', () => {
    const listUsers = buildPostmanImportPlan(DEMO_COLLECTION, [], []).plan!.requests.find((r) => r.name === 'List users')!;
    expect(listUsers.request.url).toBe('{{baseUrl}}/anything/{{userId}}');
    expect(listUsers.request.params).toEqual([expect.objectContaining({ key: 'page', value: '1', enabled: true })]);
  });

  it('imports a valid-JSON raw body as a json body', () => {
    const createUser = buildPostmanImportPlan(DEMO_COLLECTION, [], []).plan!.requests.find((r) => r.name === 'Create user')!;
    expect(createUser.request.body).toEqual(expect.objectContaining({ mode: 'json', raw: '{"name":"Ada"}' }));
  });

  it('skips a request with an unsupported HTTP method, without failing the rest of the import', () => {
    const doc = JSON.stringify({
      info: { name: 'Mixed', schema: SCHEMA_V21 },
      item: [
        { name: 'Good', request: { method: 'GET', url: 'https://x.test/ok' } },
        { name: 'Bad', request: { method: 'LINK', url: 'https://x.test/bad' } },
      ],
    });
    const result = buildPostmanImportPlan(doc, [], []);
    expect(result.ok).toBe(true);
    expect(result.plan?.requests).toHaveLength(1);
    expect(result.skippedRequestCount).toBe(1);
  });
});

describe('buildPostmanImportPlan — auth inheritance', () => {
  it('request-level auth overrides folder/collection auth', () => {
    const doc = JSON.stringify({
      info: { name: 'Auth', schema: SCHEMA_V21 },
      auth: { type: 'bearer', bearer: [{ key: 'token', value: 'collection-token' }] },
      item: [
        {
          name: 'Folder',
          auth: { type: 'apikey', apikey: [{ key: 'key', value: 'X-Key' }, { key: 'value', value: 'folder-key' }, { key: 'in', value: 'header' }] },
          item: [{ name: 'Overridden', request: { method: 'GET', url: 'https://x.test', auth: { type: 'basic', basic: [{ key: 'username', value: 'u' }, { key: 'password', value: 'p' }] } } }],
        },
      ],
    });
    const result = buildPostmanImportPlan(doc, [], []);
    const req = result.plan!.requests[0];
    expect(req.request.auth.type).toBe('basic');
  });

  it('folder-level auth overrides collection-level auth when the request declares none', () => {
    const doc = JSON.stringify({
      info: { name: 'Auth', schema: SCHEMA_V21 },
      auth: { type: 'bearer', bearer: [{ key: 'token', value: 'collection-token' }] },
      item: [
        {
          name: 'Folder',
          auth: { type: 'apikey', apikey: [{ key: 'key', value: 'X-Key' }, { key: 'value', value: 'folder-key' }, { key: 'in', value: 'header' }] },
          item: [{ name: 'Inherits folder', request: { method: 'GET', url: 'https://x.test' } }],
        },
      ],
    });
    const result = buildPostmanImportPlan(doc, [], []);
    expect(result.plan!.requests[0].request.auth).toEqual(expect.objectContaining({ type: 'api-key', apiKeyName: 'X-Key', apiKeyValue: 'folder-key' }));
  });

  it('collection-level auth applies when neither the folder nor the request declare their own', () => {
    const doc = JSON.stringify({
      info: { name: 'Auth', schema: SCHEMA_V21 },
      auth: { type: 'bearer', bearer: [{ key: 'token', value: 'collection-token' }] },
      item: [{ name: 'Inherits collection', request: { method: 'GET', url: 'https://x.test' } }],
    });
    const result = buildPostmanImportPlan(doc, [], []);
    expect(result.plan!.requests[0].request.auth).toEqual(expect.objectContaining({ type: 'bearer', bearerToken: 'collection-token' }));
  });
});

describe('buildPostmanImportPlan — variables', () => {
  it('builds an environment from collection-level variable declarations', () => {
    const result = buildPostmanImportPlan(DEMO_COLLECTION, [], []);
    const env = result.plan!.environment!;
    expect(env.variables.find((v) => v.key === 'baseUrl')?.value).toBe('https://httpbin.org');
    // A variable whose default value is itself a {{template}} is preserved, not blanked.
    expect(env.variables.find((v) => v.key === 'token')?.value).toBe('{{externalToken}}');
  });

  it('does not build an environment at all when the collection declares no variables', () => {
    const doc = JSON.stringify({ info: { name: 'NoVars', schema: SCHEMA_V21 }, item: [{ name: 'ping', request: { method: 'GET', url: 'https://x.test' } }] });
    const result = buildPostmanImportPlan(doc, [], []);
    expect(result.plan?.environment).toBeNull();
  });

  it('reports dynamic Postman variables ({{$randomUUID}}) as a warning rather than resolving them', () => {
    const doc = JSON.stringify({
      info: { name: 'Dynamic', schema: SCHEMA_V21 },
      item: [{ name: 'Create', request: { method: 'GET', url: 'https://x.test/{{$randomUUID}}' } }],
    });
    const result = buildPostmanImportPlan(doc, [], []);
    expect(result.plan!.requests[0].request.url).toBe('https://x.test/{{$randomUUID}}');
    expect(result.warnings?.some((w) => /dynamic postman variable/i.test(w) && w.includes('$randomUUID'))).toBe(true);
  });
});

describe('buildPostmanImportPlan — scripts are never executed', () => {
  it('counts pre-request and test scripts as warnings without evaluating them', () => {
    const result = buildPostmanImportPlan(DEMO_COLLECTION, [], []);
    expect(result.warnings?.some((w) => /pre-request script/i.test(w))).toBe(true);
    expect(result.warnings?.some((w) => /test script/i.test(w))).toBe(true);
  });
});

describe('buildPostmanImportPlan — security', () => {
  it('carries a literal secret through the plan but redactSecrets() strips it before persistence', () => {
    const doc = JSON.stringify({
      info: { name: 'Secretive', schema: SCHEMA_V21 },
      item: [{ name: 'Login', request: { method: 'GET', url: 'https://x.test', auth: { type: 'bearer', bearer: [{ key: 'token', value: 'literal-secret-abc123' }] } } }],
    });
    const result = buildPostmanImportPlan(doc, [], []);
    const request = result.plan!.requests[0].request;
    expect(request.auth.bearerToken).toBe('literal-secret-abc123');

    // storage.upsertSavedRequest calls exactly this before writing to localStorage (PART 26/30).
    const redacted = redactSecrets(request);
    expect(redacted.auth.bearerToken).toBe('');
  });

  it('preserves a {{variable}} auth template in the converted request rather than mistaking it for a literal secret', () => {
    // Preservation is this importer's job (PART 17/24): convertPostmanAuth never strips or
    // resolves a `{{token}}` template. What happens to it at *persistence* time is entirely
    // storage.upsertSavedRequest's existing, pre-existing-behavior call to redactSecrets() —
    // which (like every other saved request, Postman-imported or not) blanks any *active*
    // bearer/basic/api-key value regardless of whether it's a template or a literal, since it
    // has no way to tell those apart. That blanket behavior is intentionally left as-is here
    // (PART 30: "reuse the existing storage redaction behavior", not reimplement it).
    const doc = JSON.stringify({
      info: { name: 'Templated', schema: SCHEMA_V21 },
      item: [{ name: 'Login', request: { method: 'GET', url: 'https://x.test', auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}' }] } } }],
    });
    const result = buildPostmanImportPlan(doc, [], []);
    const request = result.plan!.requests[0].request;
    expect(request.auth.bearerToken).toBe('{{token}}');
  });
});
