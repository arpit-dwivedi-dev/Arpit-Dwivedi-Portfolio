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
import { RelationshipEdge } from './RelationshipEdge';
import { ZoomControls } from './ZoomControls';
import { EmptyState } from './EmptyState';
import { TableActionsProvider, type TableActions } from './TableActionsContext';
import type { TableNode as TableNodeType, TableNodeData } from '../../../tools/dbmlDiagramBuilder/diagram/buildNodes';

const nodeTypes = { table: TableNode };
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

interface DiagramCanvasProps {
  nodes: TableNodeType[];
  edges: Edge[];
  onNodeDragStop: (id: string, position: { x: number; y: number }) => void;
  onSelectionChange?: (tableName: string | null) => void;
  minimapVisible: boolean;
  wrapperRef: RefObject<HTMLDivElement | null>;
  isEmpty: boolean;
  tableActions: TableActions;
  /** False while the canvas is hidden behind the mobile Editor tab. */
  visible?: boolean;
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
}: DiagramCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<TableNodeType>(propNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(propEdges);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  useEffect(() => setNodes(propNodes), [propNodes, setNodes]);

  // Re-flag every edge's `highlighted` data whenever the source list or the
  // hover target changes — hovering a table or a relationship line lights up
  // that connection (brighter, thicker, faster-flowing dots) so it's obvious
  // at a glance which columns a reference actually connects.
  useEffect(() => {
    setEdges(
      propEdges.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          highlighted: edge.id === hoveredEdgeId || edge.source === hoveredNodeId || edge.target === hoveredNodeId,
        },
      })),
    );
  }, [propEdges, hoveredNodeId, hoveredEdgeId, setEdges]);

  return (
    <TableActionsProvider value={tableActions}>
    <div ref={wrapperRef} className="relative w-full h-full bg-white">
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
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
        {minimapVisible && (
          <MiniMap
            pannable
            zoomable
            className="!bg-white !border !border-slate-200 rounded-md"
            nodeColor={(n) => (n.data as TableNodeData).color || '#2563eb'}
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
