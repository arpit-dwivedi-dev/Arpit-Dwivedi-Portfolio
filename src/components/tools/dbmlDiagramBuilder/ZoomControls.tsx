import { Panel, useReactFlow, useStore } from '@xyflow/react';
import { Maximize2, Minus, Plus } from 'lucide-react';

const zoomSelector = (state: { transform: [number, number, number] }) => state.transform[2];

export function ZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const zoom = useStore(zoomSelector);

  return (
    <Panel position="bottom-left">
      <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white/95 backdrop-blur px-1 py-1 shadow-sm text-slate-600">
        <button
          type="button"
          onClick={() => zoomOut({ duration: 150 })}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          aria-label="Zoom out"
          title="Zoom out"
        >
          <Minus size={14} />
        </button>
        <span className="w-11 text-center text-xs tabular-nums select-none" aria-live="polite">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomIn({ duration: 150 })}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          aria-label="Zoom in"
          title="Zoom in"
        >
          <Plus size={14} />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-0.5" />
        <button
          type="button"
          onClick={() => fitView({ duration: 250, padding: 0.15 })}
          className="h-7 px-2 flex items-center gap-1 rounded hover:bg-slate-100 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          aria-label="Fit diagram to screen"
          title="Fit to screen"
        >
          <Maximize2 size={13} />
          Fit
        </button>
      </div>
    </Panel>
  );
}
