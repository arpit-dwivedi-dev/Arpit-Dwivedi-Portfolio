import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Layers } from 'lucide-react';
import type { TableGroupNode as TableGroupNodeType } from '../../../tools/dbmlDiagramBuilder/diagram/buildGroupNodes';

/**
 * A pure background container: no handles, not draggable/selectable (set on
 * the node itself in buildGroupNodes), and `pointer-events-none` so clicks
 * and drags always fall through to the pane or the table sitting on top —
 * panning, zooming, and table dragging all behave as if this node weren't here.
 */
function TableGroupNodeImpl({ data }: NodeProps<TableGroupNodeType>) {
  const { name, note, color, tableCount } = data;
  return (
    <div
      className="relative w-full h-full rounded-xl border-2 border-dashed pointer-events-none"
      style={{ borderColor: color, background: `${color}14` }}
      title={note}
    >
      <div
        className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md font-sans text-[11px] font-semibold text-white whitespace-nowrap"
        style={{ background: color }}
      >
        <Layers size={12} className="shrink-0" />
        <span className="truncate max-w-[220px]">{name}</span>
        <span className="opacity-75">({tableCount})</span>
      </div>
    </div>
  );
}

export const TableGroupNode = memo(TableGroupNodeImpl);
