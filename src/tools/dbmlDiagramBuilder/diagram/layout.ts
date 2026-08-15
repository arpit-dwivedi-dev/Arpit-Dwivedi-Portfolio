import dagre from '@dagrejs/dagre';
import type { DatabaseSchema, NodePosition, TableSchema } from '../types';

export const HEADER_HEIGHT = 36;
export const ROW_HEIGHT = 28;
export const FOOTER_PADDING = 8;
const NODE_WIDTH_MIN = 220;
const NODE_WIDTH_MAX = 320;

export function computeNodeSize(table: TableSchema): { width: number; height: number } {
  const longest = table.columns.reduce(
    (max, c) => Math.max(max, c.name.length + c.type.length),
    table.name.length,
  );
  const width = Math.min(NODE_WIDTH_MAX, Math.max(NODE_WIDTH_MIN, 96 + longest * 6.2));
  const height = HEADER_HEIGHT + Math.max(1, table.columns.length) * ROW_HEIGHT + FOOTER_PADDING;
  return { width, height };
}

/** Runs a fresh dagre auto-layout over the whole schema, ignoring any stored positions. */
export function layoutSchema(schema: DatabaseSchema): Record<string, NodePosition> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 70, ranksep: 160, marginx: 60, marginy: 60 });
  g.setDefaultEdgeLabel(() => ({}));

  const tableNames = new Set(schema.tables.map((t) => t.name));

  schema.tables.forEach((table) => {
    const { width, height } = computeNodeSize(table);
    g.setNode(table.name, { width, height });
  });

  schema.relationships.forEach((rel) => {
    if (rel.sourceTable === rel.targetTable) return;
    if (!tableNames.has(rel.sourceTable) || !tableNames.has(rel.targetTable)) return;
    g.setEdge(rel.sourceTable, rel.targetTable);
  });

  dagre.layout(g);

  const positions: Record<string, NodePosition> = {};
  schema.tables.forEach((table) => {
    const node = g.node(table.name);
    positions[table.name] = { x: node.x - node.width / 2, y: node.y - node.height / 2 };
  });
  return positions;
}

/**
 * Merges auto-layout with whatever the user has already dragged into place.
 * Only tables missing a stored position get a freshly computed spot — this
 * is what keeps the diagram from jumping around on every small edit (see
 * DEVELOPMENT_PROCESS section 34 in the brief: preserve manual positions).
 * `forceRelayout` (the explicit "Auto Layout" command) discards everything
 * and recomputes from scratch.
 */
export function resolvePositions(
  schema: DatabaseSchema,
  storedPositions: Record<string, NodePosition>,
  forceRelayout = false,
): Record<string, NodePosition> {
  const tableNames = schema.tables.map((t) => t.name);
  const hasAnyStored = tableNames.some((name) => name in storedPositions);

  if (forceRelayout || !hasAnyStored) {
    return layoutSchema(schema);
  }

  const missing = schema.tables.filter((t) => !(t.name in storedPositions));
  const freshLayout = missing.length > 0 ? layoutSchema(schema) : {};

  const result: Record<string, NodePosition> = {};
  schema.tables.forEach((t) => {
    result[t.name] = storedPositions[t.name] ?? freshLayout[t.name] ?? { x: 0, y: 0 };
  });
  return result;
}
