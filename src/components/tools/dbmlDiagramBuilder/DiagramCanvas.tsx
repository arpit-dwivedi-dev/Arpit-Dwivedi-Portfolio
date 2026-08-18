import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useStore,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TableNode } from './TableNode';
import { TableGroupNode } from './TableGroupNode';
import { RelationshipEdge } from './RelationshipEdge';
import { ZoomControls } from './ZoomControls';
import { EmptyState } from './EmptyState';
import { TableActionsProvider, type TableActions } from './TableActionsContext';
import { useDbmlTheme } from './DbmlThemeContext';
import type { TableNode as TableNodeType } from '../../../tools/dbmlDiagramBuilder/diagram/buildNodes';
import type { TableGroupNode as TableGroupNodeType } from '../../../tools/dbmlDiagramBuilder/diagram/buildGroupNodes';

type CanvasNode = TableNodeType | TableGroupNodeType;

const nodeTypes = { table: TableNode, tableGroup: TableGroupNode };
const edgeTypes = { relationship: RelationshipEdge };

const widthSelector = (state: { width: number }) => state.width;

/**
 * React Flow's `fitView` prop only runs on init, and on mobile the canvas is
 * mounted `display: none` behind the Editor tab — it has no size to fit to
 * until the user opens the Diagram tab, and it can't react to tables added
 * while it was hidden. So: fit once the canvas first has a size, and again
 * whenever it is revealed showing a different set of tables than it last fit
 * to. A reveal is required, so panning/zooming on a visible canvas is never
 * yanked out from under the user.
 */
function AutoFitOnReveal({ visible, signature }: { visible: boolean; signature: string }) {
  const { fitView } = useReactFlow();
  const width = useStore(widthSelector);
  const fittedSignature = useRef<string | null>(null);
  const wasVisible = useRef(false);

  useEffect(() => {
    const justRevealed = visible && !wasVisible.current;
    wasVisible.current = visible;
    if (!visible || width === 0) return;
    const isFirstFit = fittedSignature.current === null;
    if (!isFirstFit && !(justRevealed && fittedSignature.current !== signature)) return;
    fittedSignature.current = signature;
    // One frame of slack so React Flow has applied the freshly measured
    // container size before it computes the fit.
    const frame = requestAnimationFrame(() => fitView({ padding: 0.15 }));
    return () => cancelAnimationFrame(frame);
  }, [visible, width, signature, fitView]);

  return null;
}

/** A request to pan/select a table (and optionally highlight one of its columns), e.g. from search. */
export interface DiagramFocusRequest {
  tableKey: string;
  columnId?: string;
  /** Bump on every request, including a repeat of the same target, so the effect always re-runs. */
  requestId: number;
}

// How long a search-selected column stays visibly pulsed before fading back to normal.
const COLUMN_HIGHLIGHT_MS = 2500;

interface DiagramCanvasProps {
  nodes: CanvasNode[];
  edges: Edge[];
  onNodeDragStop: (id: string, position: { x: number; y: number }) => void;
  onSelectionChange?: (tableName: string | null) => void;
  minimapVisible: boolean;
  wrapperRef: RefObject<HTMLDivElement | null>;
  isEmpty: boolean;
  tableActions: TableActions;
  /** False while the canvas is hidden behind the mobile Editor tab. */
  visible?: boolean;
  /** Set (e.g. from search) to pan to and select a table, optionally highlighting one column. */
  focusRequest?: DiagramFocusRequest | null;
}

export function DiagramCanvas({
  nodes: propNodes,
  edges: propEdges,
  onNodeDragStop,
  onSelectionChange,
  minimapVisible,
  wrapperRef,
  isEmpty,
  tableActions,
  visible = true,
  focusRequest,
}: DiagramCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>(propNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(propEdges);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [focusedTableKey, setFocusedTableKey] = useState<string | null>(null);
  const [highlightedColumn, setHighlightedColumn] = useState<{ tableKey: string; columnId: string } | null>(null);
  const theme = useDbmlTheme();
  const { fitView } = useReactFlow();

  // Caches the last rendered node per base `propNodes` entry + focus flags, so
  // a table whose flags didn't actually change keeps the exact same object
  // reference across a re-run of this effect. On a large schema, hovering
  // (which never touches focusedTableKey/highlightedColumn) previously still
  // rebuilt every node's `data` object here, and since TableNode is
  // `memo()`-ed on props, that spurious new reference defeated the memo and
  // re-rendered every table on the canvas.
  const nodeCacheRef = useRef(new Map<string, { base: CanvasNode; focused: boolean; highlightedColumnId: string | undefined; rendered: CanvasNode }>());

  useEffect(() => {
    const cache = nodeCacheRef.current;
    const nextCache = new Map<string, { base: CanvasNode; focused: boolean; highlightedColumnId: string | undefined; rendered: CanvasNode }>();
    const nextNodes = propNodes.map((n) => {
      if (n.type !== 'table') return n;
      const tableNode = n as TableNodeType;
      const focused = tableNode.id === focusedTableKey;
      const highlightedColumnId =
        highlightedColumn && tableNode.id === highlightedColumn.tableKey ? highlightedColumn.columnId : undefined;
      const cached = cache.get(tableNode.id);
      if (cached && cached.base === n && cached.focused === focused && cached.highlightedColumnId === highlightedColumnId) {
        nextCache.set(tableNode.id, cached);
        return cached.rendered;
      }
      const rendered: CanvasNode = {
        ...tableNode,
        data: { ...tableNode.data, searchFocused: focused, highlightedColumnId },
      };
      nextCache.set(tableNode.id, { base: n, focused, highlightedColumnId, rendered });
      return rendered;
    });
    nodeCacheRef.current = nextCache;
    setNodes(nextNodes);
  }, [propNodes, focusedTableKey, highlightedColumn, setNodes]);

  // One-shot reaction to a focus request: pan/zoom the target table into
  // view, mark it search-focused, and — for a column target — pulse that row
  // for a few seconds. `requestId` (not just the target) is the dependency so
  // re-selecting the same result from search re-runs the pan/pulse.
  useEffect(() => {
    if (!focusRequest) return;
    setFocusedTableKey(focusRequest.tableKey);
    setHighlightedColumn(focusRequest.columnId ? { tableKey: focusRequest.tableKey, columnId: focusRequest.columnId } : null);

    // One frame of slack so a just-revealed (e.g. mobile tab switch) canvas
    // has its real size before fitView computes the target viewport.
    const frame = requestAnimationFrame(() => {
      fitView({ nodes: [{ id: focusRequest.tableKey }], duration: 400, padding: 0.4, maxZoom: 1.25 });
    });
    const highlightTimer = focusRequest.columnId
      ? window.setTimeout(() => setHighlightedColumn(null), COLUMN_HIGHLIGHT_MS)
      : undefined;

    return () => {
      cancelAnimationFrame(frame);
      if (highlightTimer) window.clearTimeout(highlightTimer);
    };
    // Deliberately keyed on requestId alone (not the whole focusRequest
    // object or its tableKey/columnId) — those are read from the ref-stable
    // closure above and only need to matter when a new request comes in.
  }, [focusRequest?.requestId, fitView]);

  // Re-flag every edge's `highlighted` data whenever the source list or the
  // hover target changes — hovering a table or a relationship line lights up
  // that connection (brighter, thicker, faster-flowing dots) so it's obvious
  // at a glance which columns a reference actually connects.
  //
  // Only edges whose base object or highlighted flag actually changed get a
  // new object reference — RelationshipEdge is `memo()`-ed, so on a schema
  // with hundreds of relationships this is what keeps a single hover from
  // re-rendering every edge on the canvas instead of just the 1-2 affected.
  const edgeCacheRef = useRef(new Map<string, { base: Edge; highlighted: boolean; rendered: Edge }>());

  useEffect(() => {
    const cache = edgeCacheRef.current;
    const nextCache = new Map<string, { base: Edge; highlighted: boolean; rendered: Edge }>();
    const nextEdges = propEdges.map((edge) => {
      const highlighted = edge.id === hoveredEdgeId || edge.source === hoveredNodeId || edge.target === hoveredNodeId;
      const cached = cache.get(edge.id);
      if (cached && cached.base === edge && cached.highlighted === highlighted) {
        nextCache.set(edge.id, cached);
        return cached.rendered;
      }
      const rendered: Edge = { ...edge, data: { ...edge.data, highlighted } };
      nextCache.set(edge.id, { base: edge, highlighted, rendered });
      return rendered;
    });
    edgeCacheRef.current = nextCache;
    setEdges(nextEdges);
  }, [propEdges, hoveredNodeId, hoveredEdgeId, setEdges]);

  return (
    <TableActionsProvider value={tableActions}>
    <div ref={wrapperRef} className="dbml-canvas relative w-full h-full bg-slate-900 dbml-light:bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={(_event, node) => onNodeDragStop(node.id, node.position)}
        onSelectionChange={({ nodes: selected }) => onSelectionChange?.(selected[0]?.id ?? null)}
        onNodeMouseEnter={(_event, node) => setHoveredNodeId(node.id)}
        onNodeMouseLeave={() => setHoveredNodeId(null)}
        onEdgeMouseEnter={(_event, edge) => setHoveredEdgeId(edge.id)}
        onEdgeMouseLeave={() => setHoveredEdgeId(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.05}
        maxZoom={2}
        multiSelectionKeyCode={['Meta', 'Shift']}
        defaultEdgeOptions={{ type: 'relationship' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={theme === 'dark' ? '#334155' : '#cbd5e1'} />
        {minimapVisible && (
          <MiniMap
            pannable
            zoomable
            className="!bg-slate-900 dbml-light:!bg-white !border !border-slate-700 dbml-light:!border-slate-200 rounded-md"
            maskColor={theme === 'dark' ? 'rgba(2, 6, 23, 0.6)' : 'rgba(241, 245, 249, 0.6)'}
            nodeColor={(n) => (n.data as { color?: string }).color || '#2563eb'}
          />
        )}
        <ZoomControls />
        <AutoFitOnReveal visible={visible} signature={propNodes.map((n) => n.id).join('|')} />
      </ReactFlow>
      {isEmpty && <EmptyState />}
    </div>
    </TableActionsProvider>
  );
}
