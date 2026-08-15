import { tokenize, type Token } from './tokenizer';
import { slugify, uniqueId } from './parserUtils';
import type {
  ColumnSchema,
  DatabaseSchema,
  ParserWarning,
  RecordValue,
  RelationKind,
  TableRecords,
  TableSchema,
} from '../types';

const MAX_WARNINGS = 60;

interface PendingRef {
  name?: string;
  aTable: string;
  aColumn: string;
  operator: string;
  bTable: string;
  bColumn: string;
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
  const usedTableIds = new Set<string>();
  const tableNameSeen = new Set<string>();

  const warn = (message: string, line: number, severity: ParserWarning['severity'] = 'warning') => {
    if (warnings.length >= MAX_WARNINGS) return;
    warnings.push({ message, line, severity });
  };

  const readNameToken = (): { value: string; line: number } | null => {
    const t = cursor.peek();
    if (t.type === 'ident' || t.type === 'string') {
      cursor.next();
      return { value: t.value, line: t.line };
    }
    return null;
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

  const parseEndpoint = (): { table: string; column: string } | null => {
    const tableTok = readNameToken();
    if (!tableTok) return null;
    if (!cursor.isSymbol('.')) return null;
    cursor.next();
    if (cursor.isSymbol('(')) {
      cursor.next();
      const cols: string[] = [];
      while (!cursor.isSymbol(')') && !cursor.atEnd()) {
        const c = readNameToken();
        if (c) cols.push(c.value);
        if (cursor.isSymbol(',')) cursor.next();
      }
      if (cursor.isSymbol(')')) cursor.next();
      return { table: tableTok.value, column: cols.join('+') };
    }
    const colTok = readNameToken();
    if (!colTok) return null;
    return { table: tableTok.value, column: colTok.value };
  };

  const relationOperators = ['>', '<', '-', '<>'];

  const parseRefBody = (name: string | undefined, line: number) => {
    const a = parseEndpoint();
    if (!a) {
      warn(`Malformed reference near line ${line}: expected "table.column".`, line);
      return;
    }
    const opTok = cursor.peek();
    if (!(opTok.type === 'symbol' && relationOperators.includes(opTok.value))) {
      warn(`Malformed reference near line ${line}: expected one of > < - <> after "${a.table}.${a.column}".`, line);
      return;
    }
    cursor.next();
    const b = parseEndpoint();
    if (!b) {
      warn(`Malformed reference near line ${line}: expected "table.column" after "${opTok.value}".`, line);
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
    pendingRefs.push({ name, aTable: a.table, aColumn: a.column, operator: opTok.value, bTable: b.table, bColumn: b.column, line });
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
      if (cursor.isSymbol('}')) cursor.next();
    } else {
      warn(`Malformed "Ref" statement at line ${startLine}.`, startLine);
    }
  };

  interface InlineRef { operator: string; bTable: string; bColumn: string; line: number }

  const parseColumnAttrs = (tableName: string, columnName: string): { attrs: Partial<ColumnSchema>; inlineRefs: InlineRef[] } => {
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
            const b = parseEndpoint();
            if (b) inlineRefs.push({ operator: opTok.value, bTable: b.table, bColumn: b.column, line: t.line });
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
    void tableName;
    void columnName;
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
    const nameTok = readNameToken();
    if (!nameTok) {
      warn(`Malformed "Table" declaration at line ${startLine}: missing table name.`, startLine);
      if (cursor.isSymbol('{')) { cursor.next(); skipBlock(); }
      return;
    }
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
      warn(`Malformed "Table ${nameTok.value}" at line ${startLine}: expected "{".`, startLine);
      return;
    }
    cursor.next();

    const tableId = uniqueId(slugify(nameTok.value), usedTableIds);
    const table: TableSchema = { id: tableId, name: nameTok.value, columns: [], note, color };
    const columnNamesSeen = new Set<string>();
    const lowerName = nameTok.value.toLowerCase();
    if (tableNameSeen.has(lowerName)) {
      warn(`Duplicate table name "${nameTok.value}" — both copies were kept, but references to this table may be ambiguous.`, startLine);
    }
    tableNameSeen.add(lowerName);

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
        skipBlock();
        continue;
      }
      const colNameTok = readNameToken();
      if (!colNameTok) {
        warn(`Unexpected token in table "${nameTok.value}" at line ${lineStart}.`, lineStart);
        cursor.next();
        continue;
      }
      const type = parseTypeToken();
      let attrs: Partial<ColumnSchema> = {};
      let inlineRefs: InlineRef[] = [];
      if (cursor.isSymbol('[')) {
        cursor.next();
        const parsed = parseColumnAttrs(nameTok.value, colNameTok.value);
        attrs = parsed.attrs;
        inlineRefs = parsed.inlineRefs;
      }
      if (columnNamesSeen.has(colNameTok.value.toLowerCase())) {
        warn(`Duplicate column "${colNameTok.value}" in table "${nameTok.value}" at line ${lineStart}.`, lineStart);
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
          aTable: nameTok.value,
          aColumn: colNameTok.value,
          operator: ref.operator,
          bTable: ref.bTable,
          bColumn: ref.bColumn,
          line: ref.line,
        });
      }
    }
    if (cursor.isSymbol('}')) cursor.next();
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
    const nameTok = readNameToken();
    if (!nameTok) {
      warn(`Malformed "Records" block at line ${startLine}: missing table name.`, startLine);
      if (cursor.isSymbol('{')) { cursor.next(); skipBlock(); }
      return;
    }

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
        `"Records ${nameTok.value}" at line ${startLine} is missing its column list, e.g. Records ${nameTok.value}(id, name) { … }.`,
        startLine,
      );
    }

    if (!cursor.isSymbol('{')) {
      warn(`Malformed "Records ${nameTok.value}" block at line ${startLine}: expected "{".`, startLine);
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

    records.push({ table: nameTok.value, columns, rows, line: startLine });
  };

  while (!cursor.atEnd()) {
    if (cursor.isIdent('table')) {
      parseTable();
    } else if (cursor.isIdent('ref')) {
      parseRefStatement();
    } else if (cursor.isIdent('enum')) {
      const line = cursor.peek().line;
      cursor.next();
      const nameTok = readNameToken();
      if (cursor.isSymbol('{')) {
        cursor.next();
        skipBlock();
        warn(`Enum "${nameTok?.value ?? ''}" was parsed but isn't rendered in the diagram yet.`, line);
      }
    } else if (cursor.isIdent('tablegroup') || cursor.isIdent('table_group')) {
      cursor.next();
      readNameToken();
      if (cursor.isSymbol('[')) parseTableSettings();
      if (cursor.isSymbol('{')) { cursor.next(); skipBlock(); }
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
        warn(`Unexpected token "${t.value}" at line ${t.line} was skipped.`, t.line);
      }
    }
  }

  const relationships = resolvePendingRefs(pendingRefs, tables, warn);
  validateRecords(records, tables, warn);

  return { tables, relationships, records, warnings };
}

/**
 * Records are reported on but never dropped — a typo'd column shouldn't hide
 * the rows the user already typed, it should just be flagged.
 */
function validateRecords(
  records: TableRecords[],
  tables: TableSchema[],
  warn: (message: string, line: number) => void,
): void {
  const byName = new Map(tables.map((t) => [t.name.toLowerCase(), t]));

  records.forEach((block) => {
    const table = byName.get(block.table.toLowerCase());
    if (!table) {
      warn(`Records block at line ${block.line} refers to unknown table "${block.table}".`, block.line);
      return;
    }
    const columnNames = new Set(table.columns.map((c) => c.name.toLowerCase()));
    block.columns.forEach((col) => {
      if (!columnNames.has(col.toLowerCase())) {
        warn(`Records block at line ${block.line}: "${block.table}" has no column "${col}".`, block.line);
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
  tables: TableSchema[],
  warn: (message: string, line: number) => void,
): DatabaseSchema['relationships'] {
  const byName = new Map(tables.map((t) => [t.name.toLowerCase(), t]));
  const relationships: DatabaseSchema['relationships'] = [];

  pendingRefs.forEach((ref, index) => {
    const tableA = byName.get(ref.aTable.toLowerCase());
    const tableB = byName.get(ref.bTable.toLowerCase());
    if (!tableA) {
      warn(`Reference at line ${ref.line} points to unknown table "${ref.aTable}".`, ref.line);
      return;
    }
    if (!tableB) {
      warn(`Reference at line ${ref.line} points to unknown table "${ref.bTable}".`, ref.line);
      return;
    }
    const colA = tableA.columns.find((c) => c.name.toLowerCase() === ref.aColumn.toLowerCase());
    const colB = tableB.columns.find((c) => c.name.toLowerCase() === ref.bColumn.toLowerCase());
    if (!colA) warn(`Reference at line ${ref.line}: "${ref.aTable}" has no column "${ref.aColumn}".`, ref.line);
    if (!colB) warn(`Reference at line ${ref.line}: "${ref.bTable}" has no column "${ref.bColumn}".`, ref.line);

    let sourceTable = tableA.name;
    let sourceColumn = ref.aColumn;
    let targetTable = tableB.name;
    let targetColumn = ref.bColumn;
    let relation: RelationKind = 'unknown';

    switch (ref.operator) {
      case '>':
        relation = 'many-to-one';
        break;
      case '<':
        sourceTable = tableB.name;
        sourceColumn = ref.bColumn;
        targetTable = tableA.name;
        targetColumn = ref.aColumn;
        relation = 'many-to-one';
        break;
      case '-':
        relation = 'one-to-one';
        break;
      case '<>':
        relation = 'many-to-many';
        break;
    }

    relationships.push({
      id: `ref_${index}_${slugify(sourceTable)}_${slugify(sourceColumn)}_${slugify(targetTable)}_${slugify(targetColumn)}`,
      name: ref.name,
      sourceTable,
      sourceColumn,
      targetTable,
      targetColumn,
      relation,
    });
  });

  return relationships;
}
