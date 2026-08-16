import { redactSecrets } from './storage';
import { normalizeUnknownRequest } from './requestValidation';
import type { Collection, Folder } from './collections';
import type { ApiRequest, SavedRequest } from './types';

// Identifies files produced by this tool, independent of any internal storage shape —
// storage.ts's localStorage records are free to change shape over time; this format
// is a stable, versioned contract for data leaving the app.
export const EXPORT_FORMAT = '101tl-api-request-builder';
export const EXPORT_VERSION = 1;

// ~5MB of JSON text. Generous for even a large collection (hundreds of requests) while
// still cheap to JSON.parse synchronously on the main thread without freezing the tab.
export const MAX_IMPORT_TEXT_LENGTH = 5_000_000;

export interface ExportCollection {
  id: string;
  name: string;
}

export interface ExportFolder {
  id: string;
  collectionId: string;
  parentFolderId: string | null;
  name: string;
}

export interface ExportRequest {
  id: string;
  collectionId: string;
  folderId: string | null;
  name: string;
  request: ApiRequest;
}

export interface ExportPayload {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  collections: ExportCollection[];
  folders: ExportFolder[];
  requests: ExportRequest[];
}

/** Builds a versioned export payload scoped to the given collection ids only — no history,
 *  response bodies, generated code, or environment values, and every request is re-passed
 *  through redactSecrets() as a second, independent guarantee that no plaintext credential
 *  can leave the browser even if a caller somehow got hold of an unredacted SavedRequest
 *  (secrets are already stripped at save time by storage.upsertSavedRequest — this is
 *  defense in depth, not the only line of defense). */
export const buildExportPayload = (
  collectionIds: string[],
  collections: Collection[],
  folders: Folder[],
  savedRequests: SavedRequest[],
): ExportPayload => {
  const idSet = new Set(collectionIds);
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    collections: collections.filter((c) => idSet.has(c.id)).map((c) => ({ id: c.id, name: c.name })),
    folders: folders
      .filter((f) => idSet.has(f.collectionId))
      .map((f) => ({ id: f.id, collectionId: f.collectionId, parentFolderId: f.parentFolderId, name: f.name })),
    requests: savedRequests
      .filter((r) => idSet.has(r.collectionId))
      .map((r) => ({ id: r.id, collectionId: r.collectionId, folderId: r.folderId, name: r.name, request: redactSecrets(r.request) })),
  };
};

export interface ParsedExport {
  payload: ExportPayload;
  /** Entries dropped for being malformed — surfaced to the user rather than silently lost. */
  skipped: { collections: number; folders: number; requests: number };
}

// Flat shape rather than a discriminated union — same reasoning as shareRequest.ts's
// EncodeShareResult/DecodeShareResult (this project's tsconfig has no strictNullChecks, so
// narrowing on a boolean discriminant doesn't reliably eliminate union members).
export interface ParseExportResult {
  ok: boolean;
  result?: ParsedExport;
  error?: string;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

/** Parses and validates a previously-exported JSON file — untrusted input, since it's
 *  whatever the user picked off disk. A structurally broken top level (not JSON, wrong
 *  format tag, unsupported version) fails outright; a malformed individual collection/
 *  folder/request is dropped rather than failing the whole import, so one bad entry never
 *  blocks the rest of an otherwise-valid file. */
export const parseExportPayload = (text: string): ParseExportResult => {
  if (text.length > MAX_IMPORT_TEXT_LENGTH) {
    return { ok: false, error: `File is too large to import (limit ${Math.floor(MAX_IMPORT_TEXT_LENGTH / 1_000_000)}MB).` };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Couldn't read that file — it doesn't look like valid JSON." };
  }

  if (!isObject(parsed)) return { ok: false, error: 'Unrecognized file format.' };
  if (parsed.format !== EXPORT_FORMAT) return { ok: false, error: 'This file was not exported from the API Request Builder.' };
  if (parsed.version !== EXPORT_VERSION) return { ok: false, error: `Unsupported export version (${String(parsed.version)}).` };

  const rawCollections = Array.isArray(parsed.collections) ? parsed.collections : [];
  const collections: ExportCollection[] = [];
  let skippedCollections = 0;
  for (const c of rawCollections) {
    if (isObject(c) && isNonEmptyString(c.id)) {
      collections.push({ id: c.id, name: isNonEmptyString(c.name) ? c.name : 'Untitled collection' });
    } else {
      skippedCollections++;
    }
  }
  const collectionIds = new Set(collections.map((c) => c.id));

  const rawFolders = Array.isArray(parsed.folders) ? parsed.folders : [];
  const folders: ExportFolder[] = [];
  let skippedFolders = 0;
  for (const f of rawFolders) {
    if (isObject(f) && isNonEmptyString(f.id) && isNonEmptyString(f.collectionId) && collectionIds.has(f.collectionId)) {
      folders.push({
        id: f.id,
        collectionId: f.collectionId,
        parentFolderId: isNonEmptyString(f.parentFolderId) ? f.parentFolderId : null,
        name: isNonEmptyString(f.name) ? f.name : 'Untitled folder',
      });
    } else {
      skippedFolders++;
    }
  }

  const rawRequests = Array.isArray(parsed.requests) ? parsed.requests : [];
  const requests: ExportRequest[] = [];
  let skippedRequests = 0;
  for (const r of rawRequests) {
    const request = isObject(r) ? normalizeUnknownRequest(r.request) : null;
    if (isObject(r) && isNonEmptyString(r.id) && isNonEmptyString(r.collectionId) && collectionIds.has(r.collectionId) && request) {
      requests.push({
        id: r.id,
        collectionId: r.collectionId,
        folderId: isNonEmptyString(r.folderId) ? r.folderId : null,
        name: isNonEmptyString(r.name) ? r.name : 'Untitled request',
        request,
      });
    } else {
      skippedRequests++;
    }
  }

  return {
    ok: true,
    result: {
      payload: {
        format: EXPORT_FORMAT,
        version: EXPORT_VERSION,
        exportedAt: isNonEmptyString(parsed.exportedAt) ? parsed.exportedAt : new Date().toISOString(),
        collections,
        folders,
        requests,
      },
      skipped: { collections: skippedCollections, folders: skippedFolders, requests: skippedRequests },
    },
  };
};
