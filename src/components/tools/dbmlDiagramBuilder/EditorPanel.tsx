import { useEffect, useRef } from 'react';
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';
import type { editor as MonacoEditorNs } from 'monaco-editor';
import { ensureMonacoConfigured } from '../../../tools/dbmlDiagramBuilder/monaco/monacoSetup';
import { DBML_LANGUAGE_ID, registerDbmlLanguage } from '../../../tools/dbmlDiagramBuilder/monaco/dbmlLanguage';

ensureMonacoConfigured();

interface EditorPanelProps {
  value: string;
  onChange: (value: string) => void;
  theme: 'dark' | 'light';
  errorLine: number | null;
  onSave: () => void;
  /** Phone layout: wrap long lines, slim the gutter, keep taps zoom-free. */
  compact?: boolean;
}

export function EditorPanel({ value, onChange, theme, errorLine, onSave, compact = false }: EditorPanelProps) {
  const editorRef = useRef<MonacoEditorNs.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<MonacoEditorNs.IEditorDecorationsCollection | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => onSaveRef.current());
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    decorationsRef.current?.clear();
    decorationsRef.current = null;
    if (errorLine && errorLine >= 1) {
      decorationsRef.current = editor.createDecorationsCollection([
        {
          range: new monaco.Range(errorLine, 1, errorLine, 1),
          options: {
            isWholeLine: true,
            className: 'dbml-error-line',
            glyphMarginClassName: 'dbml-error-glyph',
          },
        },
      ]);
      editor.revealLineInCenterIfOutsideViewport(errorLine);
    }
  }, [errorLine]);

  return (
    <div className={`w-full h-full min-w-0 ${compact ? 'dbml-editor-compact' : ''}`}>
      <style>{`
        .dbml-error-line { background: rgba(248, 113, 113, 0.16); }
        .dbml-error-glyph { background: #ef4444; border-radius: 9999px; width: 6px !important; height: 6px !important; margin-left: 6px; margin-top: 7px; }
        /* iOS Safari zooms the whole page when the field it focuses has a font
           smaller than 16px. Monaco types into an offscreen editing surface
           that inherits the editor's font size — a textarea (.inputarea), or a
           contenteditable div when the EditContext API is available — so pin
           those. The visible code is painted by separate elements and keeps
           the editor's own font size. */
        .dbml-editor-compact .monaco-editor .inputarea,
        .dbml-editor-compact .monaco-editor .ime-text-area,
        .dbml-editor-compact .monaco-editor .native-edit-context { font-size: 16px !important; }
      `}</style>
      <Editor
        height="100%"
        defaultLanguage={DBML_LANGUAGE_ID}
        value={value}
        theme={theme === 'dark' ? 'dbml-dark' : 'dbml-light'}
        beforeMount={(monaco: Monaco) => registerDbmlLanguage(monaco)}
        onMount={handleMount}
        onChange={(v) => onChange(v ?? '')}
        loading={<div className="w-full h-full flex items-center justify-center text-sm text-slate-400">Loading editor…</div>}
        options={{
          fontSize: compact ? 14 : 13,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          lineNumbers: 'on',
          minimap: { enabled: false },
          renderLineHighlight: 'all',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          glyphMargin: true,
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          padding: { top: 12, bottom: 12 },
          // A phone has no room to scroll sideways through a long column
          // definition, and horizontal scrolling fights the tab swipe — wrap
          // instead, and reclaim the gutter width that wrapping costs.
          wordWrap: compact ? 'on' : 'off',
          wrappingIndent: 'indent',
          lineNumbersMinChars: compact ? 2 : 5,
          folding: !compact,
          overviewRulerLanes: compact ? 0 : 3,
          overviewRulerBorder: !compact,
          scrollbar: compact
            ? { horizontal: 'hidden', verticalScrollbarSize: 8, useShadows: false }
            : undefined,
          // No completion provider is registered for the DBML language, so
          // Monaco's default word-based suggestion widget has nothing useful
          // to offer — worse, it can swallow a Space keystroke as a suggestion
          // "commit" while typing. Disabling it keeps typing predictable.
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          wordBasedSuggestions: 'off',
        }}
      />
    </div>
  );
}
