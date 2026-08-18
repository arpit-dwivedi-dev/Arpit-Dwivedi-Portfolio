import type { Node } from '@xyflow/react';
import { tableKey, TableIndex } from '../schema/tableIdentity';
import type { ColumnSchema, DatabaseSchema, EnumSchema, IndexSchema, NodePosition } from '../types';
import { computeNodeSize } from './layout';

export interface TableNodeData extends Record<string, unknown> {
  tableId: string;
  name: string;
  schema?: string;
  qualifiedName: string;
  columns: ColumnSchema[];
  indexes: IndexSchema[];
  note?: string;
  color?: string;
  fkColumnNames: string[];
  /** Row count from this table's `Records` block, shown on the header button. */
  recordCount: number;
  /** Enum definitions keyed by lowercased name, for columns whose type references one. */
  enumsByType: Record<string, EnumSchema>;
  /** Set by DiagramCanvas (not here) when this table is the current search-focus target. */
  searchFocused?: boolean;
  /** Set by DiagramCanvas (not here) to the column search-focused within this table, if any. */
  highlightedColumnId?: string;
}

export type TableNode = Node<TableNodeData, 'table'>;

export function buildNodes(schema: DatabaseSchema, positions: Record<string, NodePosition>): TableNode[] {
  const fkByTable = new Map<string, Set<string>>();
  schema.relationships.forEach((rel) => {
    if (!fkByTable.has(rel.sourceTable)) fkByTable.set(rel.sourceTable, new Set());
    fkByTable.get(rel.sourceTable)!.add(rel.sourceColumn);
  });

  // Records blocks are resolved the same schema-aware way as Refs — an
  // ambiguous or unresolved block was already diagnosed by the parser, so it
  // simply contributes no count here rather than guessing a table to credit.
  const tableIndex = new TableIndex(schema.tables);
  const recordCountByTable = new Map<string, number>();
  schema.records.forEach((block) => {
    const resolution = tableIndex.resolve({ schema: block.schema, name: block.table });
    if (resolution.kind !== 'found') return;
    const key = tableKey(resolution.table);
    recordCountByTable.set(key, (recordCountByTable.get(key) ?? 0) + block.rows.length);
  });

  const enumsByType: Record<string, EnumSchema> = {};
  schema.enums.forEach((e) => {
    enumsByType[e.name.toLowerCase()] = e;
  });

  return schema.tables.map((table) => {
    const { width, height } = computeNodeSize(table);
    const key = tableKey(table);
    const position = positions[key] ?? { x: 0, y: 0 };
    return {
      id: key,
      type: 'table',
      position,
      width,
      height,
      data: {
        tableId: table.id,
        name: table.name,
        schema: table.schema,
        qualifiedName: table.qualifiedName,
        columns: table.columns,
        indexes: table.indexes ?? [],
        note: table.note,
        color: table.color,
        fkColumnNames: Array.from(fkByTable.get(key) ?? []),
        recordCount: recordCountByTable.get(key) ?? 0,
        enumsByType,
      },
    };
  });
}
