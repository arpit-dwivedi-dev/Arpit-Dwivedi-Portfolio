import type { Monaco } from '@monaco-editor/react';

export const DBML_LANGUAGE_ID = 'dbml';

const KEYWORDS = ['Table', 'Ref', 'Enum', 'TableGroup', 'Project', 'Note', 'Records', 'indexes', 'as'];
const ATTR_KEYWORDS = [
  'primary',
  'key',
  'pk',
  'not',
  'null',
  'unique',
  'increment',
  'default',
  'note',
  'ref',
];
const TYPE_KEYWORDS = [
  'integer',
  'int',
  'bigint',
  'smallint',
  'varchar',
  'char',
  'text',
  'boolean',
  'bool',
  'timestamp',
  'timestamptz',
  'date',
  'time',
  'datetime',
  'decimal',
  'numeric',
  'float',
  'double',
  'real',
  'json',
  'jsonb',
  'uuid',
  'blob',
  'binary',
  'serial',
  'money',
];

let registered = false;

export function registerDbmlLanguage(monaco: Monaco) {
  if (registered) return;
  registered = true;

  monaco.languages.register({ id: DBML_LANGUAGE_ID });

  monaco.languages.setMonarchTokensProvider(DBML_LANGUAGE_ID, {
    keywords: KEYWORDS,
    attrKeywords: ATTR_KEYWORDS,
    typeKeywords: TYPE_KEYWORDS,
    operators: ['>', '<', '-', '<>', ':', ','],
    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        [/'''/, 'string', '@tripleString'],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/`[^`]*`/, 'string'],
        [/\b\d+(\.\d+)?\b/, 'number'],
        [
          /[A-Za-z_][A-Za-z0-9_]*/,
          {
            cases: {
              '@keywords': 'keyword',
              '@typeKeywords': 'type',
              '@attrKeywords': 'attribute',
              '@default': 'identifier',
            },
          },
        ],
        [/[{}[\]()]/, '@brackets'],
        [/[<>\-:,.]/, 'operator'],
      ],
      comment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],
      tripleString: [
        [/[^']+/, 'string'],
        [/'''/, 'string', '@pop'],
        [/'/, 'string'],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration(DBML_LANGUAGE_ID, {
    comments: { lineComment: '//', blockComment: ['/*', '*/'] },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: "'", close: "'" },
      { open: '"', close: '"' },
    ],
  });

  monaco.editor.defineTheme('dbml-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '4FC1FF', fontStyle: 'bold' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'attribute', foreground: 'C586C0' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'identifier', foreground: 'D4D4D4' },
    ],
    colors: {
      'editor.background': '#111827',
      'editor.lineHighlightBackground': '#1f2937',
      'editorGutter.background': '#111827',
    },
  });

  monaco.editor.defineTheme('dbml-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '0550AE', fontStyle: 'bold' },
      { token: 'type', foreground: '116329' },
      { token: 'attribute', foreground: '953800' },
      { token: 'string', foreground: 'A31515' },
      { token: 'number', foreground: '098658' },
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'identifier', foreground: '1F2328' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
    },
  });
}
