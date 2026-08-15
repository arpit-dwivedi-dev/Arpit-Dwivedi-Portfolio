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

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage can throw in private browsing / when the quota is full —
    // the app should keep working in-memory rather than crash.
  }
}

export function loadDocuments(): DbmlDocument[] {
  try {
    const raw = window.localStorage.getItem(DOCUMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDocuments(documents: DbmlDocument[]): void {
  safeSet(DOCUMENTS_KEY, documents);
}

export function loadActiveDocumentId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_ID_KEY);
  } catch {
    return null;
  }
}

export function saveActiveDocumentId(id: string): void {
  try {
    window.localStorage.setItem(ACTIVE_ID_KEY, id);
  } catch {
    // ignore
  }
}

export function loadUiPrefs(): UiPrefs {
  return safeGet(UI_KEY, DEFAULT_UI_PREFS);
}

export function saveUiPrefs(prefs: UiPrefs): void {
  safeSet(UI_KEY, prefs);
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
