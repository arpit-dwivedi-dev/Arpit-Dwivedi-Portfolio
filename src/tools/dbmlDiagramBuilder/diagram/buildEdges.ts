import { MarkerType, type Edge } from '@xyflow/react';
import type { DatabaseSchema, NodePosition, RelationKind } from '../types';
import { columnHandleId } from './handles';
import { HEADER_HEIGHT, ROW_HEIGHT, computeNodeSize } from './layout';

const CARDINALITY_LABEL: Record<RelationKind, string> = {
  'one-to-one': '1 – 1',
  'one-to-many': '1 – *',
  'many-to-one': '* – 1',
  'many-to-many': '* – *',
  unknown: '',
};

/**
 * A step-path edge bends at the midpoint between its source and target X, so
 * any two edges whose midpoints land close together share the same vertical
 * corridor. Where their vertical spans also overlap, the two bends draw on top
 * of each other and read as one line joining tables that aren't related at all.
 *
 * The grouping below is deliberately by *corridor*, not by target table: edges
 * pointing at completely different tables still collide whenever dagre puts
 * their source tables in the same rank (which it does for every sibling table),
 * so keying on the target misses exactly the case that looks broken.
 */
const CORRIDOR_TOLERANCE = 44;
const MAX_LANE_GAP = 24;
const MAX_TOTAL_SPREAD = 80;

interface EdgeSpec {
  edge: Edge;
  /** X of the edge's natural bend — matches getSmoothStepPath's default. */
  bendX: number;
  /** Vertical extent the edge occupies, used to skip non-colliding pairs. */
  spanTop: number;
  spanBottom: number;
}

function columnCenterY(pos: NodePosition, columnIndex: number): number {
  return pos.y + HEADER_HEIGHT + Math.max(0, columnIndex) * ROW_HEIGHT + ROW_HEIGHT / 2;
}

export function buildEdges(schema: DatabaseSchema, positions: Record<string, NodePosition>): Edge[] {
  const tableByName = new Map(schema.tables.map((t) => [t.name, t]));

  const specs: EdgeSpec[] = schema.relationships
    .filter((rel) => tableByName.has(rel.sourceTable) && tableByName.has(rel.targetTable))
    .map((rel) => {
      const sourceTable = tableByName.get(rel.sourceTable)!;
      const targetTable = tableByName.get(rel.targetTable)!;
      const sourceColIndex = sourceTable.columns.findIndex((c) => c.name === rel.sourceColumn);
      const targetColIndex = targetTable.columns.findIndex((c) => c.name === rel.targetColumn);
      const sourceCol = sourceColIndex >= 0 ? sourceTable.columns[sourceColIndex] : undefined;
      const targetCol = targetColIndex >= 0 ? targetTable.columns[targetColIndex] : undefined;
      const sourcePos = positions[rel.sourceTable] ?? { x: 0, y: 0 };
      const targetPos = positions[rel.targetTable] ?? { x: 0, y: 0 };
      const sourceWidth = computeNodeSize(sourceTable).width;
      const targetWidth = computeNodeSize(targetTable).width;

      // A self-reference has no "other side" to aim at — docking it left-to-right
      // would wrap the line around the whole table, so keep both ends on the right.
      const isSelfRef = rel.sourceTable === rel.targetTable;
      // Compare centers rather than left edges: two tables of different widths can
      // have sourcePos.x < targetPos.x while the source still sits visually right.
      const sourceIsLeftOfTarget =
        isSelfRef || sourcePos.x + sourceWidth / 2 <= targetPos.x + targetWidth / 2;

      const sourceSide = sourceIsLeftOfTarget ? 'right' : 'left';
      const targetSide = isSelfRef ? 'right' : sourceIsLeftOfTarget ? 'left' : 'right';

      const sourceColId = sourceCol?.id ?? `${sourceTable.id}__${rel.sourceColumn}`;
      const targetColId = targetCol?.id ?? `${targetTable.id}__${rel.targetColumn}`;

      const sourceX = sourceIsLeftOfTarget ? sourcePos.x + sourceWidth : sourcePos.x;
      const targetX = isSelfRef
        ? targetPos.x + targetWidth
        : sourceIsLeftOfTarget
          ? targetPos.x
          : targetPos.x + targetWidth;
      const sourceY = columnCenterY(sourcePos, sourceColIndex);
      const targetY = columnCenterY(targetPos, targetColIndex);

      const edge: Edge = {
        id: rel.id,
        source: rel.sourceTable,
        target: rel.targetTable,
        sourceHandle: columnHandleId(sourceColId, sourceSide, 'source'),
        targetHandle: columnHandleId(targetColId, targetSide, 'target'),
        type: 'relationship',
        label: CARDINALITY_LABEL[rel.relation],
        labelStyle: { fill: '#64748b', fontSize: 10, fontWeight: 600 },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
        labelBgPadding: [4, 2] as [number, number],
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#94a3b8' },
        style: { strokeWidth: 1.5, stroke: '#94a3b8' },
      };

      return {
        edge,
        // Self-refs route on one side and never take the shared corridor, so park
        // them far away rather than letting them perturb a real cluster.
        bendX: isSelfRef ? Number.POSITIVE_INFINITY : (sourceX + targetX) / 2,
        spanTop: Math.min(sourceY, targetY),
        spanBottom: Math.max(sourceY, targetY),
      };
    });

  assignLanes(specs);

  return specs.map((spec) => spec.edge);
}

/**
 * Clusters edges that share a vertical corridor *and* overlap vertically, then
 * fans each cluster out around its centre so no two bends coincide.
 */
function assignLanes(specs: EdgeSpec[]): void {
  const routable = specs
    .filter((spec) => Number.isFinite(spec.bendX))
    .sort((a, b) => a.bendX - b.bendX);

  let cluster: EdgeSpec[] = [];

  const flush = () => {
    if (cluster.length > 1) {
      const gap = Math.min(MAX_LANE_GAP, MAX_TOTAL_SPREAD / (cluster.length - 1));
      // Order by vertical position so lanes read top-to-bottom instead of
      // crossing each other on the way into the corridor.
      const ordered = [...cluster].sort(
        (a, b) => (a.spanTop + a.spanBottom) / 2 - (b.spanTop + b.spanBottom) / 2,
      );
      ordered.forEach((spec, index) => {
        const laneOffset = (index - (ordered.length - 1) / 2) * gap;
        spec.edge.data = { ...spec.edge.data, laneOffset };
      });
    }
    cluster = [];
  };

  routable.forEach((spec) => {
    const sharesCorridor =
      cluster.length > 0 && Math.abs(spec.bendX - cluster[0].bendX) <= CORRIDOR_TOLERANCE;
    // Two edges only actually draw over each other if their vertical spans
    // meet; disjoint ones can safely keep the corridor's centre line.
    const overlapsVertically = cluster.some(
      (other) => spec.spanTop <= other.spanBottom && other.spanTop <= spec.spanBottom,
    );

    if (sharesCorridor && overlapsVertically) {
      cluster.push(spec);
    } else {
      flush();
      cluster = [spec];
    }
  });

  flush();
}
