import { tokenize, type Token } from '../parser/tokenizer';
import { TableIndex } from '../schema/tableIdentity';
import type { DatabaseSchema, TableSchema } from '../types';

export type DbmlSuggestionKind = 'keyword' | 'table' | 'column' | 'type' | 'attribute';

export interface DbmlSuggestion {
  label: string;
  insertText: string;
  kind: DbmlSuggestionKind;
  detail?: string;
}

export type CompletionContextKind =
  | 'top-level'
  | 'table-ref'
  | 'column-ref'
  | 'column-type'
  | 'column-attribute'
  | 'table-attribute'
  | 'index-attribute'
  | 'none';

export interface DbmlCompletionContext {
  kind: CompletionContextKind;
  /** Offset where the partial text being typed starts — the range a suggestion should replace. */
  from: number;
  /** Text already typed at this position, used to filter candidates. */
  partial: string;
  /** Resolved table for a `column-ref` context. */
  table?: TableSchema;
}

export interface DbmlCompletionResult {
  context: DbmlCompletionContext;
  suggestions: DbmlSuggestion[];
}

// Only the constructs that can actually start a top-level DBML statement in
// this app's parser — "indexes"/"as" are body-level keywords, not suggested here.
export const TOP_LEVEL_KEYWORDS = ['Table', 'Ref', 'Enum', 'TableGroup', 'Project', 'Note', 'Records'];

// A curated, common subset — the parser accepts any identifier as a type, so
// this is a helpful shortlist rather than an exhaustive/validated set.
export const COLUMN_TYPES = [
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

// Mirrors exactly what parseColumnAttrs() in dbmlParser.ts recognizes inside a column's `[ ... ]`.
const COLUMN_ATTRIBUTES: Array<{ label: string; insertText: string; detail: string }> = [
  { label: 'pk', insertText: 'pk', detail: 'Primary key' },
  { label: 'primary key', insertText: 'primary key', detail: 'Primary key' },
  { label: 'not null', insertText: 'not null', detail: 'Column cannot be null' },
  { label: 'null', insertText: 'null', detail: 'Column is nullable' },
  { label: 'unique', insertText: 'unique', detail: 'Unique constraint' },
  { label: 'increment', insertText: 'increment', detail: 'Auto-increment' },
  { label: 'default', insertText: 'default: ', detail: 'Default value' },
  { label: 'note', insertText: "note: ''", detail: 'Column note' },
  { label: 'ref', insertText: 'ref: ', detail: 'Inline relationship' },
];

// Mirrors parseTableSettings() in dbmlParser.ts — the table's own `[ ... ]`, before its `{`.
const TABLE_ATTRIBUTES: Array<{ label: string; insertText: string; detail: string }> = [
  { label: 'note', insertText: "note: ''", detail: 'Table note' },
  { label: 'headercolor', insertText: 'headercolor: ', detail: 'Table header color' },
];

// Mirrors the `[ ... ]` handling in parseIndexEntry() in dbmlParser.ts.
const INDEX_ATTRIBUTES: Array<{ label: string; insertText: string; detail: string }> = [
  { label: 'pk', insertText: 'pk', detail: 'Composite primary key' },
  { label: 'unique', insertText: 'unique', detail: 'Unique index' },
  { label: 'name', insertText: "name: ''", detail: 'Index name' },
];

const BLOCK_KEYWORDS = new Set(['table', 'enum', 'tablegroup', 'table_group', 'ref', 'indexes', 'project', 'note', 'records']);

const IDENT_CHAR = /[A-Za-z0-9_$#]/;

/** Scans a single identifier word backward from `offset` — no dots. */
function scanWord(text: string, offset: number): { value: string; start: number } {
  let start = offset;
  while (start > 0 && IDENT_CHAR.test(text[start - 1])) start--;
  return { value: text.slice(start, offset), start };
}

/**
 * Scans a `.`-separated identifier chain backward from `offset`, e.g.
 * `public.users.` → parts `['public', 'users', '']`. A trailing empty part
 * means the cursor sits right after a dot with nothing typed yet.
 */
function scanQualifiedChain(text: string, offset: number): { parts: { value: string; start: number }[]; chainStart: number } {
  const parts: { value: string; start: number }[] = [];
  let pos = offset;
  // Bounded to 4 parts — schema.table.column is the deepest valid chain; a
  // fourth part only ever shows up in malformed input, which we bail out on.
  while (parts.length < 4) {
    const { value, start } = scanWord(text, pos);
    parts.unshift({ value, start });
    pos = start;
    if (pos > 0 && text[pos - 1] === '.') {
      pos -= 1;
      continue;
    }
    break;
  }
  return { parts, chainStart: parts[0].start };
}

interface Frame {
  kind: string;
  enclosing?: string;
}

interface FrameState {
  stack: Frame[];
  candidate: string | null;
  candidateLine: number;
}

/**
 * Lightweight structural scan over tokens up to the cursor — tracks nested
 * `{`/`[` blocks and which keyword (if any) is still "pending" a brace, so
 * context detection works even on incomplete/malformed DBML (an unclosed
 * brace just means we're still lexically inside that block).
 */
function computeFrameState(tokens: Token[], offset: number): FrameState {
  const stack: Frame[] = [];
  let candidate: string | null = null;
  let candidateLine = -1;

  for (const tok of tokens) {
    if (tok.start >= offset) break;
    if (tok.type === 'ident') {
      const lower = tok.value.toLowerCase();
      if (BLOCK_KEYWORDS.has(lower)) {
        candidate = lower === 'table_group' ? 'tablegroup' : lower;
        candidateLine = tok.line;
      }
    } else if (tok.type === 'symbol' && tok.value === '{') {
      stack.push({ kind: candidate ?? 'unknown' });
      candidate = null;
    } else if (tok.type === 'symbol' && tok.value === '[') {
      const top = stack[stack.length - 1];
      const enclosing = candidate === 'table' ? 'table-header' : candidate === 'tablegroup' ? 'tablegroup-header' : top?.kind;
      stack.push({ kind: 'attrs', enclosing });
      // Not cleared: a header `[...]` (e.g. `Table foo [note:'x'] {`) doesn't
      // consume the pending keyword — the `{` that follows still needs it.
    } else if (tok.type === 'symbol' && (tok.value === '}' || tok.value === ']')) {
      stack.pop();
    }
  }

  return { stack, candidate, candidateLine };
}

function lineOf(text: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') line++;
  }
  return line;
}

function noneContext(offset: number): DbmlCompletionContext {
  return { kind: 'none', from: offset, partial: '' };
}

function topLevelContext(text: string, offset: number): DbmlCompletionContext {
  const { value, start } = scanWord(text, offset);
  return { kind: 'top-level', from: start, partial: value };
}

/** Inside a Table body, not inside brackets — only column lines that already have a name are a type position. */
function tableBodyContext(text: string, offset: number): DbmlCompletionContext {
  const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
  const lineBefore = text.slice(lineStart, offset);
  const match = /^\s*([A-Za-z_$#][A-Za-z0-9_$#]*|"[^"]*")\s+([A-Za-z0-9_$#]*)$/.exec(lineBefore);
  if (!match) return noneContext(offset);
  const partial = match[2];
  return { kind: 'column-type', from: offset - partial.length, partial };
}

function columnAttributeContext(text: string, offset: number): DbmlCompletionContext {
  const { value, start } = scanWord(text, offset);
  return { kind: 'column-attribute', from: start, partial: value };
}

function tableAttributeContext(text: string, offset: number): DbmlCompletionContext {
  const { value, start } = scanWord(text, offset);
  return { kind: 'table-attribute', from: start, partial: value };
}

function indexAttributeContext(text: string, offset: number): DbmlCompletionContext {
  const { value, start } = scanWord(text, offset);
  return { kind: 'index-attribute', from: start, partial: value };
}

/** Ref endpoint position: `table.column`, `schema.table.column`, or a bare/partial table name. */
function refEndpointContext(text: string, offset: number, schema: DatabaseSchema): DbmlCompletionContext {
  const { parts, chainStart } = scanQualifiedChain(text, offset);
  const index = new TableIndex(schema.tables);

  if (parts.length === 2) {
    const resolution = index.resolve({ name: parts[0].value });
    if (resolution.kind === 'found') {
      return { kind: 'column-ref', from: parts[1].start, partial: parts[1].value, table: resolution.table };
    }
  } else if (parts.length === 3) {
    const resolution = index.resolve({ schema: parts[0].value, name: parts[1].value });
    if (resolution.kind === 'found') {
      return { kind: 'column-ref', from: parts[2].start, partial: parts[2].value, table: resolution.table };
    }
    return noneContext(offset);
  } else if (parts.length > 3) {
    return noneContext(offset);
  }

  return { kind: 'table-ref', from: chainStart, partial: text.slice(chainStart, offset) };
}

/** TableGroup member position — table names only, up to `schema.table`, never a column. */
function tableGroupMemberContext(text: string, offset: number): DbmlCompletionContext {
  const { parts, chainStart } = scanQualifiedChain(text, offset);
  if (parts.length > 2) return noneContext(offset);
  return { kind: 'table-ref', from: chainStart, partial: text.slice(chainStart, offset) };
}

export function detectCompletionContext(text: string, offset: number, schema: DatabaseSchema): DbmlCompletionContext {
  const tokens = tokenize(text);
  const { stack, candidate, candidateLine } = computeFrameState(tokens, offset);
  const top = stack[stack.length - 1];

  if (top?.kind === 'attrs') {
    if (top.enclosing === 'table') return columnAttributeContext(text, offset);
    if (top.enclosing === 'table-header') return tableAttributeContext(text, offset);
    if (top.enclosing === 'indexes') return indexAttributeContext(text, offset);
    return noneContext(offset);
  }

  if (top?.kind === 'table') return tableBodyContext(text, offset);
  if (top?.kind === 'tablegroup') return tableGroupMemberContext(text, offset);
  if (top?.kind === 'ref') return refEndpointContext(text, offset, schema);
  if (top) return noneContext(offset); // enum / indexes / note / project / records bodies — nothing to suggest

  // A pending keyword only holds its grip on the current line — once the
  // cursor moves to a new line without ever opening a brace (e.g. a finished
  // braceless "Ref: a.b > c.d" statement), the next line is a fresh
  // top-level position again.
  if (candidate && candidateLine === lineOf(text, offset)) {
    if (candidate === 'ref') return refEndpointContext(text, offset, schema);
    return noneContext(offset); // e.g. "Table " — a user-defined name comes next, not a keyword
  }

  return topLevelContext(text, offset);
}

export function getTableSuggestions(schema: DatabaseSchema): DbmlSuggestion[] {
  const seen = new Set<string>();
  const out: DbmlSuggestion[] = [];
  for (const table of schema.tables) {
    const key = table.qualifiedName.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      label: table.qualifiedName,
      insertText: table.qualifiedName,
      kind: 'table',
      detail: table.schema ? `Table in ${table.schema}` : 'Table',
    });
  }
  return out;
}

export function getColumnSuggestions(table: TableSchema): DbmlSuggestion[] {
  const seen = new Set<string>();
  const out: DbmlSuggestion[] = [];
  for (const column of table.columns) {
    const key = column.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label: column.name, insertText: column.name, kind: 'column', detail: column.type });
  }
  return out;
}

function filterAndDedupe(items: DbmlSuggestion[], partial: string): DbmlSuggestion[] {
  const p = partial.toLowerCase();
  const seen = new Set<string>();
  const out: DbmlSuggestion[] = [];
  for (const item of items) {
    if (p && !item.label.toLowerCase().startsWith(p)) continue;
    const key = `${item.kind}:${item.label.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function getDbmlCompletions(text: string, offset: number, schema: DatabaseSchema): DbmlCompletionResult {
  const context = detectCompletionContext(text, offset, schema);
  let candidates: DbmlSuggestion[];

  switch (context.kind) {
    case 'top-level':
      candidates = TOP_LEVEL_KEYWORDS.map((k) => ({ label: k, insertText: k, kind: 'keyword' }));
      break;
    case 'table-ref':
      candidates = getTableSuggestions(schema);
      break;
    case 'column-ref':
      candidates = context.table ? getColumnSuggestions(context.table) : [];
      break;
    case 'column-type':
      candidates = COLUMN_TYPES.map((t) => ({ label: t, insertText: t, kind: 'type' }));
      break;
    case 'column-attribute':
      candidates = COLUMN_ATTRIBUTES.map((a) => ({ ...a, kind: 'attribute' }));
      break;
    case 'table-attribute':
      candidates = TABLE_ATTRIBUTES.map((a) => ({ ...a, kind: 'attribute' }));
      break;
    case 'index-attribute':
      candidates = INDEX_ATTRIBUTES.map((a) => ({ ...a, kind: 'attribute' }));
      break;
    default:
      candidates = [];
  }

  return { context, suggestions: filterAndDedupe(candidates, context.partial) };
}
