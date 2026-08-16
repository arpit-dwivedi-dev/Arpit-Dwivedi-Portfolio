import { createBlankRequest, createRow, type ApiRequest } from './types';

// storage.ts reads/writes via `window.localStorage`; this suite runs under
// Jest's `node` testEnvironment (see jest.config.cjs), which has no DOM, so a
// minimal in-memory polyfill is set up before importing the module under
// test — real enough to prove what actually lands in the persisted JSON.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

(globalThis as { window?: unknown }).window = { localStorage: new MemoryStorage() };

import {
  redactSecrets,
  hasStorableSecrets,
  upsertSavedRequest,
  getSavedRequest,
  listSavedRequests,
  renameSavedRequest,
  deleteSavedRequest,
  duplicateSavedRequest,
  moveSavedRequest,
  addHistoryEntry,
  listHistory,
  listEnvironments,
  getActiveEnvironmentId,
  setActiveEnvironmentId,
  upsertEnvironment,
  deleteEnvironment,
  DEFAULT_COLLECTION_ID,
  listCollections,
  upsertCollection,
  deleteCollection,
  listFolders,
  upsertFolder,
  deleteFolder,
} from './storage';
import { createEnvironment, type Environment } from './environment';
import { canCreateSubfolder, createCollection, createFolder, type Collection, type Folder } from './collections';
import type { SavedRequest } from './types';

const localStorageOf = () => (globalThis as unknown as { window: { localStorage: MemoryStorage } }).window.localStorage;

const SAVED_KEY = '101tl_api_builder_saved_v1';
const COLLECTIONS_KEY = '101tl_api_builder_collections_v1';

const bearerRequest = (): ApiRequest => ({
  ...createBlankRequest(),
  auth: { type: 'bearer', bearerToken: 'super-secret-token', basicUsername: '', basicPassword: '', apiKeyName: '', apiKeyValue: '', apiKeyLocation: 'header' },
});

describe('redactSecrets', () => {
  it('clears the bearer token when auth type is bearer', () => {
    const result = redactSecrets(bearerRequest());
    expect(result.auth.bearerToken).toBe('');
    expect(result.auth.type).toBe('bearer');
  });

  it('clears the basic auth password when auth type is basic, leaves the username', () => {
    const request: ApiRequest = {
      ...createBlankRequest(),
      auth: { type: 'basic', bearerToken: '', basicUsername: 'alice', basicPassword: 'hunter2', apiKeyName: '', apiKeyValue: '', apiKeyLocation: 'header' },
    };
    const result = redactSecrets(request);
    expect(result.auth.basicPassword).toBe('');
    expect(result.auth.basicUsername).toBe('alice');
  });

  it('clears the API key value when auth type is api-key, leaves the key name', () => {
    const request: ApiRequest = {
      ...createBlankRequest(),
      auth: { type: 'api-key', bearerToken: '', basicUsername: '', basicPassword: '', apiKeyName: 'X-Api-Key', apiKeyValue: 'abc123', apiKeyLocation: 'header' },
    };
    const result = redactSecrets(request);
    expect(result.auth.apiKeyValue).toBe('');
    expect(result.auth.apiKeyName).toBe('X-Api-Key');
  });

  it('redacts credential-shaped headers case-insensitively, leaves other headers untouched', () => {
    const request: ApiRequest = {
      ...createBlankRequest(),
      headers: [
        { ...createRow(), key: 'Authorization', value: 'Bearer abc' },
        { ...createRow(), key: 'COOKIE', value: 'session=xyz' },
        { ...createRow(), key: 'x-api-key', value: 'key-value' },
        { ...createRow(), key: 'Content-Type', value: 'application/json' },
      ],
    };
    const result = redactSecrets(request);
    expect(result.headers.map((h) => h.value)).toEqual(['', '', '', 'application/json']);
  });

  it('strips file payloads from multipart form fields, same as history', () => {
    const request: ApiRequest = {
      ...createBlankRequest(),
      body: {
        mode: 'multipart',
        raw: '',
        formFields: [{ ...createRow(), isFile: true, fileName: 'photo.png', file: new File(['x'], 'photo.png') }],
      },
    };
    const result = redactSecrets(request);
    expect(result.body.formFields[0].file).toBeUndefined();
    expect(result.body.formFields[0].fileName).toBe('photo.png');
  });
});

describe('hasStorableSecrets', () => {
  it('is true when the active auth type has a non-empty secret', () => {
    expect(hasStorableSecrets(bearerRequest())).toBe(true);
  });

  it('is false when auth type is none, even if a stale token value lingers on the object', () => {
    const request: ApiRequest = {
      ...createBlankRequest(),
      auth: { type: 'none', bearerToken: 'leftover-token', basicUsername: '', basicPassword: '', apiKeyName: '', apiKeyValue: '', apiKeyLocation: 'header' },
    };
    expect(hasStorableSecrets(request)).toBe(false);
  });

  it('is true when a credential-shaped header has a value', () => {
    const request: ApiRequest = {
      ...createBlankRequest(),
      headers: [{ ...createRow(), key: 'Authorization', value: 'Bearer abc' }],
    };
    expect(hasStorableSecrets(request)).toBe(true);
  });

  it('is false for a plain request with no auth and no sensitive headers', () => {
    expect(hasStorableSecrets(createBlankRequest())).toBe(false);
  });
});

describe('upsertSavedRequest / getSavedRequest', () => {
  it('never persists the plaintext secret to the underlying storage', () => {
    const saved: SavedRequest = {
      id: 'saved-1',
      collectionId: DEFAULT_COLLECTION_ID,
      folderId: null,
      name: 'Get profile',
      createdAt: 1,
      updatedAt: 1,
      request: bearerRequest(),
    };
    upsertSavedRequest(saved);

    const rawPersisted = (globalThis as unknown as { window: { localStorage: MemoryStorage } }).window.localStorage.getItem(
      '101tl_api_builder_saved_v1',
    );
    expect(rawPersisted).not.toContain('super-secret-token');

    const loaded = getSavedRequest('saved-1');
    expect(loaded?.request.auth.bearerToken).toBe('');
    expect(loaded?.name).toBe('Get profile');
  });

  it('preserves an unresolved `{{variable}}` template in the URL rather than a resolved value', () => {
    const request: ApiRequest = { ...createBlankRequest(), url: '{{baseUrl}}/users' };
    upsertSavedRequest({
      id: 'saved-2',
      collectionId: DEFAULT_COLLECTION_ID,
      folderId: null,
      name: 'Templated',
      createdAt: 1,
      updatedAt: 1,
      request,
    });

    const loaded = getSavedRequest('saved-2');
    expect(loaded?.request.url).toBe('{{baseUrl}}/users');
  });
});

describe('addHistoryEntry — unresolved template', () => {
  it('preserves `{{variable}}` syntax in history rather than a resolved value', () => {
    const request: ApiRequest = { ...createBlankRequest(), url: '{{baseUrl}}/users/{{userId}}' };
    addHistoryEntry({ id: 'hist-1', timestamp: 1, request, status: 200, statusText: 'OK', timeMs: 10 });

    const [entry] = listHistory();
    expect(entry.request.url).toBe('{{baseUrl}}/users/{{userId}}');
  });
});

describe('environments — CRUD', () => {
  beforeEach(() => {
    (globalThis as unknown as { window: { localStorage: MemoryStorage } }).window.localStorage.removeItem(
      '101tl_api_builder_environments_v1',
    );
  });

  it('starts with an empty list and no active environment', () => {
    expect(listEnvironments()).toEqual([]);
    expect(getActiveEnvironmentId()).toBeNull();
  });

  it('creates an environment and reads it back after a simulated reload', () => {
    const env = createEnvironment('Staging');
    env.variables = [{ id: 'v1', key: 'baseUrl', value: 'https://staging.example.com' }];
    upsertEnvironment(env);

    // "Reload" — nothing here holds in-memory state, listEnvironments() always re-reads localStorage.
    const reloaded = listEnvironments();
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0]).toEqual(env);
  });

  it('edits an existing environment in place rather than appending a duplicate', () => {
    const env = createEnvironment('Local');
    upsertEnvironment(env);

    const edited: Environment = { ...env, name: 'Local (renamed)', variables: [{ id: 'v1', key: 'port', value: '3000' }] };
    upsertEnvironment(edited);

    const all = listEnvironments();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Local (renamed)');
    expect(all[0].variables).toEqual([{ id: 'v1', key: 'port', value: '3000' }]);
  });

  it('deletes an environment', () => {
    const env = createEnvironment('Throwaway');
    upsertEnvironment(env);
    expect(listEnvironments()).toHaveLength(1);

    deleteEnvironment(env.id);
    expect(listEnvironments()).toEqual([]);
  });

  it('clears the active environment id when the active environment is deleted', () => {
    const env = createEnvironment('Prod');
    upsertEnvironment(env);
    setActiveEnvironmentId(env.id);
    expect(getActiveEnvironmentId()).toBe(env.id);

    deleteEnvironment(env.id);
    expect(getActiveEnvironmentId()).toBeNull();
  });

  it('leaves the active environment id untouched when a different environment is deleted', () => {
    const active = createEnvironment('Prod');
    const other = createEnvironment('Local');
    upsertEnvironment(active);
    upsertEnvironment(other);
    setActiveEnvironmentId(active.id);

    deleteEnvironment(other.id);
    expect(getActiveEnvironmentId()).toBe(active.id);
  });

  it('recovers gracefully from malformed JSON in localStorage, falling back to an empty list', () => {
    (globalThis as unknown as { window: { localStorage: MemoryStorage } }).window.localStorage.setItem(
      '101tl_api_builder_environments_v1',
      'not valid json{{{',
    );
    expect(listEnvironments()).toEqual([]);
    expect(getActiveEnvironmentId()).toBeNull();
  });

  it('recovers gracefully from well-formed JSON in the wrong shape', () => {
    (globalThis as unknown as { window: { localStorage: MemoryStorage } }).window.localStorage.setItem(
      '101tl_api_builder_environments_v1',
      JSON.stringify({ environments: [{ id: 'x' }, 'not-an-object', { id: 'y', name: 'ok', variables: 'not-an-array' }], activeEnvironmentId: 42 }),
    );
    expect(listEnvironments()).toEqual([]);
    expect(getActiveEnvironmentId()).toBeNull();
  });

  it('drops the stored active id when it no longer matches any environment', () => {
    (globalThis as unknown as { window: { localStorage: MemoryStorage } }).window.localStorage.setItem(
      '101tl_api_builder_environments_v1',
      JSON.stringify({ environments: [{ id: 'a', name: 'A', variables: [] }], activeEnvironmentId: 'ghost-id' }),
    );
    expect(getActiveEnvironmentId()).toBeNull();
    expect(listEnvironments()).toHaveLength(1);
  });
});

const resetCollectionsStorage = () => {
  localStorageOf().removeItem(SAVED_KEY);
  localStorageOf().removeItem(COLLECTIONS_KEY);
};

describe('migration — legacy flat saved requests', () => {
  beforeEach(resetCollectionsStorage);

  const legacyRecord = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'legacy-1',
    name: 'Legacy request',
    createdAt: 100,
    updatedAt: 100,
    request: { ...createBlankRequest(), url: '{{baseUrl}}/legacy' },
    ...overrides,
  });

  it('assigns a pre-Collections saved request (no collectionId) to the default collection', () => {
    localStorageOf().setItem(SAVED_KEY, JSON.stringify([legacyRecord()]));

    const [migrated] = listSavedRequests();
    expect(migrated.collectionId).toBe(DEFAULT_COLLECTION_ID);
    expect(migrated.folderId).toBeNull();
    expect(listCollections().some((c) => c.id === DEFAULT_COLLECTION_ID)).toBe(true);
  });

  it('keeps the original id stable through migration', () => {
    localStorageOf().setItem(SAVED_KEY, JSON.stringify([legacyRecord({ id: 'stable-id' })]));
    const [migrated] = listSavedRequests();
    expect(migrated.id).toBe('stable-id');
  });

  it('leaves request content — including an unresolved {{variable}} template — unchanged through migration', () => {
    localStorageOf().setItem(SAVED_KEY, JSON.stringify([legacyRecord()]));
    const [migrated] = listSavedRequests();
    expect(migrated.request.url).toBe('{{baseUrl}}/legacy');
    expect(migrated.name).toBe('Legacy request');
  });

  it('only migrates once — a second read does not create a duplicate default collection or duplicate records', () => {
    localStorageOf().setItem(SAVED_KEY, JSON.stringify([legacyRecord()]));

    listSavedRequests();
    listSavedRequests();
    listSavedRequests();

    expect(listSavedRequests()).toHaveLength(1);
    expect(listCollections().filter((c) => c.id === DEFAULT_COLLECTION_ID)).toHaveLength(1);
  });

  it('is safe with a mix of already-migrated and legacy records — only the legacy one is touched', () => {
    const alreadyMigrated = { ...legacyRecord({ id: 'already-migrated' }), collectionId: 'custom-collection', folderId: 'custom-folder' };
    localStorageOf().setItem(SAVED_KEY, JSON.stringify([alreadyMigrated, legacyRecord({ id: 'still-legacy' })]));

    const all = listSavedRequests();
    const migratedOne = all.find((r) => r.id === 'already-migrated')!;
    const legacyOne = all.find((r) => r.id === 'still-legacy')!;

    expect(migratedOne.collectionId).toBe('custom-collection');
    expect(migratedOne.folderId).toBe('custom-folder');
    expect(legacyOne.collectionId).toBe(DEFAULT_COLLECTION_ID);
  });

  it('recovers gracefully from malformed JSON in the saved-requests key', () => {
    localStorageOf().setItem(SAVED_KEY, 'not valid json{{{');
    expect(listSavedRequests()).toEqual([]);
  });
});

describe('collections — CRUD', () => {
  beforeEach(resetCollectionsStorage);

  it('always includes the default collection, even with nothing ever created — Save never requires creating one first', () => {
    const all = listCollections();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(DEFAULT_COLLECTION_ID);
  });

  it('creates a collection and reads it back after a simulated reload', () => {
    const collection = createCollection('My API');
    upsertCollection(collection);

    const all = listCollections();
    expect(all.some((c) => c.id === collection.id && c.name === 'My API')).toBe(true);
  });

  it('renames a collection in place rather than creating a duplicate', () => {
    const collection = createCollection('My API');
    upsertCollection(collection);
    upsertCollection({ ...collection, name: 'My API (renamed)' });

    const all = listCollections();
    expect(all.filter((c) => c.id === collection.id)).toHaveLength(1);
    expect(all.find((c) => c.id === collection.id)?.name).toBe('My API (renamed)');
  });

  it('deletes a collection, cascading to its folders and saved requests, without touching other collections', () => {
    const target = createCollection('Target');
    const other = createCollection('Other');
    upsertCollection(target);
    upsertCollection(other);

    const folder = createFolder(target.id, null, 'Users');
    upsertFolder(folder);

    upsertSavedRequest({ id: 'r1', collectionId: target.id, folderId: folder.id, name: 'In target', createdAt: 1, updatedAt: 1, request: createBlankRequest() });
    upsertSavedRequest({ id: 'r2', collectionId: other.id, folderId: null, name: 'In other', createdAt: 1, updatedAt: 1, request: createBlankRequest() });

    deleteCollection(target.id);

    expect(listCollections().some((c) => c.id === target.id)).toBe(false);
    expect(listFolders().some((f) => f.id === folder.id)).toBe(false);
    expect(listSavedRequests().some((r) => r.id === 'r1')).toBe(false);
    expect(listSavedRequests().some((r) => r.id === 'r2')).toBe(true);
  });

  it('recovers gracefully from malformed JSON, still guaranteeing the default collection', () => {
    localStorageOf().setItem(COLLECTIONS_KEY, 'not valid json{{{');
    const all = listCollections();
    expect(all.some((c) => c.id === DEFAULT_COLLECTION_ID)).toBe(true);
  });

  it('drops a folder pointing at a collection that no longer exists in the stored data', () => {
    localStorageOf().setItem(
      COLLECTIONS_KEY,
      JSON.stringify({
        collections: [{ id: 'c1', name: 'C1', createdAt: 1, updatedAt: 1 }],
        folders: [{ id: 'f1', collectionId: 'ghost-collection', parentFolderId: null, name: 'Orphan', createdAt: 1, updatedAt: 1 }],
      }),
    );
    expect(listFolders()).toEqual([]);
  });
});

describe('folders — CRUD', () => {
  beforeEach(resetCollectionsStorage);

  it('creates a folder and reads it back', () => {
    const collection = createCollection('My API');
    upsertCollection(collection);
    const folder = createFolder(collection.id, null, 'Users');
    upsertFolder(folder);

    expect(listFolders().some((f) => f.id === folder.id && f.name === 'Users')).toBe(true);
  });

  it('renames a folder in place', () => {
    const folder = createFolder(DEFAULT_COLLECTION_ID, null, 'Users');
    upsertFolder(folder);
    upsertFolder({ ...folder, name: 'Accounts' });

    const all = listFolders();
    expect(all.filter((f) => f.id === folder.id)).toHaveLength(1);
    expect(all[0].name).toBe('Accounts');
  });

  it('deletes a folder, cascading to nested subfolders and their saved requests, leaving siblings untouched', () => {
    const root = createFolder(DEFAULT_COLLECTION_ID, null, 'Users');
    upsertFolder(root);
    const sub = createFolder(DEFAULT_COLLECTION_ID, root.id, 'Admin');
    upsertFolder(sub);
    const sibling = createFolder(DEFAULT_COLLECTION_ID, null, 'Orders');
    upsertFolder(sibling);

    upsertSavedRequest({ id: 'in-sub', collectionId: DEFAULT_COLLECTION_ID, folderId: sub.id, name: 'Nested', createdAt: 1, updatedAt: 1, request: createBlankRequest() });
    upsertSavedRequest({ id: 'in-sibling', collectionId: DEFAULT_COLLECTION_ID, folderId: sibling.id, name: 'Sibling', createdAt: 1, updatedAt: 1, request: createBlankRequest() });

    deleteFolder(root.id);

    const remainingFolders = listFolders().map((f) => f.id);
    expect(remainingFolders).not.toContain(root.id);
    expect(remainingFolders).not.toContain(sub.id);
    expect(remainingFolders).toContain(sibling.id);
    expect(listSavedRequests().some((r) => r.id === 'in-sub')).toBe(false);
    expect(listSavedRequests().some((r) => r.id === 'in-sibling')).toBe(true);
  });

  it('supports nested folders up to the depth limit, and rejects going deeper', () => {
    const level1 = createFolder(DEFAULT_COLLECTION_ID, null, 'L1');
    upsertFolder(level1);
    const level2 = createFolder(DEFAULT_COLLECTION_ID, level1.id, 'L2');
    upsertFolder(level2);
    const level3 = createFolder(DEFAULT_COLLECTION_ID, level2.id, 'L3');
    upsertFolder(level3);

    const stored = listFolders();
    expect(canCreateSubfolder(stored, level2.id)).toBe(true); // creating L3 was allowed (depth 3)
    expect(canCreateSubfolder(stored, level3.id)).toBe(false); // a 4th level is not
  });
});

describe('saved requests — duplicate / move', () => {
  beforeEach(resetCollectionsStorage);

  const templatedRequest = (): SavedRequest => ({
    id: 'orig',
    collectionId: DEFAULT_COLLECTION_ID,
    folderId: null,
    name: 'Get Users',
    createdAt: 1,
    updatedAt: 1,
    request: { ...createBlankRequest(), url: '{{baseUrl}}/users', headers: [{ ...createRow(), key: 'Authorization', value: 'Bearer secret' }] },
  });

  it('duplicates a saved request with a new id, "(copy)" name, and the same location', () => {
    upsertSavedRequest(templatedRequest());
    const copy = duplicateSavedRequest('orig');

    expect(copy?.id).not.toBe('orig');
    expect(copy?.name).toBe('Get Users (copy)');
    expect(copy?.collectionId).toBe(DEFAULT_COLLECTION_ID);
    expect(copy?.folderId).toBeNull();
    expect(listSavedRequests()).toHaveLength(2);
  });

  it('duplicates the unresolved {{variable}} template and the already-redacted secret state, not a fake restored secret', () => {
    upsertSavedRequest(templatedRequest());
    const copy = duplicateSavedRequest('orig');

    expect(copy?.request.url).toBe('{{baseUrl}}/users');
    // Authorization was redacted by upsertSavedRequest before the duplicate was ever made from it.
    expect(copy?.request.headers.find((h) => h.key === 'Authorization')?.value).toBe('');
  });

  it('does not share mutable state with the original — editing arrays on the copy never touches the original', () => {
    upsertSavedRequest(templatedRequest());
    const copy = duplicateSavedRequest('orig')!;
    copy.request.headers.push({ ...createRow(), key: 'X-New', value: 'only-on-copy' });

    const original = getSavedRequest('orig')!;
    expect(original.request.headers.some((h) => h.key === 'X-New')).toBe(false);
  });

  it('returns undefined and does nothing for a nonexistent id', () => {
    expect(duplicateSavedRequest('does-not-exist')).toBeUndefined();
    expect(listSavedRequests()).toEqual([]);
  });

  it('moves a saved request between collections/folders without changing its request configuration', () => {
    upsertSavedRequest(templatedRequest());
    const otherCollection = createCollection('Other');
    upsertCollection(otherCollection);
    const otherFolder = createFolder(otherCollection.id, null, 'Target folder');
    upsertFolder(otherFolder);

    moveSavedRequest('orig', otherCollection.id, otherFolder.id);

    const moved = getSavedRequest('orig')!;
    expect(moved.collectionId).toBe(otherCollection.id);
    expect(moved.folderId).toBe(otherFolder.id);
    expect(moved.request.url).toBe('{{baseUrl}}/users');
  });

  it('moving to the collection root uses a null folderId', () => {
    upsertSavedRequest({ ...templatedRequest(), folderId: 'some-folder' });
    moveSavedRequest('orig', DEFAULT_COLLECTION_ID, null);
    expect(getSavedRequest('orig')?.folderId).toBeNull();
  });
});

describe('security regression — secrets stay redacted inside collections', () => {
  beforeEach(resetCollectionsStorage);

  const inFolder = (): { collection: Collection; folder: Folder } => {
    const collection = createCollection('My API');
    upsertCollection(collection);
    const folder = createFolder(collection.id, null, 'Auth');
    upsertFolder(folder);
    return { collection, folder };
  };

  it('never persists a bearer token in plaintext when saved into a folder', () => {
    const { collection, folder } = inFolder();
    const request: ApiRequest = {
      ...createBlankRequest(),
      url: '{{baseUrl}}/me',
      auth: { type: 'bearer', bearerToken: 'super-secret-bearer', basicUsername: '', basicPassword: '', apiKeyName: '', apiKeyValue: '', apiKeyLocation: 'header' },
    };
    upsertSavedRequest({ id: 'secret-bearer', collectionId: collection.id, folderId: folder.id, name: 'Me', createdAt: 1, updatedAt: 1, request });

    expect(localStorageOf().getItem(SAVED_KEY)).not.toContain('super-secret-bearer');
    const loaded = getSavedRequest('secret-bearer')!;
    expect(loaded.request.auth.type).toBe('bearer');
    expect(loaded.request.auth.bearerToken).toBe('');
    expect(loaded.request.url).toBe('{{baseUrl}}/me');
    expect(loaded.collectionId).toBe(collection.id);
    expect(loaded.folderId).toBe(folder.id);
  });

  it('never persists an API key value in plaintext when saved into a folder', () => {
    const { collection, folder } = inFolder();
    const request: ApiRequest = {
      ...createBlankRequest(),
      auth: { type: 'api-key', bearerToken: '', basicUsername: '', basicPassword: '', apiKeyName: 'X-Api-Key', apiKeyValue: 'super-secret-key', apiKeyLocation: 'header' },
    };
    upsertSavedRequest({ id: 'secret-apikey', collectionId: collection.id, folderId: folder.id, name: 'Me', createdAt: 1, updatedAt: 1, request });

    expect(localStorageOf().getItem(SAVED_KEY)).not.toContain('super-secret-key');
    const loaded = getSavedRequest('secret-apikey')!;
    expect(loaded.request.auth.apiKeyValue).toBe('');
    expect(loaded.request.auth.apiKeyName).toBe('X-Api-Key');
  });

  it('never persists a credential-shaped Authorization header in plaintext when saved into a folder', () => {
    const { collection, folder } = inFolder();
    const request: ApiRequest = {
      ...createBlankRequest(),
      headers: [{ ...createRow(), key: 'Authorization', value: 'Bearer super-secret-authz-header' }],
    };
    upsertSavedRequest({ id: 'secret-header', collectionId: collection.id, folderId: folder.id, name: 'Me', createdAt: 1, updatedAt: 1, request });

    expect(localStorageOf().getItem(SAVED_KEY)).not.toContain('super-secret-authz-header');
    const loaded = getSavedRequest('secret-header')!;
    expect(loaded.request.headers[0].value).toBe('');
  });
});
