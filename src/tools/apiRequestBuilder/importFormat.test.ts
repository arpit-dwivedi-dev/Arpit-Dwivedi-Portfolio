import { createBlankRequest, type ApiRequest } from './types';
import { EXPORT_FORMAT, EXPORT_VERSION, type ExportPayload } from './exportFormat';
import { buildImportPlan } from './importFormat';

const baseRequest = (): ApiRequest => ({ ...createBlankRequest(), url: '{{baseUrl}}/users' });

const payload = (overrides: Partial<ExportPayload> = {}): ExportPayload => ({
  format: EXPORT_FORMAT,
  version: EXPORT_VERSION,
  exportedAt: new Date().toISOString(),
  collections: [{ id: 'c1', name: 'My API' }],
  folders: [
    { id: 'f1', collectionId: 'c1', parentFolderId: null, name: 'Users' },
    { id: 'f2', collectionId: 'c1', parentFolderId: 'f1', name: 'Admin' },
  ],
  requests: [
    { id: 'r1', collectionId: 'c1', folderId: 'f1', name: 'Get Users', request: baseRequest() },
    { id: 'r2', collectionId: 'c1', folderId: null, name: 'Root request', request: baseRequest() },
  ],
  ...overrides,
});

describe('buildImportPlan', () => {
  it('imports a valid export as a new collection with remapped ids', () => {
    const plan = buildImportPlan(payload(), []);
    expect(plan.collections).toHaveLength(1);
    expect(plan.collections[0].id).not.toBe('c1');
    expect(plan.collections[0].name).toBe('My API (Imported)');
    expect(plan.folders).toHaveLength(2);
    expect(plan.requests).toHaveLength(2);
    expect(plan.skipped).toEqual({ folders: 0, requests: 0 });
  });

  it('never collides with an existing collection id, even under a duplicate source id', () => {
    const plan = buildImportPlan(payload(), []);
    const ids = new Set([...plan.collections.map((c) => c.id), ...plan.folders.map((f) => f.id), ...plan.requests.map((r) => r.id)]);
    expect(ids.has('c1')).toBe(false);
    expect(ids.has('f1')).toBe(false);
    expect(ids.has('r1')).toBe(false);
  });

  it('disambiguates the imported name against an existing collection of the same name', () => {
    const plan = buildImportPlan(payload(), ['My API (Imported)']);
    expect(plan.collections[0].name).toBe('My API (Imported) 2');
  });

  it('remaps nested folder parent references to the new folder ids', () => {
    const plan = buildImportPlan(payload(), []);
    const newCollectionId = plan.collections[0].id;
    const usersFolder = plan.folders.find((f) => f.name === 'Users')!;
    const adminFolder = plan.folders.find((f) => f.name === 'Admin')!;
    expect(usersFolder.collectionId).toBe(newCollectionId);
    expect(usersFolder.parentFolderId).toBeNull();
    expect(adminFolder.parentFolderId).toBe(usersFolder.id);
  });

  it('remaps saved request collectionId/folderId references, including root (no folder) requests', () => {
    const plan = buildImportPlan(payload(), []);
    const newCollectionId = plan.collections[0].id;
    const usersFolder = plan.folders.find((f) => f.name === 'Users')!;
    const getUsers = plan.requests.find((r) => r.name === 'Get Users')!;
    const rootRequest = plan.requests.find((r) => r.name === 'Root request')!;
    expect(getUsers.collectionId).toBe(newCollectionId);
    expect(getUsers.folderId).toBe(usersFolder.id);
    expect(rootRequest.folderId).toBeNull();
  });

  it('preserves unresolved {{variable}} templates and drops secret-shaped placeholders as data, not evaluation', () => {
    const plan = buildImportPlan(payload(), []);
    expect(plan.requests.every((r) => r.request.url === '{{baseUrl}}/users')).toBe(true);
  });

  it('promotes a folder to root when its parent folder was not importable', () => {
    const p = payload({
      folders: [
        { id: 'f1', collectionId: 'c1', parentFolderId: 'missing-parent', name: 'Orphaned' },
      ],
    });
    const plan = buildImportPlan(p, []);
    expect(plan.folders).toHaveLength(1);
    expect(plan.folders[0].parentFolderId).toBeNull();
  });

  it('drops a folder whose collection is not part of this import', () => {
    const p = payload({ folders: [{ id: 'f1', collectionId: 'unknown-collection', parentFolderId: null, name: 'Orphan' }] });
    const plan = buildImportPlan(p, []);
    expect(plan.folders).toHaveLength(0);
    expect(plan.skipped.folders).toBe(1);
  });

  it('drops a request whose collection is not part of this import', () => {
    const p = payload({ requests: [{ id: 'r1', collectionId: 'unknown-collection', folderId: null, name: 'Orphan', request: baseRequest() }] });
    const plan = buildImportPlan(p, []);
    expect(plan.requests).toHaveLength(0);
    expect(plan.skipped.requests).toBe(1);
  });

  it('drops a request whose inner request payload is unrecoverable', () => {
    const p = payload({
      requests: [{ id: 'r1', collectionId: 'c1', folderId: null, name: 'Broken', request: { method: 'GET' } as unknown as ApiRequest }],
    });
    const plan = buildImportPlan(p, []);
    expect(plan.requests).toHaveLength(0);
    expect(plan.skipped.requests).toBe(1);
  });

  it('imports multiple collections without name collisions against each other', () => {
    const p = payload({
      collections: [
        { id: 'c1', name: 'My API' },
        { id: 'c2', name: 'My API' },
      ],
      folders: [],
      requests: [],
    });
    const plan = buildImportPlan(p, []);
    const names = plan.collections.map((c) => c.name);
    expect(new Set(names).size).toBe(2);
    expect(names).toContain('My API (Imported)');
    expect(names).toContain('My API (Imported) 2');
  });
});
