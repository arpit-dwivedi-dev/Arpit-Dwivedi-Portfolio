import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker';

let configured = false;

/**
 * Points @monaco-editor/react at the monaco-editor package bundled by Vite
 * instead of its default CDN loader, and wires up the base editor worker —
 * this tool has to work fully offline once assets are loaded, so nothing
 * here can depend on a network fetch at runtime.
 */
export function ensureMonacoConfigured(): void {
  if (configured) return;
  configured = true;

  (self as unknown as { MonacoEnvironment: monaco.Environment }).MonacoEnvironment = {
    getWorker() {
      return new EditorWorker();
    },
  };

  loader.config({ monaco });
}
