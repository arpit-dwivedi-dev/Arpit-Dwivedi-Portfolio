import dagre from '@dagrejs/dagre';
import { tableKey } from '../schema/tableIdentity';
import type { DatabaseSchema, NodePosition, TableSchema } from '../types';

export const HEADER_HEIGHT = 36;
export const ROW_HEIGHT = 28;
export const FOOTER_PADDING = 8;
export const INDEX_SECTION_HEADER_HEIGHT = 20;
export const INDEX_ROW_HEIGHT = 22;
const NODE_WIDTH_MIN = 220;
const NODE_WIDTH_MAX = 320;

export function computeNodeSize(table: TableSchema): { width: number; height: number } {
  const longest = table.columns.reduce(
    (max, c) => Math.max(max, c.name.length + c.type.length),
    table.name.length,
  );
  const width = Math.min(NODE_WIDTH_MAX, Math.max(NODE_WIDTH_MIN, 96 + longest * 6.2));
  const indexCount = table.indexes?.length ?? 0;
  const indexesHeight = indexCount > 0 ? INDEX_SECTION_HEADER_HEIGHT + indexCount * INDEX_ROW_HEIGHT : 0;
  const height =
    HEADER_HEIGHT + Math.max(1, table.columns.length) * ROW_HEIGHT + indexesHeight + FOOTER_PADDING;
  return { width, height };
}

/** Runs a fresh dagre auto-layout over the whole schema, ignoring any stored positions. */
export function layoutSchema(schema: DatabaseSchema): Record<string, NodePosition> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 70, ranksep: 160, marginx: 60, marginy: 60 });
  g.setDefaultEdgeLabel(() => ({}));

  const tableKeys = new Set(schema.tables.map((t) => tableKey(t)));

  schema.tables.forEach((table) => {
    const { width, height } = computeNodeSize(table);
    g.setNode(tableKey(table), { width, height });
  });

  schema.relationships.forEach((rel) => {
    if (rel.sourceTable === rel.targetTable) return;
    if (!tableKeys.has(rel.sourceTable) || !tableKeys.has(rel.targetTable)) return;
    g.setEdge(rel.sourceTable, rel.targetTable);
  });

  dagre.layout(g);

  const positions: Record<string, NodePosition> = {};
  schema.tables.forEach((table) => {
    const key = tableKey(table);
    const node = g.node(key);
    positions[key] = { x: node.x - node.width / 2, y: node.y - node.height / 2 };
  });
  return positions;
}

/**
 * Looks up a table's stored position by its canonical identity key, falling
 * back — for unqualified tables only — to the table's exact-case display
 * name. That legacy key is what every position was stored under before
 * schema support existed, so this keeps pre-existing localStorage data
 * working without a one-time migration step.
 */
function legacyOrCanonicalPosition(
  storedPositions: Record<string, NodePosition>,
  table: TableSchema,
): NodePosition | undefined {
  const canonical = tableKey(table);
  if (storedPositions[canonical]) return storedPositions[canonical];
  if (!table.schema && storedPositions[table.name]) return storedPositions[table.name];
  return undefined;
}

const STACK_COLUMNS = 4;
const STACK_COL_WIDTH = 280;
const STACK_ROW_HEIGHT = 260;
const STACK_MARGIN = 60;

/**
 * Places tables with no stored position yet into a simple, non-overlapping
 * grid below the rest of the diagram — cheap and order-stable, unlike
 * running dagre. Used for the common "a few new tables showed up" case (see
 * `resolvePositions`) rather than `layoutSchema`'s full graph layout.
 */
function stackNewPositions(
  missing: TableSchema[],
  knownPositions: NodePosition[],
): Record<string, NodePosition> {
  const startX = knownPositions.length > 0 ? Math.min(...knownPositions.map((p) => p.x)) : STACK_MARGIN;
  const startY = knownPositions.length > 0 ? Math.max(...knownPositions.map((p) => p.y)) + STACK_ROW_HEIGHT : STACK_MARGIN;

  const result: Record<string, NodePosition> = {};
  missing.forEach((table, index) => {
    const col = index % STACK_COLUMNS;
    const row = Math.floor(index / STACK_COLUMNS);
    result[tableKey(table)] = { x: startX + col * STACK_COL_WIDTH, y: startY + row * STACK_ROW_HEIGHT };
  });
  return result;
}

/**
 * Merges auto-layout with whatever the user has already dragged into place.
 * Only tables missing a stored position get a freshly computed spot — this
 * is what keeps the diagram from jumping around on every small edit (see
 * DEVELOPMENT_PROCESS section 34 in the brief: preserve manual positions).
 * `forceRelayout` (the explicit "Auto Layout" command) discards everything
 * and recomputes from scratch.
 *
 * New tables are stacked in (see `stackNewPositions`) rather than routed
 * through a fresh `layoutSchema` dagre pass: on a large, densely
 * cross-referenced schema, `dagre.layout` alone can block the main thread
 * for a second or more (see `__bench__/largeSchema.bench.test.ts`), and
 * running it here was wasted work regardless — every already-positioned
 * table's freshly computed coordinate was thrown away by the merge anyway.
 */
export function resolvePositions(
  schema: DatabaseSchema,
  storedPositions: Record<string, NodePosition>,
  forceRelayout = false,
): Record<string, NodePosition> {
  const hasAnyStored = schema.tables.some((t) => legacyOrCanonicalPosition(storedPositions, t) !== undefined);

  if (forceRelayout || !hasAnyStored) {
    return layoutSchema(schema);
  }

  const missing = schema.tables.filter((t) => legacyOrCanonicalPosition(storedPositions, t) === undefined);
  const known = schema.tables
    .map((t) => legacyOrCanonicalPosition(storedPositions, t))
    .filter((p): p is NodePosition => p !== undefined);
  const stacked = missing.length > 0 ? stackNewPositions(missing, known) : {};

  const result: Record<string, NodePosition> = {};
  schema.tables.forEach((t) => {
    const key = tableKey(t);
    result[key] = legacyOrCanonicalPosition(storedPositions, t) ?? stacked[key] ?? { x: 0, y: 0 };
  });
  return result;
}
