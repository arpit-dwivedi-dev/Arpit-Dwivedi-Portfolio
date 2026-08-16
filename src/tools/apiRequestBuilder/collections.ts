import { nextId, type SavedRequest } from './types';

export interface Collection {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  collectionId: string;
  parentFolderId: string | null;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export const createCollection = (name: string): Collection => {
  const now = Date.now();
  return { id: nextId(), name, createdAt: now, updatedAt: now };
};

export const createFolder = (collectionId: string, parentFolderId: string | null, name: string): Folder => {
  const now = Date.now();
  return { id: nextId(), collectionId, parentFolderId, name, createdAt: now, updatedAt: now };
};

// Collection → Folder → Subfolder → Sub-subfolder → Request. A root folder (parentFolderId
// null) is depth 1; three folder levels is the deliberate ceiling — deep enough for real
// projects, shallow enough that the tree UI never needs virtualization or a "load more" step.
export const MAX_FOLDER_DEPTH = 3;

/** 1-based depth of an existing folder, counting up its parent chain. */
export const folderDepth = (folders: Folder[], folderId: string): number => {
  let depth = 1;
  let current = folders.find((f) => f.id === folderId);
  while (current?.parentFolderId) {
    depth += 1;
    current = folders.find((f) => f.id === current!.parentFolderId);
  }
  return depth;
};

/** Whether a new folder may be created under `parentFolderId` (null = collection root)
 *  without exceeding MAX_FOLDER_DEPTH. */
export const canCreateSubfolder = (folders: Folder[], parentFolderId: string | null): boolean =>
  parentFolderId === null || folderDepth(folders, parentFolderId) < MAX_FOLDER_DEPTH;

/** Every folder id nested (at any depth) under `rootFolderId`, not including itself — used to
 *  cascade-delete a folder's whole subtree and to scope "what does deleting this affect". */
export const descendantFolderIds = (folders: Folder[], rootFolderId: string): string[] => {
  const result: string[] = [];
  const stack = [rootFolderId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const folder of folders) {
      if (folder.parentFolderId === current) {
        result.push(folder.id);
        stack.push(folder.id);
      }
    }
  }
  return result;
};

/** "Users / Admin" style breadcrumb for a folder — used to label Move-request destination
 *  options and folder rows without needing to walk the tree again in the UI. */
export const folderPath = (folders: Folder[], folderId: string): string => {
  const names: string[] = [];
  let current = folders.find((f) => f.id === folderId);
  while (current) {
    names.unshift(current.name);
    current = current.parentFolderId ? folders.find((f) => f.id === current!.parentFolderId) : undefined;
  }
  return names.join(' / ');
};

/** Case-insensitive, whitespace-trimmed collision check — used before creating/renaming a
 *  collection or folder so two siblings never end up with the functionally-same name. */
export const nameCollides = (existingNames: string[], name: string): boolean => {
  const normalized = name.trim().toLowerCase();
  return existingNames.some((existing) => existing.trim().toLowerCase() === normalized);
};

export interface FolderNode {
  folder: Folder;
  children: FolderNode[];
  requests: SavedRequest[];
}

export interface CollectionNode {
  collection: Collection;
  folders: FolderNode[];
  /** Requests saved directly in the collection root — not inside any folder. */
  requests: SavedRequest[];
}

const byCreatedAt = <T extends { createdAt: number }>(a: T, b: T): number => a.createdAt - b.createdAt;

const buildFolderNode = (folder: Folder, folders: Folder[], requests: SavedRequest[]): FolderNode => ({
  folder,
  children: folders
    .filter((f) => f.parentFolderId === folder.id)
    .sort(byCreatedAt)
    .map((f) => buildFolderNode(f, folders, requests)),
  requests: requests.filter((r) => r.folderId === folder.id).sort(byCreatedAt),
});

/** Turns the flat (collections, folders, savedRequests) arrays from storage into a nested tree
 *  for the browser UI — the only place tree shape is computed, so the component itself stays a
 *  plain recursive renderer with no traversal logic of its own. Bounded by MAX_FOLDER_DEPTH in
 *  practice since that's enforced at folder-creation time, not by this function. */
export const buildCollectionTree = (collections: Collection[], folders: Folder[], savedRequests: SavedRequest[]): CollectionNode[] =>
  [...collections].sort(byCreatedAt).map((collection) => {
    const collectionFolders = folders.filter((f) => f.collectionId === collection.id);
    const collectionRequests = savedRequests.filter((r) => r.collectionId === collection.id);
    return {
      collection,
      folders: collectionFolders
        .filter((f) => f.parentFolderId === null)
        .sort(byCreatedAt)
        .map((f) => buildFolderNode(f, collectionFolders, collectionRequests)),
      requests: collectionRequests.filter((r) => r.folderId === null).sort(byCreatedAt),
    };
  });

/** How many folders/requests deleting this collection would take with it — surfaced in the
 *  delete-confirmation copy so a one-click action never silently destroys dozens of requests. */
export const collectionContentsSummary = (
  folders: Folder[],
  savedRequests: Pick<SavedRequest, 'collectionId' | 'folderId'>[],
  collectionId: string,
): { folderCount: number; requestCount: number } => ({
  folderCount: folders.filter((f) => f.collectionId === collectionId).length,
  requestCount: savedRequests.filter((r) => r.collectionId === collectionId).length,
});

/** Same as collectionContentsSummary but scoped to a folder and everything nested under it. */
export const folderContentsSummary = (
  folders: Folder[],
  savedRequests: Pick<SavedRequest, 'collectionId' | 'folderId'>[],
  folderId: string,
): { folderCount: number; requestCount: number } => {
  const subtreeIds = new Set(descendantFolderIds(folders, folderId));
  return {
    folderCount: subtreeIds.size,
    requestCount: savedRequests.filter((r) => r.folderId !== null && (r.folderId === folderId || subtreeIds.has(r.folderId))).length,
  };
};
