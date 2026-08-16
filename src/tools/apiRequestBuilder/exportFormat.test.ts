import { createBlankRequest, type ApiRequest, type SavedRequest } from './types';
import type { Collection, Folder } from './collections';
import { EXPORT_FORMAT, EXPORT_VERSION, MAX_IMPORT_TEXT_LENGTH, buildExportPayload, parseExportPayload } from './exportFormat';

const collection = (id: string, name: string): Collection => ({ id, name, createdAt: 1, updatedAt: 1 });
const folder = (id: string, collectionId: string, parentFolderId: string | null, name: string): Folder => ({
  id,
  collectionId,
  parentFolderId,
  name,
  createdAt: 1,
  updatedAt: 1,
});

const secretRequest = (): ApiRequest => ({
  ...createBlankRequest(),
  url: '{{baseUrl}}/users',
  auth: { type: 'bearer', bearerToken: 'super-secret-token', basicUsername: '', basicPassword: '', apiKeyName: '', apiKeyValue: '', apiKeyLocation: 'header' },
});

const savedRequest = (id: string, collectionId: string, folderId: string | null, request: ApiRequest): SavedRequest => ({
  id,
  collectionId,
  folderId,
  name: 'Get Users',
  createdAt: 1,
  updatedAt: 1,
  request,
});

describe('buildExportPayload', () => {
  it('produces the versioned top-level structure', () => {
    const payload = buildExportPayload(['c1'], [collection('c1', 'My API')], [], []);
    expect(payload.format).toBe(EXPORT_FORMAT);
    expect(payload.version).toBe(EXPORT_VERSION);
    expect(typeof payload.exportedAt).toBe('string');
    expect(Array.isArray(payload.collections)).toBe(true);
    expect(Array.isArray(payload.folders)).toBe(true);
    expect(Array.isArray(payload.requests)).toBe(true);
  });

  it('scopes output to only the selected collection ids', () => {
    const collections = [collection('c1', 'My API'), collection('c2', 'Other')];
    const folders = [folder('f1', 'c1', null, 'Users'), folder('f2', 'c2', null, 'Ignored')];
    const requests = [savedRequest('r1', 'c1', 'f1', secretRequest()), savedRequest('r2', 'c2', 'f2', secretRequest())];
    const payload = buildExportPayload(['c1'], collections, folders, requests);
    expect(payload.collections.map((c) => c.id)).toEqual(['c1']);
    expect(payload.folders.map((f) => f.id)).toEqual(['f1']);
    expect(payload.requests.map((r) => r.id)).toEqual(['r1']);
  });

  it('preserves nested folder hierarchy references', () => {
    const collections = [collection('c1', 'My API')];
    const folders = [folder('f1', 'c1', null, 'Users'), folder('f2', 'c1', 'f1', 'Admin')];
    const payload = buildExportPayload(['c1'], collections, folders, []);
    const admin = payload.folders.find((f) => f.id === 'f2');
    expect(admin?.parentFolderId).toBe('f1');
  });

  it('keeps unresolved {{variable}} templates intact', () => {
    const payload = buildExportPayload(['c1'], [collection('c1', 'My API')], [], [savedRequest('r1', 'c1', null, secretRequest())]);
    expect(payload.requests[0].request.url).toBe('{{baseUrl}}/users');
  });

  it('redacts secrets on every exported request even if the input was not yet redacted', () => {
    const payload = buildExportPayload(['c1'], [collection('c1', 'My API')], [], [savedRequest('r1', 'c1', null, secretRequest())]);
    expect(payload.requests[0].request.auth.bearerToken).toBe('');
    expect(JSON.stringify(payload)).not.toContain('super-secret-token');
  });
});

describe('parseExportPayload', () => {
  const validText = () =>
    JSON.stringify(
      buildExportPayload(['c1'], [collection('c1', 'My API')], [folder('f1', 'c1', null, 'Users')], [savedRequest('r1', 'c1', 'f1', secretRequest())]),
    );

  it('accepts a well-formed export', () => {
    const result = parseExportPayload(validText());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.payload.collections).toHaveLength(1);
      expect(result.result.payload.folders).toHaveLength(1);
      expect(result.result.payload.requests).toHaveLength(1);
      expect(result.result.skipped).toEqual({ collections: 0, folders: 0, requests: 0 });
    }
  });

  it('rejects malformed JSON', () => {
    expect(parseExportPayload('{not json').ok).toBe(false);
  });

  it('rejects a file with the wrong format tag', () => {
    const text = JSON.stringify({ format: 'something-else', version: 1, collections: [], folders: [], requests: [] });
    expect(parseExportPayload(text).ok).toBe(false);
  });

  it('rejects an unsupported version', () => {
    const text = JSON.stringify({ format: EXPORT_FORMAT, version: 999, collections: [], folders: [], requests: [] });
    expect(parseExportPayload(text).ok).toBe(false);
  });

  it('tolerates missing arrays by treating them as empty', () => {
    const text = JSON.stringify({ format: EXPORT_FORMAT, version: EXPORT_VERSION });
    const result = parseExportPayload(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.payload.collections).toEqual([]);
      expect(result.result.payload.requests).toEqual([]);
    }
  });

  it('drops a folder referencing an unknown collection id, without failing the whole import', () => {
    const text = JSON.stringify({
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      collections: [{ id: 'c1', name: 'My API' }],
      folders: [{ id: 'f1', collectionId: 'does-not-exist', parentFolderId: null, name: 'Orphan' }],
      requests: [],
    });
    const result = parseExportPayload(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.payload.folders).toHaveLength(0);
      expect(result.result.skipped.folders).toBe(1);
    }
  });

  it('drops a malformed request entry (no recoverable url) without failing the whole import', () => {
    const text = JSON.stringify({
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      collections: [{ id: 'c1', name: 'My API' }],
      folders: [],
      requests: [{ id: 'r1', collectionId: 'c1', folderId: null, name: 'Broken', request: { method: 'GET' } }],
    });
    const result = parseExportPayload(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.payload.requests).toHaveLength(0);
      expect(result.result.skipped.requests).toBe(1);
    }
  });

  it('rejects a file larger than MAX_IMPORT_TEXT_LENGTH', () => {
    const text = JSON.stringify({ format: EXPORT_FORMAT, version: EXPORT_VERSION, collections: [], folders: [], requests: [] });
    const padded = text.slice(0, -1) + ' '.repeat(MAX_IMPORT_TEXT_LENGTH + 1) + '}';
    const result = parseExportPayload(padded);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/too large/i);
  });
});
