import type { Node } from '@xyflow/react';
import { tableKey, TableIndex } from '../schema/tableIdentity';
import type { DatabaseSchema, NodePosition } from '../types';
import { computeNodeSize } from './layout';

export interface TableGroupNodeData extends Record<string, unknown> {
  groupId: string;
  name: string;
  note?: string;
  color: string;
  tableCount: number;
}

export type TableGroupNode = Node<TableGroupNodeData, 'tableGroup'>;

const GROUP_PADDING = 40;
const GROUP_LABEL_HEIGHT = 28;

/** Cycled through when a group has no explicit `[color: ...]` setting. */
const DEFAULT_PALETTE = ['#6366f1', '#0ea5e9', '#f97316', '#10b981', '#ec4899', '#a855f7', '#eab308', '#14b8a6'];

/**
 * One background container per `TableGroup`, sized to the current bounding
 * box of its member tables — never a node per member. Recomputed from the
 * live table positions/sizes on every render, so it never needs its own
 * entry in the persisted node-position map and always tracks drags/relayout.
 */
export function buildGroupNodes(schema: DatabaseSchema, positions: Record<string, NodePosition>): TableGroupNode[] {
  const tableIndex = new TableIndex(schema.tables);

  const nodes: TableGroupNode[] = [];
  schema.tableGroups.forEach((group, index) => {
    // An ambiguous or unresolved member was already diagnosed by the parser
    // — it just doesn't contribute to this group's bounding box here.
    const memberTables = group.tableRefs
      .map((ref) => tableIndex.resolve(ref))
      .filter((r): r is { kind: 'found'; table: (typeof schema.tables)[number] } => r.kind === 'found')
      .map((r) => r.table);
    if (memberTables.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    memberTables.forEach((table) => {
      const pos = positions[tableKey(table)] ?? { x: 0, y: 0 };
      const { width, height } = computeNodeSize(table);
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + width);
      maxY = Math.max(maxY, pos.y + height);
    });

    nodes.push({
      id: `group__${group.id}`,
      type: 'tableGroup',
      position: { x: minX - GROUP_PADDING, y: minY - GROUP_PADDING - GROUP_LABEL_HEIGHT },
      width: maxX - minX + GROUP_PADDING * 2,
      height: maxY - minY + GROUP_PADDING * 2 + GROUP_LABEL_HEIGHT,
      zIndex: -1,
      selectable: false,
      draggable: false,
      focusable: false,
      data: {
        groupId: group.id,
        name: group.name,
        note: group.note,
        color: group.color || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length],
        tableCount: memberTables.length,
      },
    });
  });

  return nodes;
}
