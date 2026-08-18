import { saveDocuments, saveUiPrefs, saveActiveDocumentId, loadDocuments, loadUiPrefs, DEFAULT_UI_PREFS } from './localStorage';
import type { DbmlDocument } from '../types';

function mockLocalStorage(setItem: (key: string, value: string) => void) {
  Object.defineProperty(global, 'window', {
    value: { localStorage: { setItem } },
    configurable: true,
  });
}

function mockLocalStorageGet(values: Record<string, string>) {
  Object.defineProperty(global, 'window', {
    value: { localStorage: { getItem: (key: string) => values[key] ?? null } },
    configurable: true,
  });
}

const sampleDocs: DbmlDocument[] = [
  { id: '1', name: 'Untitled', dbml: 'Table users { id int }', nodePositions: {}, createdAt: 0, updatedAt: 0 },
];

describe('saveDocuments', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true on a successful save', () => {
    const setItem = jest.fn();
    mockLocalStorage(setItem);

    expect(saveDocuments(sampleDocs)).toBe(true);
    expect(setItem).toHaveBeenCalledWith('dbml-builder:documents:v1', JSON.stringify(sampleDocs));
  });

  it('returns false when setItem throws', () => {
    mockLocalStorage(() => {
      throw new Error('boom');
    });

    expect(saveDocuments(sampleDocs)).toBe(false);
  });

  it('returns false when setItem throws a quota-exceeded error', () => {
    mockLocalStorage(() => {
      throw new DOMException('exceeded quota', 'QuotaExceededError');
    });

    expect(saveDocuments(sampleDocs)).toBe(false);
  });

  it('returns false when localStorage is unavailable (private-browsing style restriction)', () => {
    Object.defineProperty(global, 'window', {
      value: {
        get localStorage(): never {
          throw new DOMException('storage disabled', 'SecurityError');
        },
      },
      configurable: true,
    });

    expect(saveDocuments(sampleDocs)).toBe(false);
  });

  it('does not throw out of the module — callers never need a try/catch', () => {
    mockLocalStorage(() => {
      throw new Error('boom');
    });

    expect(() => saveDocuments(sampleDocs)).not.toThrow();
  });
});

describe('saveUiPrefs', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true on a successful save', () => {
    mockLocalStorage(jest.fn());
    expect(saveUiPrefs(DEFAULT_UI_PREFS)).toBe(true);
  });

  it('returns false when the write throws', () => {
    mockLocalStorage(() => {
      throw new Error('boom');
    });
    expect(saveUiPrefs(DEFAULT_UI_PREFS)).toBe(false);
  });
});

describe('saveActiveDocumentId', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true on a successful save', () => {
    mockLocalStorage(jest.fn());
    expect(saveActiveDocumentId('doc-1')).toBe(true);
  });

  it('returns false when the write throws', () => {
    mockLocalStorage(() => {
      throw new Error('boom');
    });
    expect(saveActiveDocumentId('doc-1')).toBe(false);
  });

  it('recovers once storage becomes available again after a prior failure', () => {
    mockLocalStorage(() => {
      throw new Error('boom');
    });
    expect(saveActiveDocumentId('doc-1')).toBe(false);

    mockLocalStorage(jest.fn());
    expect(saveActiveDocumentId('doc-1')).toBe(true);
  });
});

describe('loadDocuments — malformed / old / unexpected stored data', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns an empty list when nothing is stored', () => {
    mockLocalStorageGet({});
    expect(loadDocuments()).toEqual([]);
  });

  it('returns an empty list for unparsable JSON rather than throwing', () => {
    mockLocalStorageGet({ 'dbml-builder:documents:v1': '{not json' });
    expect(() => loadDocuments()).not.toThrow();
    expect(loadDocuments()).toEqual([]);
  });

  it('returns an empty list when the stored value is not an array', () => {
    mockLocalStorageGet({ 'dbml-builder:documents:v1': JSON.stringify({ id: '1' }) });
    expect(loadDocuments()).toEqual([]);
  });

  it('drops entries with no recoverable id or dbml text', () => {
    mockLocalStorageGet({
      'dbml-builder:documents:v1': JSON.stringify([null, 42, {}, { id: 'ok', dbml: 'Table t { id int }' }]),
    });
    const docs = loadDocuments();
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe('ok');
  });

  it('defaults a missing/invalid name, nodePositions, createdAt and updatedAt on an otherwise-valid entry', () => {
    mockLocalStorageGet({
      'dbml-builder:documents:v1': JSON.stringify([
        { id: '1', dbml: 'Table t { id int }', name: 42, nodePositions: 'not-an-object', createdAt: 'x', updatedAt: null },
      ]),
    });
    const [doc] = loadDocuments();
    expect(doc.name).toBe('Untitled Diagram');
    expect(doc.nodePositions).toEqual({});
    expect(typeof doc.createdAt).toBe('number');
    expect(typeof doc.updatedAt).toBe('number');
  });

  it('drops individual malformed node positions but keeps the valid ones (e.g. from a pre-schema-support save)', () => {
    mockLocalStorageGet({
      'dbml-builder:documents:v1': JSON.stringify([
        {
          id: '1',
          dbml: 'Table users { id int }',
          nodePositions: { users: { x: 10, y: 20 }, broken: { x: 'nope' }, alsoBroken: null },
        },
      ]),
    });
    const [doc] = loadDocuments();
    expect(doc.nodePositions).toEqual({ users: { x: 10, y: 20 } });
  });

  it('de-duplicates entries that share the same id, keeping the first', () => {
    mockLocalStorageGet({
      'dbml-builder:documents:v1': JSON.stringify([
        { id: '1', dbml: 'Table a { id int }', name: 'First' },
        { id: '1', dbml: 'Table b { id int }', name: 'Second' },
      ]),
    });
    const docs = loadDocuments();
    expect(docs).toHaveLength(1);
    expect(docs[0].name).toBe('First');
  });
});

describe('loadUiPrefs — malformed / old / unexpected stored data', () => {
  afterEach(() => jest.restoreAllMocks());

  it('falls back to defaults when nothing is stored', () => {
    mockLocalStorageGet({});
    expect(loadUiPrefs()).toEqual(DEFAULT_UI_PREFS);
  });

  it('falls back to defaults for unparsable JSON rather than throwing', () => {
    mockLocalStorageGet({ 'dbml-builder:ui:v1': 'not json{' });
    expect(() => loadUiPrefs()).not.toThrow();
    expect(loadUiPrefs()).toEqual(DEFAULT_UI_PREFS);
  });

  it('falls back to defaults when the stored value is not an object (e.g. an old array-shaped format)', () => {
    mockLocalStorageGet({ 'dbml-builder:ui:v1': JSON.stringify([1, 2, 3]) });
    expect(loadUiPrefs()).toEqual(DEFAULT_UI_PREFS);
  });

  it('rejects an invalid theme value and keeps every other valid field', () => {
    mockLocalStorageGet({
      'dbml-builder:ui:v1': JSON.stringify({ theme: 'rainbow', editorWidthPct: 60, editorCollapsed: true, minimapVisible: false }),
    });
    expect(loadUiPrefs()).toEqual({ ...DEFAULT_UI_PREFS, editorWidthPct: 60, editorCollapsed: true, minimapVisible: false });
  });

  it('rejects a non-numeric editorWidthPct and a non-boolean editorCollapsed', () => {
    mockLocalStorageGet({
      'dbml-builder:ui:v1': JSON.stringify({ editorWidthPct: '60%', editorCollapsed: 'yes' }),
    });
    expect(loadUiPrefs()).toEqual(DEFAULT_UI_PREFS);
  });
});
