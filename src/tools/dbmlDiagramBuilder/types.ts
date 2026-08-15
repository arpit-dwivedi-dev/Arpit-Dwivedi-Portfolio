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

export interface TableSchema {
  id: string;
  name: string;
  columns: ColumnSchema[];
  note?: string;
  color?: string;
}

export type RelationKind = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many' | 'unknown';

export interface RelationshipSchema {
  id: string;
  name?: string;
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
  table: string;
  columns: string[];
  rows: RecordValue[][];
  line: number;
}

export interface DatabaseSchema {
  tables: TableSchema[];
  relationships: RelationshipSchema[];
  records: TableRecords[];
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
