import { nameCollides, type Collection, type Folder } from './collections';
import { normalizeUnknownRequest } from './requestValidation';
import { nextId, type SavedRequest } from './types';
import type { ExportPayload } from './exportFormat';

export interface ImportPlan {
  collections: Collection[];
  folders: Folder[];
  requests: SavedRequest[];
  /** Folders/requests dropped during remapping (e.g. a request whose `.request` failed
   *  re-validation) — on top of whatever exportFormat.parseExportPayload already reported. */
  skipped: { folders: number; requests: number };
}

const IMPORTED_SUFFIX = ' (Imported)';

/** Disambiguates an imported collection's name against every collection name already
 *  known (existing local collections + collections already placed earlier in this same
 *  import) by appending a counter, same convention the page uses for New Collection/New
 *  Folder ("New Folder 2", "New Folder 3", ...). */
const uniqueImportedName = (base: string, takenNames: string[]): string => {
  const withSuffix = `${base}${IMPORTED_SUFFIX}`;
  if (!nameCollides(takenNames, withSuffix)) return withSuffix;
  let n = 2;
  while (nameCollides(takenNames, `${withSuffix} ${n}`)) n += 1;
  return `${withSuffix} ${n}`;
};

/** Turns a parsed export payload into brand-new Collection/Folder/SavedRequest records
 *  ready to be persisted alongside whatever already exists locally — nothing here reads
 *  from or writes to storage, it only computes the plan (see PART 21: pure, framework-
 *  independent modules). Every id is freshly generated so imported records can never
 *  collide with — or silently merge into — existing ones; every collection is imported
 *  as a new, separately-named collection rather than overwriting a same-named original. */
export const buildImportPlan = (payload: ExportPayload, existingCollectionNames: string[]): ImportPlan => {
  const now = Date.now();
  const takenNames = [...existingCollectionNames];

  const collectionIdMap = new Map<string, string>();
  const collections: Collection[] = payload.collections.map((c) => {
    const newId = nextId();
    collectionIdMap.set(c.id, newId);
    const name = uniqueImportedName(c.name, takenNames);
    takenNames.push(name);
    return { id: newId, name, createdAt: now, updatedAt: now };
  });

  // Two passes: first assign every valid folder a new id (so parent references can
  // resolve regardless of array order), then remap parentFolderId. A folder whose
  // collection was dropped, or whose parent wasn't itself importable, is skipped/
  // promoted to root — the same defensive pattern storage.ts uses for corrupt local data.
  const folderIdMap = new Map<string, string>();
  const validSourceFolders = payload.folders.filter((f) => collectionIdMap.has(f.collectionId));
  for (const f of validSourceFolders) folderIdMap.set(f.id, nextId());

  const folders: Folder[] = validSourceFolders.map((f) => ({
    id: folderIdMap.get(f.id)!,
    collectionId: collectionIdMap.get(f.collectionId)!,
    parentFolderId: f.parentFolderId && folderIdMap.has(f.parentFolderId) ? folderIdMap.get(f.parentFolderId)! : null,
    name: f.name,
    createdAt: now,
    updatedAt: now,
  }));
  const skippedFolders = payload.folders.length - validSourceFolders.length;

  const requests: SavedRequest[] = [];
  let skippedRequests = 0;
  for (const r of payload.requests) {
    const newCollectionId = collectionIdMap.get(r.collectionId);
    // Re-validated defensively even though exportFormat already validated it once —
    // cheap, and keeps this function safe to call with any ExportPayload-shaped value,
    // not just one that went through parseExportPayload.
    const request = normalizeUnknownRequest(r.request);
    if (!newCollectionId || !request) {
      skippedRequests++;
      continue;
    }
    requests.push({
      id: nextId(),
      collectionId: newCollectionId,
      folderId: r.folderId && folderIdMap.has(r.folderId) ? folderIdMap.get(r.folderId)! : null,
      name: r.name,
      createdAt: now,
      updatedAt: now,
      request,
    });
  }

  return { collections, folders, requests, skipped: { folders: skippedFolders, requests: skippedRequests } };
};
