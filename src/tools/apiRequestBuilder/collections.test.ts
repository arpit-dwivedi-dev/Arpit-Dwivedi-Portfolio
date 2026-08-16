import { createBlankRequest, type SavedRequest } from './types';
import {
  MAX_FOLDER_DEPTH,
  buildCollectionTree,
  canCreateSubfolder,
  collectionContentsSummary,
  createCollection,
  createFolder,
  descendantFolderIds,
  folderContentsSummary,
  folderDepth,
  folderPath,
  nameCollides,
  type Collection,
  type Folder,
} from './collections';

const savedRequest = (overrides: Partial<SavedRequest> = {}): SavedRequest => ({
  id: 'req-1',
  collectionId: 'c1',
  folderId: null,
  name: 'Request',
  createdAt: 1,
  updatedAt: 1,
  request: createBlankRequest(),
  ...overrides,
});

describe('createCollection / createFolder', () => {
  it('creates a collection with a generated id and matching created/updated timestamps', () => {
    const collection = createCollection('My API');
    expect(collection.name).toBe('My API');
    expect(collection.id).toBeTruthy();
    expect(collection.createdAt).toBe(collection.updatedAt);
  });

  it('creates a folder scoped to a collection and optional parent', () => {
    const folder = createFolder('c1', null, 'Users');
    expect(folder.collectionId).toBe('c1');
    expect(folder.parentFolderId).toBeNull();
    expect(folder.name).toBe('Users');
  });
});

describe('folderDepth / canCreateSubfolder / MAX_FOLDER_DEPTH', () => {
  const root: Folder = { id: 'f1', collectionId: 'c1', parentFolderId: null, name: 'Users', createdAt: 1, updatedAt: 1 };
  const sub: Folder = { id: 'f2', collectionId: 'c1', parentFolderId: 'f1', name: 'Admin', createdAt: 2, updatedAt: 2 };
  const subsub: Folder = { id: 'f3', collectionId: 'c1', parentFolderId: 'f2', name: 'Superusers', createdAt: 3, updatedAt: 3 };
  const folders = [root, sub, subsub];

  it('reports depth 1 for a root folder, increasing with each parent level', () => {
    expect(folderDepth(folders, 'f1')).toBe(1);
    expect(folderDepth(folders, 'f2')).toBe(2);
    expect(folderDepth(folders, 'f3')).toBe(3);
  });

  it('allows creating a folder at the collection root regardless of existing depth', () => {
    expect(canCreateSubfolder(folders, null)).toBe(true);
  });

  it('allows a subfolder under a folder below the max depth', () => {
    expect(canCreateSubfolder(folders, 'f1')).toBe(true); // f1 is depth 1, child would be depth 2
    expect(canCreateSubfolder(folders, 'f2')).toBe(true); // f2 is depth 2, child would be depth 3 (== MAX_FOLDER_DEPTH)
  });

  it('rejects a subfolder under a folder already at the max depth', () => {
    expect(MAX_FOLDER_DEPTH).toBe(3);
    expect(canCreateSubfolder(folders, 'f3')).toBe(false); // f3 is depth 3, child would be depth 4
  });
});

describe('descendantFolderIds', () => {
  const folders: Folder[] = [
    { id: 'f1', collectionId: 'c1', parentFolderId: null, name: 'Users', createdAt: 1, updatedAt: 1 },
    { id: 'f2', collectionId: 'c1', parentFolderId: 'f1', name: 'Admin', createdAt: 2, updatedAt: 2 },
    { id: 'f3', collectionId: 'c1', parentFolderId: 'f2', name: 'Superusers', createdAt: 3, updatedAt: 3 },
    { id: 'f4', collectionId: 'c1', parentFolderId: null, name: 'Orders', createdAt: 4, updatedAt: 4 },
  ];

  it('collects every folder nested at any depth under the given root, excluding itself and unrelated siblings', () => {
    expect(descendantFolderIds(folders, 'f1').sort()).toEqual(['f2', 'f3']);
  });

  it('returns an empty array for a leaf folder', () => {
    expect(descendantFolderIds(folders, 'f3')).toEqual([]);
  });

  it('returns an empty array for an unrelated folder', () => {
    expect(descendantFolderIds(folders, 'f4')).toEqual([]);
  });
});

describe('folderPath', () => {
  const folders: Folder[] = [
    { id: 'f1', collectionId: 'c1', parentFolderId: null, name: 'Users', createdAt: 1, updatedAt: 1 },
    { id: 'f2', collectionId: 'c1', parentFolderId: 'f1', name: 'Admin', createdAt: 2, updatedAt: 2 },
  ];

  it('joins the folder names from root to the given folder with " / "', () => {
    expect(folderPath(folders, 'f2')).toBe('Users / Admin');
  });

  it('returns just the name for a root folder', () => {
    expect(folderPath(folders, 'f1')).toBe('Users');
  });
});

describe('nameCollides', () => {
  it('is true for an exact match', () => {
    expect(nameCollides(['Users', 'Orders'], 'Users')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(nameCollides(['Users'], 'users')).toBe(true);
  });

  it('trims whitespace on both sides before comparing', () => {
    expect(nameCollides(['Users'], '  Users  ')).toBe(true);
    expect(nameCollides(['  Users  '], 'Users')).toBe(true);
  });

  it('is false when there is no match', () => {
    expect(nameCollides(['Users', 'Orders'], 'Products')).toBe(false);
  });
});

describe('buildCollectionTree', () => {
  it('nests folders and places requests in their folder or the collection root', () => {
    const collections: Collection[] = [{ id: 'c1', name: 'My API', createdAt: 1, updatedAt: 1 }];
    const folders: Folder[] = [
      { id: 'f1', collectionId: 'c1', parentFolderId: null, name: 'Users', createdAt: 2, updatedAt: 2 },
      { id: 'f2', collectionId: 'c1', parentFolderId: 'f1', name: 'Admin', createdAt: 3, updatedAt: 3 },
    ];
    const requests: SavedRequest[] = [
      savedRequest({ id: 'r1', collectionId: 'c1', folderId: null, name: 'Root request', createdAt: 4 }),
      savedRequest({ id: 'r2', collectionId: 'c1', folderId: 'f1', name: 'Get Users', createdAt: 5 }),
      savedRequest({ id: 'r3', collectionId: 'c1', folderId: 'f2', name: 'Delete User', createdAt: 6 }),
    ];

    const tree = buildCollectionTree(collections, folders, requests);

    expect(tree).toHaveLength(1);
    expect(tree[0].requests.map((r) => r.id)).toEqual(['r1']);
    expect(tree[0].folders).toHaveLength(1);
    expect(tree[0].folders[0].folder.id).toBe('f1');
    expect(tree[0].folders[0].requests.map((r) => r.id)).toEqual(['r2']);
    expect(tree[0].folders[0].children).toHaveLength(1);
    expect(tree[0].folders[0].children[0].folder.id).toBe('f2');
    expect(tree[0].folders[0].children[0].requests.map((r) => r.id)).toEqual(['r3']);
  });

  it('sorts collections, folders, and requests by creation order', () => {
    const collections: Collection[] = [
      { id: 'c2', name: 'Second', createdAt: 20, updatedAt: 20 },
      { id: 'c1', name: 'First', createdAt: 10, updatedAt: 10 },
    ];
    const tree = buildCollectionTree(collections, [], []);
    expect(tree.map((n) => n.collection.id)).toEqual(['c1', 'c2']);
  });

  it('produces an empty tree for no collections', () => {
    expect(buildCollectionTree([], [], [])).toEqual([]);
  });
});

describe('collectionContentsSummary / folderContentsSummary', () => {
  const folders: Folder[] = [
    { id: 'f1', collectionId: 'c1', parentFolderId: null, name: 'Users', createdAt: 1, updatedAt: 1 },
    { id: 'f2', collectionId: 'c1', parentFolderId: 'f1', name: 'Admin', createdAt: 2, updatedAt: 2 },
  ];
  const requests = [
    savedRequest({ id: 'r1', collectionId: 'c1', folderId: null }),
    savedRequest({ id: 'r2', collectionId: 'c1', folderId: 'f1' }),
    savedRequest({ id: 'r3', collectionId: 'c1', folderId: 'f2' }),
    savedRequest({ id: 'r4', collectionId: 'c2', folderId: null }),
  ];

  it('counts every folder and request in a collection, regardless of nesting', () => {
    expect(collectionContentsSummary(folders, requests, 'c1')).toEqual({ folderCount: 2, requestCount: 3 });
  });

  it('counts zero for a collection with nothing in it', () => {
    expect(collectionContentsSummary(folders, requests, 'c3')).toEqual({ folderCount: 0, requestCount: 0 });
  });

  it('does not count a request that belongs to a different collection', () => {
    expect(collectionContentsSummary(folders, requests, 'c2')).toEqual({ folderCount: 0, requestCount: 1 });
  });

  it('counts a folder and its subtree, not sibling folders/requests', () => {
    expect(folderContentsSummary(folders, requests, 'f1')).toEqual({ folderCount: 1, requestCount: 2 });
  });

  it('counts zero for a leaf folder with nothing in it', () => {
    const emptyFolder: Folder = { id: 'f3', collectionId: 'c1', parentFolderId: null, name: 'Empty', createdAt: 3, updatedAt: 3 };
    expect(folderContentsSummary([...folders, emptyFolder], requests, 'f3')).toEqual({ folderCount: 0, requestCount: 0 });
  });
});
