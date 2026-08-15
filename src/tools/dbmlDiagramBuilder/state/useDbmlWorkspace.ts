import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseDbml } from '../parser/dbmlParser';
import { renameTableInDbml } from '../edit/renameTable';
import { buildNodes } from '../diagram/buildNodes';
import { buildEdges } from '../diagram/buildEdges';
import { layoutSchema, resolvePositions } from '../diagram/layout';
import {
  DEFAULT_UI_PREFS,
  loadActiveDocumentId,
  loadDocuments,
  loadUiPrefs,
  saveActiveDocumentId,
  saveDocuments,
  saveUiPrefs,
  updateDocumentPositions,
  type UiPrefs,
} from '../persistence/localStorage';
import { clearShareParamFromUrl, readSharedSchemaFromUrl } from '../persistence/urlShare';
import { DEFAULT_SAMPLE_DBML } from '../sampleTemplates';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { DatabaseSchema, DbmlDocument, NodePosition } from '../types';

const PARSE_DEBOUNCE_MS = 220;
const TEXT_PERSIST_DEBOUNCE_MS = 500;
const UI_PERSIST_DEBOUNCE_MS = 300;

const EMPTY_SCHEMA: DatabaseSchema = { tables: [], relationships: [], records: [], warnings: [] };

// crypto.randomUUID() only exists in secure contexts (HTTPS or localhost) —
// it throws on a plain-HTTP LAN address, which would otherwise crash the app
// on first load. Fall back to a manual id in that case.
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // fall through
    }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createDocument(name: string, dbml: string): DbmlDocument {
  return { id: generateId(), name, dbml, nodePositions: {}, createdAt: Date.now(), updatedAt: Date.now() };
}

function positionsEqual(a: Record<string, NodePosition>, b: Record<string, NodePosition>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => a[k] && b[k] && a[k].x === b[k].x && a[k].y === b[k].y);
}

export function useDbmlWorkspace() {
  const [ready, setReady] = useState(false);
  const [documents, setDocuments] = useState<DbmlDocument[]>([]);
  const [activeId, setActiveId] = useState('');
  const [dbmlText, setDbmlText] = useState('');
  const [schema, setSchema] = useState<DatabaseSchema>(EMPTY_SCHEMA);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});
  const [uiPrefs, setUiPrefsState] = useState<UiPrefs>(DEFAULT_UI_PREFS);
  const [savedText, setSavedText] = useState('');

  const documentsRef = useRef<DbmlDocument[]>(documents);
  documentsRef.current = documents;

  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const effectiveTheme: 'dark' | 'light' = uiPrefs.theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : uiPrefs.theme;

  // Boot: hydrate from localStorage, or a shared URL, or the default sample.
  useEffect(() => {
    const shared = readSharedSchemaFromUrl();
    let docs = loadDocuments();
    let initialActiveId = loadActiveDocumentId();

    if (shared) {
      const doc = createDocument('Shared diagram', shared);
      docs = [...docs, doc];
      initialActiveId = doc.id;
      clearShareParamFromUrl();
    }

    if (docs.length === 0) {
      const doc = createDocument('Untitled Diagram', DEFAULT_SAMPLE_DBML);
      docs = [doc];
      initialActiveId = doc.id;
    }

    const active = docs.find((d) => d.id === initialActiveId) ?? docs[0];

    setDocuments(docs);
    setActiveId(active.id);
    setDbmlText(active.dbml);
    setSavedText(active.dbml);
    setPositions(active.nodePositions);
    setUiPrefsState(loadUiPrefs());
    saveDocuments(docs);
    saveActiveDocumentId(active.id);
    setReady(true);
  }, []);

  // Debounced parse — never lets a parser exception take the app down.
  useEffect(() => {
    if (!ready) return;
    const handle = setTimeout(() => {
      try {
        setSchema(parseDbml(dbmlText));
        setFatalError(null);
      } catch (err) {
        setFatalError(err instanceof Error ? err.message : 'Unknown parsing error.');
      }
    }, PARSE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [dbmlText, ready]);

  // Debounced persistence of the active document's DBML text.
  useEffect(() => {
    if (!ready || !activeId) return;
    const handle = setTimeout(() => {
      const updated = documentsRef.current.map((d) =>
        d.id === activeId ? { ...d, dbml: dbmlText, updatedAt: Date.now() } : d,
      );
      saveDocuments(updated);
      setDocuments(updated);
      setSavedText(dbmlText);
    }, TEXT_PERSIST_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [dbmlText, activeId, ready]);

  // Resolve node positions whenever the parsed schema changes — new tables
  // get auto-laid-out, existing ones keep whatever position they already had.
  useEffect(() => {
    if (!ready) return;
    setPositions((prev) => resolvePositions(schema, prev));
  }, [schema, ready]);

  // Persist positions (drag results, new-table auto-layout) to the active document.
  useEffect(() => {
    if (!ready || !activeId) return;
    const current = documentsRef.current.find((d) => d.id === activeId);
    if (current && positionsEqual(current.nodePositions, positions)) return;
    const updated = updateDocumentPositions(documentsRef.current, activeId, positions);
    saveDocuments(updated);
    setDocuments(updated);
  }, [positions, activeId, ready]);

  // Debounced persistence of UI prefs (theme, panel width, etc).
  useEffect(() => {
    if (!ready) return;
    const handle = setTimeout(() => saveUiPrefs(uiPrefs), UI_PERSIST_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [uiPrefs, ready]);

  const nodes = useMemo(() => buildNodes(schema, positions), [schema, positions]);
  const edges = useMemo(() => buildEdges(schema, positions), [schema, positions]);

  const onNodeDragStop = useCallback((tableName: string, pos: NodePosition) => {
    setPositions((prev) => ({ ...prev, [tableName]: pos }));
  }, []);

  const relayout = useCallback(() => {
    setPositions(layoutSchema(schema));
  }, [schema]);

  const flushSave = useCallback(() => {
    const updated = documentsRef.current.map((d) => (d.id === activeId ? { ...d, dbml: dbmlText, updatedAt: Date.now() } : d));
    saveDocuments(updated);
    setDocuments(updated);
    setSavedText(dbmlText);
  }, [activeId, dbmlText]);

  /**
   * Diagram → editor half of the two-way binding. The DBML text stays the one
   * source of truth: renaming rewrites it, the debounced parse re-derives the
   * schema, and the diagram follows. Positions are keyed by table name, so the
   * old key is moved across or the renamed table would jump to a fresh
   * auto-layout slot.
   */
  const renameTable = useCallback((oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;

    setDbmlText((text) => renameTableInDbml(text, oldName, trimmed));
    setPositions((prev) => {
      if (!(oldName in prev)) return prev;
      const { [oldName]: moved, ...rest } = prev;
      return { ...rest, [trimmed]: moved };
    });
  }, []);

  const loadDbmlIntoActiveDocument = useCallback((text: string, opts?: { resetPositions?: boolean }) => {
    setDbmlText(text);
    if (opts?.resetPositions) setPositions({});
  }, []);

  const switchDocument = useCallback((id: string) => {
    const doc = documentsRef.current.find((d) => d.id === id);
    if (!doc) return;
    setActiveId(id);
    setDbmlText(doc.dbml);
    setSavedText(doc.dbml);
    setPositions(doc.nodePositions);
    saveActiveDocumentId(id);
  }, []);

  const newDocument = useCallback((seedDbml: string = DEFAULT_SAMPLE_DBML, name = 'Untitled Diagram') => {
    const doc = createDocument(name, seedDbml);
    const updated = [...documentsRef.current, doc];
    saveDocuments(updated);
    setDocuments(updated);
    setActiveId(doc.id);
    setDbmlText(doc.dbml);
    setSavedText(doc.dbml);
    setPositions(doc.nodePositions);
    saveActiveDocumentId(doc.id);
  }, []);

  const renameDocument = useCallback((id: string, name: string) => {
    const updated = documentsRef.current.map((d) => (d.id === id ? { ...d, name, updatedAt: Date.now() } : d));
    saveDocuments(updated);
    setDocuments(updated);
  }, []);

  const duplicateDocument = useCallback((id: string) => {
    const orig = documentsRef.current.find((d) => d.id === id);
    if (!orig) return;
    const copy: DbmlDocument = { ...orig, id: generateId(), name: `${orig.name} copy`, createdAt: Date.now(), updatedAt: Date.now() };
    const updated = [...documentsRef.current, copy];
    saveDocuments(updated);
    setDocuments(updated);
    setActiveId(copy.id);
    setDbmlText(copy.dbml);
    setSavedText(copy.dbml);
    setPositions(copy.nodePositions);
    saveActiveDocumentId(copy.id);
  }, []);

  const deleteDocument = useCallback(
    (id: string) => {
      const current = documentsRef.current;
      if (current.length <= 1) return;
      const updated = current.filter((d) => d.id !== id);
      saveDocuments(updated);
      setDocuments(updated);
      if (id === activeId) {
        const next = updated[0];
        setActiveId(next.id);
        setDbmlText(next.dbml);
        setSavedText(next.dbml);
        setPositions(next.nodePositions);
        saveActiveDocumentId(next.id);
      }
    },
    [activeId],
  );

  const setTheme = useCallback((theme: UiPrefs['theme']) => setUiPrefsState((p) => ({ ...p, theme })), []);
  const setEditorWidthPct = useCallback((pct: number) => setUiPrefsState((p) => ({ ...p, editorWidthPct: pct })), []);
  const toggleEditorCollapsed = useCallback(() => setUiPrefsState((p) => ({ ...p, editorCollapsed: !p.editorCollapsed })), []);
  const setMinimapVisible = useCallback((visible: boolean) => setUiPrefsState((p) => ({ ...p, minimapVisible: visible })), []);

  const activeDocument = documents.find((d) => d.id === activeId) ?? null;
  const errorLine = schema.warnings[0]?.line ?? null;

  return {
    ready,
    documents,
    activeId,
    activeDocument,
    dbmlText,
    schema,
    fatalError,
    nodes,
    edges,
    uiPrefs,
    effectiveTheme,
    saved: dbmlText === savedText,
    errorLine,
    setDbmlText,
    renameTable,
    loadDbmlIntoActiveDocument,
    onNodeDragStop,
    relayout,
    flushSave,
    switchDocument,
    newDocument,
    renameDocument,
    duplicateDocument,
    deleteDocument,
    setTheme,
    setEditorWidthPct,
    toggleEditorCollapsed,
    setMinimapVisible,
  };
}

export type DbmlWorkspace = ReturnType<typeof useDbmlWorkspace>;
