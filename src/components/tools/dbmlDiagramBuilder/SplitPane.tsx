import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { PanelLeftOpen } from 'lucide-react';

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  leftWidthPct: number;
  onLeftWidthChange: (pct: number) => void;
  collapsed: boolean;
  onExpand: () => void;
  minPct?: number;
  maxPct?: number;
}

export function SplitPane({
  left,
  right,
  leftWidthPct,
  onLeftWidthChange,
  collapsed,
  onExpand,
  minPct = 20,
  maxPct = 80,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();
      setDragging(true);
      const container = containerRef.current;
      if (!container) return;

      const handleMove = (moveEvent: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        const pct = ((moveEvent.clientX - rect.left) / rect.width) * 100;
        onLeftWidthChange(Math.min(maxPct, Math.max(minPct, pct)));
      };
      const handleUp = () => {
        setDragging(false);
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
      };
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [maxPct, minPct, onLeftWidthChange],
  );

  return (
    <div ref={containerRef} className="flex-1 flex min-h-0 min-w-0 relative">
      {!collapsed && (
        <>
          <div className="h-full min-w-0 overflow-hidden" style={{ width: `${leftWidthPct}%` }}>
            {left}
          </div>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize editor and diagram panels"
            tabIndex={0}
            onPointerDown={handlePointerDown}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') onLeftWidthChange(Math.max(minPct, leftWidthPct - 2));
              if (e.key === 'ArrowRight') onLeftWidthChange(Math.min(maxPct, leftWidthPct + 2));
            }}
            className={`w-1.5 shrink-0 cursor-col-resize relative group focus-visible:outline-none ${
              dragging ? 'bg-blue-500' : 'bg-slate-800 dbml-light:bg-slate-200 hover:bg-blue-500'
            } transition-colors`}
          >
            <span className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        </>
      )}
      <div className="h-full min-w-0 flex-1 relative">
        {right}
        {collapsed && (
          <button
            type="button"
            onClick={onExpand}
            aria-label="Show editor panel"
            title="Show editor"
            className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-md border border-slate-700 dbml-light:border-slate-200 bg-slate-900/95 dbml-light:bg-white/95 px-2 py-1.5 text-xs font-medium text-slate-300 dbml-light:text-slate-600 shadow-sm hover:bg-slate-800 dbml-light:hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <PanelLeftOpen size={14} />
            Editor
          </button>
        )}
      </div>
    </div>
  );
}
