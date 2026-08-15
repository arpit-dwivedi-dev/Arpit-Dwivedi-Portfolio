import type { Node } from '@xyflow/react';
import type { ColumnSchema, DatabaseSchema, NodePosition } from '../types';
import { computeNodeSize } from './layout';

export interface TableNodeData extends Record<string, unknown> {
  tableId: string;
  name: string;
  columns: ColumnSchema[];
  note?: string;
  color?: string;
  fkColumnNames: string[];
  /** Row count from this table's `Records` block, shown on the header button. */
  recordCount: number;
}

export type TableNode = Node<TableNodeData, 'table'>;

export function buildNodes(schema: DatabaseSchema, positions: Record<string, NodePosition>): TableNode[] {
  const fkByTable = new Map<string, Set<string>>();
  schema.relationships.forEach((rel) => {
    if (!fkByTable.has(rel.sourceTable)) fkByTable.set(rel.sourceTable, new Set());
    fkByTable.get(rel.sourceTable)!.add(rel.sourceColumn);
  });

  const recordCountByTable = new Map<string, number>();
  schema.records.forEach((block) => {
    const key = block.table.toLowerCase();
    recordCountByTable.set(key, (recordCountByTable.get(key) ?? 0) + block.rows.length);
  });

  return schema.tables.map((table) => {
    const { width, height } = computeNodeSize(table);
    const position = positions[table.name] ?? { x: 0, y: 0 };
    return {
      id: table.name,
      type: 'table',
      position,
      width,
      height,
      data: {
        tableId: table.id,
        name: table.name,
        columns: table.columns,
        note: table.note,
        color: table.color,
        fkColumnNames: Array.from(fkByTable.get(table.name) ?? []),
        recordCount: recordCountByTable.get(table.name.toLowerCase()) ?? 0,
      },
    };
  });
}
