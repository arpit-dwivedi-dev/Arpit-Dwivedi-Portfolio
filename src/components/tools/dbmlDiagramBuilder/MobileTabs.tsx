import { AlertTriangle } from 'lucide-react';

interface MobileTabsProps {
  active: 'editor' | 'diagram';
  onChange: (tab: 'editor' | 'diagram') => void;
  warningCount: number;
}

export function MobileTabs({ active, onChange, warningCount }: MobileTabsProps) {
  return (
    <div className="flex border-b border-slate-800 dbml-light:border-slate-200 bg-slate-950 dbml-light:bg-white shrink-0" role="tablist" aria-label="Editor or diagram view">
      {(['editor', 'diagram'] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          onClick={() => onChange(tab)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium capitalize ${
            active === tab
              ? 'text-blue-400 dbml-light:text-blue-600 border-b-2 border-blue-500'
              : 'text-slate-500 dbml-light:text-slate-400 border-b-2 border-transparent'
          }`}
        >
          {tab}
          {tab === 'editor' && warningCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
              <AlertTriangle size={10} />
              {warningCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
