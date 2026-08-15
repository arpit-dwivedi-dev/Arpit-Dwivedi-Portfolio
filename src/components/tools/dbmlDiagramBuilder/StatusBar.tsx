import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { ParserWarning } from '../../../tools/dbmlDiagramBuilder/types';

interface StatusBarProps {
  warnings: ParserWarning[];
  fatalError: string | null;
  tableCount: number;
  relationshipCount: number;
  onSelectWarning?: (line: number | undefined) => void;
}

export function StatusBar({ warnings, fatalError, tableCount, relationshipCount, onSelectWarning }: StatusBarProps) {
  if (fatalError) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 text-xs text-red-400" role="status">
        <XCircle size={13} />
        <span>Syntax error — {fatalError}</span>
      </div>
    );
  }

  if (warnings.length === 0) {
    return (
      <div className="flex items-center gap-3 px-3 py-1 text-xs text-emerald-400" role="status">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 size={13} />
          Parsed successfully
        </span>
        <span className="text-slate-500">
          {tableCount} table{tableCount === 1 ? '' : 's'} · {relationshipCount} relationship
          {relationshipCount === 1 ? '' : 's'}
        </span>
      </div>
    );
  }

  return (
    <details className="group px-3 py-1 text-xs">
      <summary className="flex items-center gap-1.5 text-amber-400 cursor-pointer list-none [&::-webkit-details-marker]:hidden" role="status">
        <AlertTriangle size={13} />
        {warnings.length} warning{warnings.length === 1 ? '' : 's'}
        <span className="text-slate-500 ml-2">
          {tableCount} table{tableCount === 1 ? '' : 's'} · {relationshipCount} relationship
          {relationshipCount === 1 ? '' : 's'}
        </span>
      </summary>
      <ul className="mt-1 max-h-32 overflow-y-auto scrollbar-thin space-y-0.5 border-t border-slate-800 pt-1">
        {warnings.map((w, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onSelectWarning?.(w.line)}
              className="text-left text-slate-400 hover:text-amber-300 w-full truncate"
            >
              {w.line ? `Line ${w.line}: ` : ''}
              {w.message}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
