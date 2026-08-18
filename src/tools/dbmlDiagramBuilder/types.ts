export interface ColumnSchema {
  id: string;
  name: string;
  type: string;
  primaryKey?: boolean;
  notNull?: boolean;
  unique?: boolean;
  increment?: boolean;
  defaultValue?: string;
  note?: string;
}

export interface IndexSchema {
  id: string;
  columns: string[];
  unique?: boolean;
  /** Set when the index block entry carries the `[pk]` flag, DBML's syntax for a composite primary key. */
  pk?: boolean;
  name?: string;
  line: number;
}

export interface TableSchema {
  id: string;
  /** Unqualified table name as written, e.g. "users". */
  name: string;
  /** Schema/namespace prefix, e.g. "public" — `undefined` when the table is unqualified. Never invented. */
  schema?: string;
  /** `schema.name` for display when qualified, else just `name`. */
  qualifiedName: string;
  columns: ColumnSchema[];
  indexes?: IndexSchema[];
  note?: string;
  color?: string;
}

export interface EnumValueSchema {
  name: string;
  note?: string;
}

export interface EnumSchema {
  id: string;
  name: string;
  values: EnumValueSchema[];
  line: number;
}

export type RelationKind = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many' | 'unknown';

export interface RelationshipSchema {
  id: string;
  name?: string;
  /** Canonical identity key (see `tableKey`) of the source/target table — not necessarily its display name. */
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  relation: RelationKind;
}

export interface ParserWarning {
  message: string;
  line?: number;
  severity: 'warning' | 'error';
}

/** A `null` cell is DBML's literal `null`; every other value is kept as text. */
export type RecordValue = string | null;

/** One `Records <table>(<columns>) { ... }` block. */
export interface TableRecords {
  /** Unqualified table name as written. */
  table: string;
  /** Schema prefix, e.g. `Records public.users(...)` — `undefined` when unqualified. */
  schema?: string;
  columns: string[];
  rows: RecordValue[][];
  line: number;
}

/** One `TableGroup <name> { table1 table2 ... }` block. */
export interface TableGroupSchema {
  id: string;
  name: string;
  /** Member table names as display strings (schema-qualified when written that way), in block order. */
  tables: string[];
  /** Same members as structured refs, parallel to `tables`, for identity resolution. */
  tableRefs: { schema?: string; name: string }[];
  note?: string;
  color?: string;
  line: number;
}

export interface DatabaseSchema {
  tables: TableSchema[];
  relationships: RelationshipSchema[];
  records: TableRecords[];
  enums: EnumSchema[];
  tableGroups: TableGroupSchema[];
  warnings: ParserWarning[];
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface DbmlDocument {
  id: string;
  name: string;
  dbml: string;
  nodePositions: Record<string, NodePosition>;
  createdAt: number;
  updatedAt: number;
}
