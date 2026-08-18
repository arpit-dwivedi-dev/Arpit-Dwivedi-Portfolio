import type { DbmlDocument, NodePosition } from '../types';

const DOCUMENTS_KEY = 'dbml-builder:documents:v1';
const ACTIVE_ID_KEY = 'dbml-builder:active-id:v1';
const UI_KEY = 'dbml-builder:ui:v1';

export interface UiPrefs {
  theme: 'dark' | 'light' | 'system';
  editorWidthPct: number;
  editorCollapsed: boolean;
  minimapVisible: boolean;
}

export const DEFAULT_UI_PREFS: UiPrefs = {
  theme: 'dark',
  editorWidthPct: 48,
  editorCollapsed: false,
  minimapVisible: true,
};

const THEMES: UiPrefs['theme'][] = ['dark', 'light', 'system'];

/** Merges stored UI prefs onto the defaults field-by-field, rejecting any field of the wrong shape/type rather than letting it through as-is. */
function sanitizeUiPrefs(raw: unknown, fallback: UiPrefs): UiPrefs {
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Record<string, unknown>;
  return {
    theme: THEMES.includes(r.theme as UiPrefs['theme']) ? (r.theme as UiPrefs['theme']) : fallback.theme,
    editorWidthPct: Number.isFinite(r.editorWidthPct) ? (r.editorWidthPct as number) : fallback.editorWidthPct,
    editorCollapsed: typeof r.editorCollapsed === 'boolean' ? r.editorCollapsed : fallback.editorCollapsed,
    minimapVisible: typeof r.minimapVisible === 'boolean' ? r.minimapVisible : fallback.minimapVisible,
  };
}

function safeGet<T>(key: string, fallback: T, sanitize: (raw: unknown, fallback: T) => T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return sanitize(JSON.parse(raw), fallback);
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // localStorage can throw in private browsing / when the quota is full —
    // the app should keep working in-memory rather than crash. Callers use
    // the return value to surface a warning without touching the app state.
    return false;
  }
}

function isValidPosition(v: unknown): v is NodePosition {
  return (
    !!v &&
    typeof v === 'object' &&
    Number.isFinite((v as NodePosition).x) &&
    Number.isFinite((v as NodePosition).y)
  );
}

/** Drops any entry that isn't a well-formed `{ x, y }` pair — a corrupt or hand-edited position must never crash layout. */
function sanitizeNodePositions(v: unknown): Record<string, NodePosition> {
  if (!v || typeof v !== 'object') return {};
  const out: Record<string, NodePosition> = {};
  for (const [key, pos] of Object.entries(v as Record<string, unknown>)) {
    if (isValidPosition(pos)) out[key] = { x: pos.x, y: pos.y };
  }
  return out;
}

/**
 * Validates one stored document, defaulting/dropping fields as needed so a
 * hand-edited, truncated, or pre-schema-support (older app version) entry
 * degrades gracefully instead of propagating `undefined`s into rendering,
 * layout and persistence. Returns `null` for an entry too broken to recover
 * an id/dbml string from at all.
 */
function sanitizeDocument(raw: unknown): DbmlDocument | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.id !== 'string' || !d.id) return null;
  if (typeof d.dbml !== 'string') return null;
  return {
    id: d.id,
    name: typeof d.name === 'string' && d.name.trim() ? d.name : 'Untitled Diagram',
    dbml: d.dbml,
    nodePositions: sanitizeNodePositions(d.nodePositions),
    createdAt: Number.isFinite(d.createdAt) ? (d.createdAt as number) : Date.now(),
    updatedAt: Number.isFinite(d.updatedAt) ? (d.updatedAt as number) : Date.now(),
  };
}

export function loadDocuments(): DbmlDocument[] {
  try {
    const raw = window.localStorage.getItem(DOCUMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const sanitized = parsed.map(sanitizeDocument).filter((d): d is DbmlDocument => d !== null);
    // Duplicate ids (corrupt storage, a bad manual edit) would otherwise let
    // two documents collide on `activeId` lookups — keep only the first.
    const seen = new Set<string>();
    return sanitized.filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  } catch {
    return [];
  }
}

export function saveDocuments(documents: DbmlDocument[]): boolean {
  return safeSet(DOCUMENTS_KEY, documents);
}

export function loadActiveDocumentId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_ID_KEY);
  } catch {
    return null;
  }
}

export function saveActiveDocumentId(id: string): boolean {
  try {
    window.localStorage.setItem(ACTIVE_ID_KEY, id);
    return true;
  } catch {
    return false;
  }
}

export function loadUiPrefs(): UiPrefs {
  return safeGet(UI_KEY, DEFAULT_UI_PREFS, sanitizeUiPrefs);
}

export function saveUiPrefs(prefs: UiPrefs): boolean {
  return safeSet(UI_KEY, prefs);
}

export function updateDocumentPositions(
  documents: DbmlDocument[],
  documentId: string,
  positions: Record<string, NodePosition>,
): DbmlDocument[] {
  return documents.map((doc) =>
    doc.id === documentId ? { ...doc, nodePositions: positions, updatedAt: Date.now() } : doc,
  );
}
