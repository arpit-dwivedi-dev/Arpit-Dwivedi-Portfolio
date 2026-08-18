import { useEffect, useRef } from 'react';
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';
import type { editor as MonacoEditorNs, IDisposable } from 'monaco-editor';
import { ensureMonacoConfigured } from '../../../tools/dbmlDiagramBuilder/monaco/monacoSetup';
import { DBML_LANGUAGE_ID, registerDbmlLanguage } from '../../../tools/dbmlDiagramBuilder/monaco/dbmlLanguage';
import { registerDbmlCompletionProvider } from '../../../tools/dbmlDiagramBuilder/monaco/completionProvider';
import { monacoThemeFor } from '../../../tools/dbmlDiagramBuilder/theme/resolveTheme';
import type { DatabaseSchema } from '../../../tools/dbmlDiagramBuilder/types';

ensureMonacoConfigured();

interface EditorPanelProps {
  value: string;
  onChange: (value: string) => void;
  theme: 'dark' | 'light';
  errorLine: number | null;
  onSave: () => void;
  /** Latest parsed schema, used to drive table/column autocomplete. */
  schema: DatabaseSchema;
  /** Phone layout: wrap long lines, slim the gutter, keep taps zoom-free. */
  compact?: boolean;
}

export function EditorPanel({ value, onChange, theme, errorLine, onSave, schema, compact = false }: EditorPanelProps) {
  const editorRef = useRef<MonacoEditorNs.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<MonacoEditorNs.IEditorDecorationsCollection | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const schemaRef = useRef(schema);
  schemaRef.current = schema;
  const completionDisposableRef = useRef<IDisposable | null>(null);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => onSaveRef.current());
    completionDisposableRef.current = registerDbmlCompletionProvider(monaco, () => schemaRef.current);
  };

  useEffect(() => {
    return () => {
      completionDisposableRef.current?.dispose();
      completionDisposableRef.current = null;
    };
  }, []);

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
        theme={monacoThemeFor(theme)}
        beforeMount={(monaco: Monaco) => registerDbmlLanguage(monaco)}
        onMount={handleMount}
        onChange={(v) => onChange(v ?? '')}
        loading={
          <div className="w-full h-full flex items-center justify-center text-sm text-slate-400 dbml-light:text-slate-500 bg-slate-950 dbml-light:bg-white">
            Loading editor…
          </div>
        }
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
          // A dedicated DBML completion provider is registered in handleMount
          // (see registerDbmlCompletionProvider) — the built-in word-based
          // suggestion widget stays off since it has nothing schema-aware to
          // offer and used to swallow a Space keystroke as a suggestion
          // "commit" while typing. acceptSuggestionOnCommitCharacter is what
          // actually caused that: with it on, a non-alphanumeric keystroke
          // like Space could silently accept the highlighted suggestion
          // instead of just being typed. Turning it off keeps Space/Enter/Tab
          // behaving normally; only an explicit Tab/Enter on a selected item
          // accepts a suggestion.
          quickSuggestions: { other: true, comment: false, strings: false },
          suggestOnTriggerCharacters: true,
          wordBasedSuggestions: 'off',
          acceptSuggestionOnCommitCharacter: false,
          acceptSuggestionOnEnter: 'smart',
        }}
      />
    </div>
  );
}
