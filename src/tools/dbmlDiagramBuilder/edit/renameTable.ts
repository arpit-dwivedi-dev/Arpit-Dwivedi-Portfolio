import { tokenize, type Token } from '../parser/tokenizer';

/** Identifiers DBML accepts unquoted; anything else has to be `"quoted"`. */
const BARE_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

export interface SourceRange {
  start: number;
  end: number;
}

export function formatTableName(name: string): string {
  return BARE_IDENT.test(name) ? name : `"${name.replace(/"/g, '\\"')}"`;
}

/**
 * Every place `tableName` is used *as a table* in the source:
 *
 *  - `Table <name> { … }` and `Records <name>(…) { … }` declarations
 *  - qualified endpoints — `<name>.column` — which covers standalone `Ref`
 *    statements, `Ref { … }` blocks and inline `[ref: > <name>.col]` alike
 *  - bare entries inside a `TableGroup { … }` block
 *
 * Column names, types and note text are all excluded by construction: a column
 * is never followed by `.`, and note bodies are string tokens that stand alone.
 */
export function findTableNameRanges(source: string, tableName: string): SourceRange[] {
  const tokens = tokenize(source);
  const target = tableName.toLowerCase();
  const ranges: SourceRange[] = [];

  const isName = (t: Token | undefined): boolean =>
    !!t && (t.type === 'ident' || t.type === 'string') && t.value.toLowerCase() === target;

  let depth = 0;
  // Brace depth at which the current TableGroup's entries live, or null when
  // we aren't inside one.
  let groupDepth: number | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'symbol') {
      if (token.value === '{') {
        depth++;
      } else if (token.value === '}') {
        depth--;
        if (groupDepth !== null && depth < groupDepth) groupDepth = null;
      }
      continue;
    }

    if (token.type === 'ident') {
      const lower = token.value.toLowerCase();
      if (lower === 'tablegroup' || lower === 'table_group') {
        // The block's `{` hasn't been consumed yet, so its contents sit one
        // level deeper than the depth we're at right now.
        groupDepth = depth + 1;
        continue;
      }
      if ((lower === 'table' || lower === 'records') && isName(tokens[i + 1])) {
        ranges.push({ start: tokens[i + 1].start, end: tokens[i + 1].end });
        i++;
        continue;
      }
    }

    if (isName(token)) {
      const next = tokens[i + 1];
      const isQualifiedEndpoint = next?.type === 'symbol' && next.value === '.';
      const isTableGroupEntry = groupDepth !== null && depth >= groupDepth;
      if (isQualifiedEndpoint || isTableGroupEntry) {
        ranges.push({ start: token.start, end: token.end });
      }
    }
  }

  return ranges;
}

/**
 * Renames a table everywhere it appears, editing the original text in place so
 * comments, blank lines and the user's own formatting are preserved — a
 * regenerate-from-AST round trip would throw all of that away.
 */
export function renameTableInDbml(source: string, oldName: string, newName: string): string {
  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) return source;

  const ranges = findTableNameRanges(source, oldName);
  if (ranges.length === 0) return source;

  const replacement = formatTableName(trimmed);
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
  existingNames: string[],
  currentName: string,
): TableNameValidation {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: 'Table name cannot be empty.' };
  if (trimmed === currentName) return { ok: true };
  const clash = existingNames.some(
    (n) => n.toLowerCase() === trimmed.toLowerCase() && n.toLowerCase() !== currentName.toLowerCase(),
  );
  if (clash) return { ok: false, error: `A table named "${trimmed}" already exists.` };
  return { ok: true };
}
