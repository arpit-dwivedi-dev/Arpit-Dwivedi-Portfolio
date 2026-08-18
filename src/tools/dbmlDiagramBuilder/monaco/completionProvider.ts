import type { Monaco } from '@monaco-editor/react';
import type { IDisposable, languages } from 'monaco-editor';
import { DBML_LANGUAGE_ID } from './dbmlLanguage';
import { getDbmlCompletions, type DbmlSuggestion } from './completions';
import type { DatabaseSchema } from '../types';

function kindOf(monaco: Monaco, kind: DbmlSuggestion['kind']): languages.CompletionItemKind {
  const K = monaco.languages.CompletionItemKind;
  switch (kind) {
    case 'keyword':
      return K.Keyword;
    case 'table':
      return K.Class;
    case 'column':
      return K.Field;
    case 'type':
      return K.TypeParameter;
    case 'attribute':
      return K.Property;
  }
}

/**
 * Registers the DBML completion provider against the current Monaco
 * instance. `getSchema` is read live on every request rather than captured
 * once, so suggestions always reflect the latest debounced parse without
 * this provider needing to be re-registered on every schema change.
 */
export function registerDbmlCompletionProvider(monaco: Monaco, getSchema: () => DatabaseSchema): IDisposable {
  return monaco.languages.registerCompletionItemProvider(DBML_LANGUAGE_ID, {
    triggerCharacters: ['.', '[', ':', ' '],
    provideCompletionItems(model, position) {
      const text = model.getValue();
      const offset = model.getOffsetAt(position);
      const { context, suggestions } = getDbmlCompletions(text, offset, getSchema());
      if (suggestions.length === 0) return { suggestions: [] };

      const startPos = model.getPositionAt(context.from);
      const range = new monaco.Range(startPos.lineNumber, startPos.column, position.lineNumber, position.column);

      return {
        suggestions: suggestions.map((s) => ({
          label: s.label,
          kind: kindOf(monaco, s.kind),
          insertText: s.insertText,
          detail: s.detail,
          range,
          // No commitCharacters — accepting a suggestion is explicit (Tab/Enter
          // on a selected item) only, so normal typing (including Space) is
          // never swallowed as an implicit "accept".
        })),
      };
    },
  });
}
