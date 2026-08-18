import { tokenize, type Token } from './tokenizer';
import { slugify, uniqueId } from './parserUtils';
import { qualifiedDisplayName, tableKey, TableIndex, type TableRef } from '../schema/tableIdentity';
import type {
  ColumnSchema,
  DatabaseSchema,
  EnumSchema,
  EnumValueSchema,
  IndexSchema,
  ParserWarning,
  RecordValue,
  RelationKind,
  TableGroupSchema,
  TableRecords,
  TableSchema,
} from '../types';

const MAX_WARNINGS = 60;

interface RefEndpoint extends TableRef {
  column: string;
}

interface PendingRef {
  name?: string;
  a: RefEndpoint;
  operator: string;
  b: RefEndpoint;
  line: number;
}

/** Small cursor over the token stream shared by every parse* helper below. */
class Cursor {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  peek(offset = 0): Token {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)];
  }

  next(): Token {
    const t = this.tokens[this.pos];
    if (this.pos < this.tokens.length - 1) this.pos++;
    return t;
  }

  atEnd(): boolean {
    return this.peek().type === 'eof';
  }

  isSymbol(value: string, offset = 0): boolean {
    const t = this.peek(offset);
    return t.type === 'symbol' && t.value === value;
  }

  isIdent(value?: string, offset = 0): boolean {
    const t = this.peek(offset);
    if (t.type !== 'ident') return false;
    return value === undefined || t.value.toLowerCase() === value.toLowerCase();
  }
}

export function parseDbml(source: string): DatabaseSchema {
  const tokens = tokenize(source);
  const cursor = new Cursor(tokens);
  const tables: TableSchema[] = [];
  const warnings: ParserWarning[] = [];
  const pendingRefs: PendingRef[] = [];
  const records: TableRecords[] = [];
  const enums: EnumSchema[] = [];
  const tableGroups: TableGroupSchema[] = [];
  const usedTableIds = new Set<string>();
  const usedEnumIds = new Set<string>();
  const usedGroupIds = new Set<string>();
  const tableKeySeen = new Set<string>();
  const enumNameSeen = new Set<string>();

  let truncationNoted = false;
  const warn = (message: string, line: number, severity: ParserWarning['severity'] = 'warning') => {
    if (warnings.length >= MAX_WARNINGS) {
      // Silently dropping past the cap would let the status bar report e.g.
      // "60 warnings" on a file that actually has hundreds — misleading the
      // user into thinking they've seen everything once they've worked
      // through the visible list. Note it once instead of just cutting off.
      if (!truncationNoted) {
        truncationNoted = true;
        warnings.push({
          message: `${MAX_WARNINGS}+ issues found — only the first ${MAX_WARNINGS} are shown. Fix these, then re-check for more.`,
          line: 1,
          severity: 'warning',
        });
      }
      return;
    }
    // Guards against NaN/0/negative line numbers reaching the UI — every
    // caller passes a token line, but this is the single choke point that
    // keeps a bad one from ever slipping through as "no location".
    const safeLine = Number.isFinite(line) && line >= 1 ? Math.floor(line) : 1;
    warnings.push({ message, line: safeLine, severity });
  };

  /** Structural failures the user must fix before the diagram can be trusted — as opposed to warn()'s recoverable notices. */
  const fail = (message: string, line: number) => warn(message, line, 'error');

  const readNameToken = (): { value: string; line: number } | null => {
    const t = cursor.peek();
    if (t.type === 'ident' || t.type === 'string') {
      cursor.next();
      return { value: t.value, line: t.line };
    }
    return null;
  };

  /**
   * A declaration-position qualified name: `table` or `schema.table` — used
   * for `Table`/`Records` declarations and `TableGroup` members, none of
   * which are ever followed by a `.column` part. Recovers from a dangling
   * dot (`schema.`) or an over-long chain (`a.b.c`) by keeping the first two
   * parts and reporting the rest as malformed, rather than dropping the
   * whole statement.
   */
  const readQualifiedNameToken = (contextLabel: string): { ref: TableRef; line: number } | null => {
    const part1 = readNameToken();
    if (!part1) return null;
    if (!cursor.isSymbol('.')) return { ref: { name: part1.value }, line: part1.line };
    cursor.next();
    const part2 = readNameToken();
    if (!part2) {
      fail(
        `Malformed qualified ${contextLabel} name at line ${part1.line}: expected a table name after "${part1.value}.".`,
        part1.line,
      );
      return { ref: { name: part1.value }, line: part1.line };
    }
    if (cursor.isSymbol('.')) {
      fail(
        `Malformed qualified ${contextLabel} name "${part1.value}.${part2.value}." at line ${part1.line}: too many parts — expected "schema.table".`,
        part1.line,
      );
      while (cursor.isSymbol('.')) {
        cursor.next();
        readNameToken();
      }
    }
    return { ref: { schema: part1.value, name: part2.value }, line: part1.line };
  };

  /** Assumes the opening `{` has already been consumed; eats tokens until the matching `}`. */
  const skipBlock = () => {
    let depth = 1;
    while (depth > 0 && !cursor.atEnd()) {
      const t = cursor.next();
      if (t.type === 'symbol' && t.value === '{') depth++;
      else if (t.type === 'symbol' && t.value === '}') depth--;
    }
  };

  const parseBracketedValue = (): string => {
    const t = cursor.peek();
    if (t.type === 'string' || t.type === 'number') {
      cursor.next();
      return t.value;
    }
    if (t.type === 'ident') {
      let value = t.value;
      cursor.next();
      if (cursor.isSymbol('(')) {
        value += '(';
        cursor.next();
        let depth = 1;
        while (depth > 0 && !cursor.atEnd()) {
          const inner = cursor.next();
          if (inner.type === 'symbol' && inner.value === '(') depth++;
          else if (inner.type === 'symbol' && inner.value === ')') { depth--; if (depth === 0) { value += ')'; break; } }
          value += inner.value;
        }
      }
      return value;
    }
    cursor.next();
    return t.value;
  };

  const readColumnList = (): string => {
    cursor.next(); // '('
    const cols: string[] = [];
    while (!cursor.isSymbol(')') && !cursor.atEnd()) {
      const c = readNameToken();
      if (c) cols.push(c.value);
      if (cursor.isSymbol(',')) cursor.next();
    }
    if (cursor.isSymbol(')')) cursor.next();
    return cols.join('+');
  };

  /**
   * `table.column`, `table.(col1, col2)`, `schema.table.column` or
   * `schema.table.(col1, col2)`. Returns `'malformed'` once a diagnostic has
   * already been recorded for a partially-typed endpoint, so the caller
   * doesn't also emit its own generic "malformed reference" on top of it.
   */
  const parseEndpoint = (line: number): RefEndpoint | null | 'malformed' => {
    const part1 = readNameToken();
    if (!part1) return null;
    if (!cursor.isSymbol('.')) return null;
    cursor.next();
    if (cursor.isSymbol('(')) {
      return { name: part1.value, column: readColumnList() };
    }
    const part2 = readNameToken();
    if (!part2) {
      fail(`Malformed reference at line ${line}: expected a column name after "${part1.value}.".`, line);
      return 'malformed';
    }
    if (!cursor.isSymbol('.')) {
      return { name: part1.value, column: part2.value };
    }
    cursor.next();
    if (cursor.isSymbol('(')) {
      return { schema: part1.value, name: part2.value, column: readColumnList() };
    }
    const part3 = readNameToken();
    if (!part3) {
      fail(`Malformed reference at line ${line}: expected a column name after "${part1.value}.${part2.value}.".`, line);
      return 'malformed';
    }
    if (cursor.isSymbol('.')) {
      fail(
        `Malformed reference at line ${line}: "${part1.value}.${part2.value}.${part3.value}." has too many parts — expected "schema.table.column".`,
        line,
      );
      while (cursor.isSymbol('.')) {
        cursor.next();
        readNameToken();
      }
      return 'malformed';
    }
    return { schema: part1.value, name: part2.value, column: part3.value };
  };

  const relationOperators = ['>', '<', '-', '<>'];

  const parseRefBody = (name: string | undefined, line: number) => {
    const a = parseEndpoint(line);
    if (a === 'malformed') return;
    if (!a) {
      fail(`Malformed reference near line ${line}: expected "table.column".`, line);
      return;
    }
    const opTok = cursor.peek();
    if (!(opTok.type === 'symbol' && relationOperators.includes(opTok.value))) {
      fail(
        `Malformed reference near line ${line}: expected one of > < - <> after "${qualifiedDisplayName(a)}.${a.column}".`,
        line,
      );
      return;
    }
    cursor.next();
    const b = parseEndpoint(line);
    if (b === 'malformed') return;
    if (!b) {
      fail(`Malformed reference near line ${line}: expected "table.column" after "${opTok.value}".`, line);
      return;
    }
    // Optional trailing settings, e.g. [delete: cascade, update: restrict]
    if (cursor.isSymbol('[')) {
      cursor.next();
      let depth = 1;
      while (depth > 0 && !cursor.atEnd()) {
        const t = cursor.next();
        if (t.type === 'symbol' && t.value === '[') depth++;
        else if (t.type === 'symbol' && t.value === ']') depth--;
      }
    }
    pendingRefs.push({ name, a, operator: opTok.value, b, line });
  };

  const parseRefStatement = () => {
    const startLine = cursor.peek().line;
    cursor.next(); // 'Ref'
    let name: string | undefined;
    if (cursor.isIdent() && cursor.peek(1).type === 'symbol' && (cursor.peek(1).value === ':' || cursor.peek(1).value === '{')) {
      name = cursor.next().value;
    }
    if (cursor.isSymbol(':')) {
      cursor.next();
      parseRefBody(name, startLine);
    } else if (cursor.isSymbol('{')) {
      cursor.next();
      while (!cursor.isSymbol('}') && !cursor.atEnd()) {
        parseRefBody(name, cursor.peek().line);
      }
      if (cursor.isSymbol('}')) {
        cursor.next();
      } else {
        fail(`"Ref" block starting at line ${startLine} is missing a closing "}".`, cursor.peek().line);
      }
    } else {
      fail(`Malformed "Ref" statement at line ${startLine}.`, startLine);
    }
  };

  interface InlineRef { operator: string; b: RefEndpoint; line: number }

  const parseColumnAttrs = (): { attrs: Partial<ColumnSchema>; inlineRefs: InlineRef[] } => {
    const attrs: Partial<ColumnSchema> = {};
    const inlineRefs: InlineRef[] = [];
    while (!cursor.isSymbol(']') && !cursor.atEnd()) {
      const t = cursor.peek();
      if (t.type !== 'ident') {
        cursor.next();
        if (cursor.isSymbol(',')) cursor.next();
        continue;
      }
      const lower = t.value.toLowerCase();
      cursor.next();
      if (lower === 'primary' && cursor.isIdent('key')) {
        cursor.next();
        attrs.primaryKey = true;
      } else if (lower === 'pk') {
        attrs.primaryKey = true;
      } else if (lower === 'not' && cursor.isIdent('null')) {
        cursor.next();
        attrs.notNull = true;
      } else if (lower === 'null') {
        attrs.notNull = false;
      } else if (lower === 'unique') {
        attrs.unique = true;
      } else if (lower === 'increment') {
        attrs.increment = true;
      } else if (lower === 'default') {
        if (cursor.isSymbol(':')) {
          cursor.next();
          attrs.defaultValue = parseBracketedValue();
        }
      } else if (lower === 'note') {
        if (cursor.isSymbol(':')) {
          cursor.next();
          const v = cursor.peek();
          if (v.type === 'string') {
            cursor.next();
            attrs.note = v.value;
          }
        }
      } else if (lower === 'ref') {
        if (cursor.isSymbol(':')) {
          cursor.next();
          const opTok = cursor.peek();
          if (opTok.type === 'symbol' && relationOperators.includes(opTok.value)) {
            cursor.next();
            const b = parseEndpoint(t.line);
            if (b && b !== 'malformed') inlineRefs.push({ operator: opTok.value, b, line: t.line });
          }
        }
      } else {
        // Unknown flag — ignore the value if it has one, stay silent (many valid
        // DBML flags exist beyond this app's scope, e.g. `unsigned`).
        if (cursor.isSymbol(':')) {
          cursor.next();
          parseBracketedValue();
        }
      }
      if (cursor.isSymbol(',')) cursor.next();
    }
    if (cursor.isSymbol(']')) cursor.next();
    return { attrs, inlineRefs };
  };

  const parseTypeToken = (): string => {
    const t = cursor.peek();
    if (t.type !== 'ident' && t.type !== 'string') return 'unknown';
    cursor.next();
    let type = t.value;
    if (cursor.isSymbol('(')) {
      cursor.next();
      type += '(';
      let depth = 1;
      while (depth > 0 && !cursor.atEnd()) {
        const inner = cursor.next();
        if (inner.type === 'symbol' && inner.value === '(') depth++;
        else if (inner.type === 'symbol' && inner.value === ')') { depth--; if (depth === 0) { type += ')'; break; } }
        else type += inner.value === ',' ? ', ' : inner.value;
      }
    }
    if (cursor.isSymbol('[') && cursor.peek(1).type === 'symbol' && cursor.peek(1).value === ']') {
      cursor.next();
      cursor.next();
      type += '[]';
    }
    return type;
  };

  const parseTableSettings = (): { note?: string; color?: string } => {
    let note: string | undefined;
    let color: string | undefined;
    cursor.next(); // '['
    while (!cursor.isSymbol(']') && !cursor.atEnd()) {
      const t = cursor.peek();
      if (t.type === 'ident') {
        const lower = t.value.toLowerCase();
        cursor.next();
        if (cursor.isSymbol(':')) {
          cursor.next();
          const value = parseBracketedValue();
          if (lower === 'note') note = value;
          if (lower === 'headercolor' || lower === 'color') color = value;
        }
      } else {
        cursor.next();
      }
      if (cursor.isSymbol(',')) cursor.next();
    }
    if (cursor.isSymbol(']')) cursor.next();
    return { note, color };
  };

  const parseTable = () => {
    const startLine = cursor.peek().line;
    cursor.next(); // 'Table'
    const qualifiedTok = readQualifiedNameToken('table');
    if (!qualifiedTok) {
      fail(`Malformed "Table" declaration at line ${startLine}: missing table name.`, startLine);
      if (cursor.isSymbol('{')) { cursor.next(); skipBlock(); }
      return;
    }
    const tableRef = qualifiedTok.ref;
    const displayName = qualifiedDisplayName(tableRef);

    // Optional alias: `Table users as U`
    if (cursor.isIdent('as')) {
      cursor.next();
      readNameToken();
    }
    let note: string | undefined;
    let color: string | undefined;
    if (cursor.isSymbol('[')) {
      const settings = parseTableSettings();
      note = settings.note;
      color = settings.color;
    }
    if (!cursor.isSymbol('{')) {
      fail(`Malformed "Table ${displayName}" at line ${startLine}: expected "{".`, startLine);
      return;
    }
    cursor.next();

    const tableId = uniqueId(slugify(displayName), usedTableIds);
    const table: TableSchema = {
      id: tableId,
      name: tableRef.name,
      schema: tableRef.schema,
      qualifiedName: displayName,
      columns: [],
      note,
      color,
    };
    const columnNamesSeen = new Set<string>();

    /**
     * One entry per line inside `indexes { ... }`: either a bare column name
     * or a parenthesized composite list, optionally followed by `[unique,
     * name: '...']`. Column-reference validity is checked once the table's
     * full column list is known, after this loop.
     */
    const parseIndexEntry = (): void => {
      const lineStart = cursor.peek().line;
      const columns: string[] = [];
      if (cursor.isSymbol('(')) {
        cursor.next();
        while (!cursor.isSymbol(')') && !cursor.atEnd()) {
          const c = readNameToken();
          if (c) columns.push(c.value);
          else cursor.next();
          if (cursor.isSymbol(',')) cursor.next();
        }
        if (cursor.isSymbol(')')) cursor.next();
      } else {
        const c = readNameToken();
        if (c) columns.push(c.value);
      }

      if (columns.length === 0) {
        fail(`Malformed index entry in table "${displayName}" at line ${lineStart}.`, lineStart);
        if (!cursor.isSymbol('}') && !cursor.atEnd() && !cursor.isSymbol('[')) cursor.next();
      }

      let unique = false;
      let pk = false;
      let indexName: string | undefined;
      if (cursor.isSymbol('[')) {
        cursor.next();
        while (!cursor.isSymbol(']') && !cursor.atEnd()) {
          const t = cursor.peek();
          if (t.type === 'ident') {
            const lower = t.value.toLowerCase();
            cursor.next();
            if (lower === 'unique') {
              unique = true;
            } else if (lower === 'pk') {
              pk = true;
            } else if (lower === 'primary' && cursor.isIdent('key')) {
              cursor.next();
              pk = true;
            } else if (lower === 'name' && cursor.isSymbol(':')) {
              cursor.next();
              const v = cursor.peek();
              if (v.type === 'string') {
                cursor.next();
                indexName = v.value;
              }
            } else if (cursor.isSymbol(':')) {
              cursor.next();
              parseBracketedValue();
            }
          } else {
            cursor.next();
          }
          if (cursor.isSymbol(',')) cursor.next();
        }
        if (cursor.isSymbol(']')) cursor.next();
      }

      if (columns.length === 0) return;
      table.indexes = table.indexes ?? [];
      const index: IndexSchema = {
        id: `${tableId}__idx${table.indexes.length}`,
        columns,
        unique,
        pk: pk || undefined,
        name: indexName,
        line: lineStart,
      };
      table.indexes.push(index);
    };

    const parseIndexesBlock = (): void => {
      const blockStart = cursor.peek().line;
      while (!cursor.isSymbol('}') && !cursor.atEnd()) {
        parseIndexEntry();
      }
      if (cursor.isSymbol('}')) {
        cursor.next();
      } else {
        fail(`"indexes" block in table "${displayName}" starting at line ${blockStart} is missing a closing "}".`, cursor.peek().line);
      }
    };
    const canonicalKey = tableKey(tableRef);
    if (tableKeySeen.has(canonicalKey)) {
      warn(`Duplicate table "${displayName}" — both copies were kept, but references to this table may be ambiguous.`, startLine);
    }
    tableKeySeen.add(canonicalKey);

    while (!cursor.isSymbol('}') && !cursor.atEnd()) {
      const lineStart = cursor.peek().line;
      if (cursor.isIdent('note') && (cursor.peek(1).value === ':' || cursor.peek(1).value === '{')) {
        cursor.next();
        if (cursor.isSymbol(':')) {
          cursor.next();
          const v = cursor.peek();
          if (v.type === 'string') { cursor.next(); table.note = v.value; }
        } else if (cursor.isSymbol('{')) {
          cursor.next();
          const v = cursor.peek();
          if (v.type === 'string') { cursor.next(); table.note = v.value; }
          if (cursor.isSymbol('}')) cursor.next();
        }
        continue;
      }
      if (cursor.isIdent('indexes') && cursor.peek(1).type === 'symbol' && cursor.peek(1).value === '{') {
        cursor.next();
        cursor.next();
        parseIndexesBlock();
        continue;
      }
      const colNameTok = readNameToken();
      if (!colNameTok) {
        fail(`Unexpected token in table "${displayName}" at line ${lineStart}.`, lineStart);
        cursor.next();
        continue;
      }
      const type = parseTypeToken();
      let attrs: Partial<ColumnSchema> = {};
      let inlineRefs: InlineRef[] = [];
      if (cursor.isSymbol('[')) {
        cursor.next();
        const parsed = parseColumnAttrs();
        attrs = parsed.attrs;
        inlineRefs = parsed.inlineRefs;
      }
      if (columnNamesSeen.has(colNameTok.value.toLowerCase())) {
        warn(`Duplicate column "${colNameTok.value}" in table "${displayName}" at line ${lineStart}.`, lineStart);
      }
      columnNamesSeen.add(colNameTok.value.toLowerCase());
      const column: ColumnSchema = {
        id: `${tableId}__${slugify(colNameTok.value)}`,
        name: colNameTok.value,
        type,
        ...attrs,
      };
      table.columns.push(column);
      for (const ref of inlineRefs) {
        pendingRefs.push({
          a: { schema: tableRef.schema, name: tableRef.name, column: colNameTok.value },
          operator: ref.operator,
          b: ref.b,
          line: ref.line,
        });
      }
    }
    if (cursor.isSymbol('}')) {
      cursor.next();
    } else {
      fail(`Table "${displayName}" starting at line ${startLine} is missing a closing "}".`, cursor.peek().line);
    }

    if (table.indexes) {
      const colNames = new Set(table.columns.map((c) => c.name.toLowerCase()));
      table.indexes.forEach((idx) => {
        idx.columns.forEach((colName) => {
          if (!colNames.has(colName.toLowerCase())) {
            warn(
              `Index in table "${displayName}" references unknown column "${colName}".`,
              idx.line,
            );
          }
        });
      });
    }

    tables.push(table);
  };

  /**
   * `Records users(id, username, role) { 0, 'Alice', 'admin' ... }`
   *
   * Rows are newline-delimited rather than terminated by any symbol, so rows
   * are split on the token line number. Commas are pure separators and are
   * skipped — a trailing comma therefore can't produce a phantom empty cell.
   */
  const parseRecords = () => {
    const startLine = cursor.peek().line;
    cursor.next(); // 'Records'
    const qualifiedTok = readQualifiedNameToken('records');
    if (!qualifiedTok) {
      warn(`Malformed "Records" block at line ${startLine}: missing table name.`, startLine);
      if (cursor.isSymbol('{')) { cursor.next(); skipBlock(); }
      return;
    }
    const displayName = qualifiedDisplayName(qualifiedTok.ref);

    const columns: string[] = [];
    if (cursor.isSymbol('(')) {
      cursor.next();
      while (!cursor.isSymbol(')') && !cursor.atEnd()) {
        const c = readNameToken();
        if (c) columns.push(c.value);
        else cursor.next();
        if (cursor.isSymbol(',')) cursor.next();
      }
      if (cursor.isSymbol(')')) cursor.next();
    } else {
      warn(
        `"Records ${displayName}" at line ${startLine} is missing its column list, e.g. Records ${displayName}(id, name) { … }.`,
        startLine,
      );
    }

    if (!cursor.isSymbol('{')) {
      warn(`Malformed "Records ${displayName}" block at line ${startLine}: expected "{".`, startLine);
      return;
    }
    cursor.next();

    const rows: RecordValue[][] = [];
    let current: RecordValue[] = [];
    let currentLine = -1;

    while (!cursor.isSymbol('}') && !cursor.atEnd()) {
      if (cursor.isSymbol(',')) {
        cursor.next();
        continue;
      }
      const t = cursor.next();
      if (currentLine !== -1 && t.line !== currentLine && current.length > 0) {
        rows.push(current);
        current = [];
      }
      currentLine = t.line;
      current.push(t.type === 'ident' && t.value.toLowerCase() === 'null' ? null : t.value);
    }
    if (current.length > 0) rows.push(current);
    if (cursor.isSymbol('}')) cursor.next();

    records.push({ table: qualifiedTok.ref.name, schema: qualifiedTok.ref.schema, columns, rows, line: startLine });
  };

  /**
   * `Enum user_status { active inactive [note: '...'] suspended }`
   *
   * Values are newline-delimited like `Records` rows, and each may carry a
   * trailing `[note: '...']`. Malformed entries are skipped with a warning
   * rather than aborting the whole block, matching parser resilience
   * elsewhere (indexes, refs).
   */
  const parseEnum = () => {
    const startLine = cursor.peek().line;
    cursor.next(); // 'Enum'
    const nameTok = readNameToken();
    if (!nameTok) {
      fail(`Malformed "Enum" declaration at line ${startLine}: missing enum name.`, startLine);
      if (cursor.isSymbol('{')) { cursor.next(); skipBlock(); }
      return;
    }
    if (!cursor.isSymbol('{')) {
      fail(`Malformed "Enum ${nameTok.value}" at line ${startLine}: expected "{".`, startLine);
      return;
    }
    cursor.next();

    const enumId = uniqueId(slugify(nameTok.value), usedEnumIds);
    const values: EnumValueSchema[] = [];
    const valueNamesSeen = new Set<string>();

    while (!cursor.isSymbol('}') && !cursor.atEnd()) {
      const lineStart = cursor.peek().line;
      const valueTok = readNameToken();
      if (!valueTok) {
        warn(`Malformed enum value in "${nameTok.value}" at line ${lineStart}.`, lineStart);
        cursor.next();
        continue;
      }
      let note: string | undefined;
      if (cursor.isSymbol('[')) {
        cursor.next();
        while (!cursor.isSymbol(']') && !cursor.atEnd()) {
          const t = cursor.peek();
          if (t.type === 'ident' && t.value.toLowerCase() === 'note') {
            cursor.next();
            if (cursor.isSymbol(':')) {
              cursor.next();
              const v = cursor.peek();
              if (v.type === 'string') { cursor.next(); note = v.value; }
            }
          } else {
            cursor.next();
            if (cursor.isSymbol(':')) { cursor.next(); parseBracketedValue(); }
          }
          if (cursor.isSymbol(',')) cursor.next();
        }
        if (cursor.isSymbol(']')) cursor.next();
      }
      if (valueNamesSeen.has(valueTok.value.toLowerCase())) {
        warn(`Duplicate enum value "${valueTok.value}" in enum "${nameTok.value}" at line ${lineStart}.`, lineStart);
      }
      valueNamesSeen.add(valueTok.value.toLowerCase());
      values.push({ name: valueTok.value, note });
    }
    if (cursor.isSymbol('}')) {
      cursor.next();
    } else {
      fail(`Enum "${nameTok.value}" starting at line ${startLine} is missing a closing "}".`, cursor.peek().line);
    }

    const lowerName = nameTok.value.toLowerCase();
    if (enumNameSeen.has(lowerName)) {
      warn(`Duplicate enum name "${nameTok.value}" — both copies were kept, but column types referencing it may be ambiguous.`, startLine);
    }
    enumNameSeen.add(lowerName);

    enums.push({ id: enumId, name: nameTok.value, values, line: startLine });
  };

  /**
   * `TableGroup <name> [color: #...] { table1 table2 ... Note: '...' }`
   *
   * The group name is usually a single identifier, but real-world DBML (and
   * this app's own spec) also allows an unquoted multi-word name — the
   * tokenizer has no notion of spaces inside an identifier, so consecutive
   * ident/string tokens before the settings `[` or body `{` are joined back
   * together, the same way a quoted `"User Management"` collapses to one
   * string token.
   */
  const readGroupName = (): { value: string; line: number } | null => {
    const first = cursor.peek();
    if (first.type !== 'ident' && first.type !== 'string') return null;
    const line = first.line;
    const parts: string[] = [];
    // Bounded to the first token's own line: a name is always typed on one
    // line before its `[` settings or `{` body, and staying on-line is what
    // stops this from swallowing the next top-level statement whenever a
    // "TableGroup <name>" is malformed and missing its brace altogether.
    while (!cursor.atEnd()) {
      const t = cursor.peek();
      if ((t.type !== 'ident' && t.type !== 'string') || t.line !== line) break;
      parts.push(cursor.next().value);
    }
    return { value: parts.join(' '), line };
  };

  const parseTableGroup = () => {
    const startLine = cursor.peek().line;
    cursor.next(); // 'TableGroup'
    const nameTok = readGroupName();
    if (!nameTok) {
      fail(`Malformed "TableGroup" declaration at line ${startLine}: missing group name.`, startLine);
      if (cursor.isSymbol('{')) { cursor.next(); skipBlock(); }
      return;
    }
    let color: string | undefined;
    if (cursor.isSymbol('[')) {
      color = parseTableSettings().color;
    }
    if (!cursor.isSymbol('{')) {
      fail(`Malformed "TableGroup ${nameTok.value}" at line ${startLine}: expected "{".`, startLine);
      return;
    }
    cursor.next();

    const groupId = uniqueId(slugify(nameTok.value), usedGroupIds);
    const members: string[] = [];
    const memberRefs: TableRef[] = [];
    let note: string | undefined;

    while (!cursor.isSymbol('}') && !cursor.atEnd()) {
      const lineStart = cursor.peek().line;
      if (cursor.isIdent('note') && (cursor.peek(1).value === ':' || cursor.peek(1).value === '{')) {
        cursor.next();
        if (cursor.isSymbol(':')) {
          cursor.next();
          const v = cursor.peek();
          if (v.type === 'string') { cursor.next(); note = v.value; }
        } else if (cursor.isSymbol('{')) {
          cursor.next();
          const v = cursor.peek();
          if (v.type === 'string') { cursor.next(); note = v.value; }
          if (cursor.isSymbol('}')) cursor.next();
        }
        continue;
      }
      const memberTok = readQualifiedNameToken('table group member');
      if (!memberTok) {
        fail(`Unexpected token in "TableGroup ${nameTok.value}" at line ${lineStart}.`, lineStart);
        cursor.next();
        continue;
      }
      // Optional per-member settings, e.g. `users [color: #cabbca]` — not
      // represented in the schema, just consumed so it doesn't derail parsing.
      if (cursor.isSymbol('[')) parseTableSettings();
      members.push(qualifiedDisplayName(memberTok.ref));
      memberRefs.push(memberTok.ref);
    }
    if (cursor.isSymbol('}')) {
      cursor.next();
    } else {
      fail(`"TableGroup ${nameTok.value}" starting at line ${startLine} is missing a closing "}".`, cursor.peek().line);
    }

    tableGroups.push({ id: groupId, name: nameTok.value, tables: members, tableRefs: memberRefs, note, color, line: startLine });
  };

  while (!cursor.atEnd()) {
    if (cursor.isIdent('table')) {
      parseTable();
    } else if (cursor.isIdent('ref')) {
      parseRefStatement();
    } else if (cursor.isIdent('enum')) {
      parseEnum();
    } else if (cursor.isIdent('tablegroup') || cursor.isIdent('table_group')) {
      parseTableGroup();
    } else if (cursor.isIdent('project')) {
      cursor.next();
      readNameToken();
      if (cursor.isSymbol('[')) parseTableSettings();
      if (cursor.isSymbol('{')) { cursor.next(); skipBlock(); }
    } else if (cursor.isIdent('note')) {
      cursor.next();
      if (cursor.isIdent()) cursor.next();
      if (cursor.isSymbol(':')) { cursor.next(); if (cursor.peek().type === 'string') cursor.next(); }
      else if (cursor.isSymbol('{')) { cursor.next(); skipBlock(); }
    } else if (cursor.isIdent('records')) {
      parseRecords();
    } else if (cursor.isIdent() && cursor.peek(1).type === 'symbol' && cursor.peek(1).value === '{') {
      const t = cursor.next();
      cursor.next();
      skipBlock();
      warn(`Unknown block "${t.value}" at line ${t.line} was skipped.`, t.line);
    } else if (cursor.atEnd()) {
      break;
    } else {
      const t = cursor.next();
      if (t.type !== 'eof') {
        fail(`Unexpected token "${t.value}" at line ${t.line} was skipped.`, t.line);
      }
    }
  }

  const tableIndex = new TableIndex(tables);
  const relationships = resolvePendingRefs(pendingRefs, tableIndex, warn);
  validateRecords(records, tableIndex, warn);
  validateTableGroups(tableGroups, tableIndex, warn);

  return { tables, relationships, records, enums, tableGroups, warnings };
}

/**
 * Resolves a table reference the same way for Records blocks, TableGroup
 * members and Ref endpoints: qualified refs must match exactly, unqualified
 * refs must match exactly one table across every schema. Returns `undefined`
 * (after emitting the appropriate diagnostic) rather than ever guessing.
 */
function resolveTableRef(
  ref: TableRef,
  index: TableIndex,
  line: number,
  describe: (display: string) => string,
  warn: (message: string, line: number) => void,
): TableSchema | undefined {
  const resolution = index.resolve(ref);
  const display = qualifiedDisplayName(ref);
  if (resolution.kind === 'found') return resolution.table;
  if (resolution.kind === 'not-found') {
    warn(describe(`unknown table "${display}"`), line);
    return undefined;
  }
  const candidates = resolution.matches.map((t) => `"${t.qualifiedName}"`).join(', ');
  warn(
    describe(`ambiguous table "${display}" — matches ${candidates}. Qualify it with a schema, e.g. ${resolution.matches[0].qualifiedName}`),
    line,
  );
  return undefined;
}

/** Group members are reported on but kept — an unknown table name shouldn't drop the rest of the group. */
function validateTableGroups(
  tableGroups: TableGroupSchema[],
  tableIndex: TableIndex,
  warn: (message: string, line: number) => void,
): void {
  tableGroups.forEach((group) => {
    group.tableRefs.forEach((ref) => {
      resolveTableRef(ref, tableIndex, group.line, (reason) => `TableGroup "${group.name}" references ${reason}.`, warn);
    });
  });
}

/**
 * Records are reported on but never dropped — a typo'd column shouldn't hide
 * the rows the user already typed, it should just be flagged.
 */
function validateRecords(
  records: TableRecords[],
  tableIndex: TableIndex,
  warn: (message: string, line: number) => void,
): void {
  records.forEach((block) => {
    const table = resolveTableRef(
      { schema: block.schema, name: block.table },
      tableIndex,
      block.line,
      (reason) => `Records block at line ${block.line} refers to ${reason}.`,
      warn,
    );
    if (!table) return;
    const columnNames = new Set(table.columns.map((c) => c.name.toLowerCase()));
    block.columns.forEach((col) => {
      if (!columnNames.has(col.toLowerCase())) {
        warn(`Records block at line ${block.line}: "${table.qualifiedName}" has no column "${col}".`, block.line);
      }
    });
    if (block.columns.length === 0) return;
    block.rows.forEach((row, index) => {
      if (row.length !== block.columns.length) {
        warn(
          `Records block at line ${block.line}, row ${index + 1}: expected ${block.columns.length} value(s) but found ${row.length}.`,
          block.line,
        );
      }
    });
  });
}

function resolvePendingRefs(
  pendingRefs: PendingRef[],
  tableIndex: TableIndex,
  warn: (message: string, line: number) => void,
): DatabaseSchema['relationships'] {
  const relationships: DatabaseSchema['relationships'] = [];

  pendingRefs.forEach((ref, index) => {
    const tableA = resolveTableRef(ref.a, tableIndex, ref.line, (reason) => `Reference at line ${ref.line} points to ${reason}.`, warn);
    const tableB = resolveTableRef(ref.b, tableIndex, ref.line, (reason) => `Reference at line ${ref.line} points to ${reason}.`, warn);
    if (!tableA || !tableB) return;

    const colA = tableA.columns.find((c) => c.name.toLowerCase() === ref.a.column.toLowerCase());
    const colB = tableB.columns.find((c) => c.name.toLowerCase() === ref.b.column.toLowerCase());
    if (!colA) warn(`Reference at line ${ref.line}: "${tableA.qualifiedName}" has no column "${ref.a.column}".`, ref.line);
    if (!colB) warn(`Reference at line ${ref.line}: "${tableB.qualifiedName}" has no column "${ref.b.column}".`, ref.line);

    let sourceTable = tableA;
    let sourceColumn = ref.a.column;
    let targetTable = tableB;
    let targetColumn = ref.b.column;
    let relation: RelationKind = 'unknown';

    switch (ref.operator) {
      case '>':
        relation = 'many-to-one';
        break;
      case '<':
        sourceTable = tableB;
        sourceColumn = ref.b.column;
        targetTable = tableA;
        targetColumn = ref.a.column;
        relation = 'many-to-one';
        break;
      case '-':
        relation = 'one-to-one';
        break;
      case '<>':
        relation = 'many-to-many';
        break;
    }

    const sourceKey = tableKey(sourceTable);
    const targetKey = tableKey(targetTable);
    relationships.push({
      id: `ref_${index}_${slugify(sourceKey)}_${slugify(sourceColumn)}_${slugify(targetKey)}_${slugify(targetColumn)}`,
      name: ref.name,
      sourceTable: sourceKey,
      sourceColumn,
      targetTable: targetKey,
      targetColumn,
      relation,
    });
  });

  return relationships;
}
