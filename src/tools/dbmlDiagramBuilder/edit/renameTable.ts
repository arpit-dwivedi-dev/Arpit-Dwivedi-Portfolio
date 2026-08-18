import { tokenize, type Token } from '../parser/tokenizer';
import { tableKey, tableRefsEqual, type TableRef } from '../schema/tableIdentity';

/** Identifiers DBML accepts unquoted; anything else has to be `"quoted"`. */
const BARE_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

export interface SourceRange {
  start: number;
  end: number;
}

function formatIdentifier(raw: string): string {
  return BARE_IDENT.test(raw) ? raw : `"${raw.replace(/"/g, '\\"')}"`;
}

/** `schema.table`, each part individually quoted if it isn't a bare identifier. */
export function formatQualifiedName(ref: TableRef): string {
  const name = formatIdentifier(ref.name);
  return ref.schema ? `${formatIdentifier(ref.schema)}.${name}` : name;
}

const isNameToken = (t: Token | undefined): boolean => !!t && (t.type === 'ident' || t.type === 'string');

/**
 * Reads a name-bearing span starting at `tokens[i]`: a bare name, or a
 * dotted chain of up to `maxParts` names. `maxParts` distinguishes the two
 * grammar positions a table identity can appear in:
 *
 *  - 2: a declaration position (`Table`/`Records` name, `TableGroup` member)
 *    — a dotted chain here is always `schema.table`, nothing else.
 *  - 3: an endpoint position (`Ref` `table.column` / `schema.table.column`)
 *    — a 2-part chain is `table.column` (table unqualified), a 3-part chain
 *    is `schema.table.column`. Only the schema+table portion is returned;
 *    a trailing column part is consumed but not included in the span.
 */
function readQualifiedSpan(
  tokens: Token[],
  i: number,
  maxParts: 2 | 3,
): { ref: TableRef; start: number; end: number; nextIndex: number } | null {
  if (!isNameToken(tokens[i])) return null;
  const first = tokens[i];

  const hasDotAt = (idx: number) => tokens[idx]?.type === 'symbol' && tokens[idx].value === '.';

  if (!hasDotAt(i + 1) || !isNameToken(tokens[i + 2])) {
    return { ref: { name: first.value }, start: first.start, end: first.end, nextIndex: i + 1 };
  }
  const second = tokens[i + 2];

  if (maxParts === 2) {
    // schema.table — nothing more to read.
    return { ref: { schema: first.value, name: second.value }, start: first.start, end: second.end, nextIndex: i + 3 };
  }

  // Endpoint position: is there a third dotted part (schema.table.column)?
  if (hasDotAt(i + 3) && isNameToken(tokens[i + 4])) {
    // Three parts: first.second.third — the table span is first.second only.
    return { ref: { schema: first.value, name: second.value }, start: first.start, end: second.end, nextIndex: i + 5 };
  }
  // Two parts: first.second — first is the (unqualified) table, second is the column.
  return { ref: { name: first.value }, start: first.start, end: first.end, nextIndex: i + 3 };
}

/**
 * Every place `target` is used *as a table* in the source:
 *
 *  - `Table <ref> { … }` and `Records <ref>(…) { … }` declarations
 *  - qualified endpoints — `<ref>.column` — which covers standalone `Ref`
 *    statements, `Ref { … }` blocks and inline `[ref: > <ref>.col]` alike
 *  - entries inside a `TableGroup { … }` block
 *
 * Only occurrences whose schema qualification exactly matches `target` are
 * returned — renaming `public.users` never touches a same-named `auth.users`,
 * nor a bare unqualified `users` reference, and vice versa. Column names,
 * types and note text are all excluded by construction: a column is never
 * itself the start of a table-position span, and note bodies are string
 * tokens that stand alone.
 */
export function findTableNameRanges(source: string, target: TableRef): SourceRange[] {
  const tokens = tokenize(source);
  const ranges: SourceRange[] = [];

  let depth = 0;
  // Brace depth at which the current TableGroup's entries live, or null when
  // we aren't inside one.
  let groupDepth: number | null = null;

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token.type === 'eof') break;

    if (token.type === 'symbol') {
      if (token.value === '{') {
        depth++;
      } else if (token.value === '}') {
        depth--;
        if (groupDepth !== null && depth < groupDepth) groupDepth = null;
      }
      i++;
      continue;
    }

    if (token.type === 'ident') {
      const lower = token.value.toLowerCase();
      if (lower === 'tablegroup' || lower === 'table_group') {
        // The block's `{` hasn't been consumed yet, so its contents sit one
        // level deeper than the depth we're at right now.
        groupDepth = depth + 1;
        i++;
        continue;
      }
      if (lower === 'table' || lower === 'records') {
        const span = readQualifiedSpan(tokens, i + 1, 2);
        if (span) {
          if (tableRefsEqual(span.ref, target)) ranges.push({ start: span.start, end: span.end });
          i = span.nextIndex;
          continue;
        }
      }
    }

    if (isNameToken(token)) {
      const isGroupMember = groupDepth !== null && depth >= groupDepth;
      const followedByDot = tokens[i + 1]?.type === 'symbol' && tokens[i + 1].value === '.';
      // Column/type names and other bare identifiers are never a table-name
      // occurrence — only a dotted endpoint or a TableGroup member is.
      if (isGroupMember || followedByDot) {
        const span = readQualifiedSpan(tokens, i, isGroupMember ? 2 : 3);
        if (span) {
          if (tableRefsEqual(span.ref, target)) ranges.push({ start: span.start, end: span.end });
          i = span.nextIndex;
          continue;
        }
      }
    }

    i++;
  }

  return ranges;
}

/**
 * Renames a table everywhere it appears, editing the original text in place so
 * comments, blank lines and the user's own formatting are preserved — a
 * regenerate-from-AST round trip would throw all of that away.
 */
export function renameTableInDbml(source: string, target: TableRef, next: TableRef): string {
  const trimmedName = next.name.trim();
  if (!trimmedName) return source;
  const nextRef: TableRef = { schema: next.schema, name: trimmedName };
  if (tableRefsEqual(target, nextRef)) return source;

  const ranges = findTableNameRanges(source, target);
  if (ranges.length === 0) return source;

  const replacement = formatQualifiedName(nextRef);
  // Splice back-to-front so earlier ranges keep their offsets.
  return ranges.reduceRight(
    (text, range) => text.slice(0, range.start) + replacement + text.slice(range.end),
    source,
  );
}

export interface TableNameValidation {
  ok: boolean;
  error?: string;
}

export function validateTableName(
  name: string,
  existingRefs: TableRef[],
  current: TableRef,
): TableNameValidation {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: 'Table name cannot be empty.' };
  const nextRef: TableRef = { schema: current.schema, name: trimmed };
  if (tableRefsEqual(nextRef, current)) return { ok: true };
  const clash = existingRefs.some((ref) => tableKey(ref) === tableKey(nextRef) && !tableRefsEqual(ref, current));
  if (clash) return { ok: false, error: `A table named "${trimmed}" already exists.` };
  return { ok: true };
}
