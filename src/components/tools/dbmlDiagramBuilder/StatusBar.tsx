import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { ParserWarning } from '../../../tools/dbmlDiagramBuilder/types';

interface StatusBarProps {
  warnings: ParserWarning[];
  fatalError: string | null;
  tableCount: number;
  relationshipCount: number;
  onSelectWarning?: (line: number | undefined) => void;
  storageWarning?: boolean;
}

// A separate, always-appended line — storage failures are orthogonal to parse
// state (a document can fail to save whether or not it currently parses), so
// this never replaces the parse status above it.
function StorageWarningNotice() {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1 text-xs text-amber-400 border-t border-slate-800 dbml-light:border-slate-200"
      role="status"
    >
      <AlertTriangle size={13} />
      <span>Browser storage couldn't save your latest changes — your work may be lost after a refresh.</span>
    </div>
  );
}

export function StatusBar({ warnings, fatalError, tableCount, relationshipCount, onSelectWarning, storageWarning }: StatusBarProps) {
  if (fatalError) {
    return (
      <>
        <div className="flex items-center gap-1.5 px-3 py-1 text-xs text-red-400" role="status">
          <XCircle size={13} />
          <span>Syntax error — {fatalError}</span>
        </div>
        {storageWarning && <StorageWarningNotice />}
      </>
    );
  }

  // A fatal parser diagnostic (as opposed to a JS exception, handled above)
  // gets the same "Syntax error" treatment so it isn't lost in the amber
  // warnings list below.
  const fatalWarning = warnings.find((w) => w.severity === 'error');
  if (fatalWarning) {
    return (
      <>
        <button
          type="button"
          onClick={() => onSelectWarning?.(fatalWarning.line)}
          className="flex items-center gap-1.5 px-3 py-1 text-xs text-red-400 w-full text-left"
          role="status"
        >
          <XCircle size={13} />
          <span>
            Syntax error — {fatalWarning.line ? `Line ${fatalWarning.line}: ` : ''}
            {fatalWarning.message}
          </span>
        </button>
        {storageWarning && <StorageWarningNotice />}
      </>
    );
  }

  if (warnings.length === 0) {
    return (
      <>
        <div className="flex items-center gap-3 px-3 py-1 text-xs text-emerald-400" role="status">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} />
            Parsed successfully
          </span>
          <span className="text-slate-500 dbml-light:text-slate-400">
            {tableCount} table{tableCount === 1 ? '' : 's'} · {relationshipCount} relationship
            {relationshipCount === 1 ? '' : 's'}
          </span>
        </div>
        {storageWarning && <StorageWarningNotice />}
      </>
    );
  }

  return (
    <>
      <details className="group px-3 py-1 text-xs">
        <summary className="flex items-center gap-1.5 text-amber-400 cursor-pointer list-none [&::-webkit-details-marker]:hidden" role="status">
          <AlertTriangle size={13} />
          {warnings.length} warning{warnings.length === 1 ? '' : 's'}
          <span className="text-slate-500 dbml-light:text-slate-400 ml-2">
            {tableCount} table{tableCount === 1 ? '' : 's'} · {relationshipCount} relationship
            {relationshipCount === 1 ? '' : 's'}
          </span>
        </summary>
        <ul className="mt-1 max-h-32 overflow-y-auto scrollbar-thin space-y-0.5 border-t border-slate-800 dbml-light:border-slate-200 pt-1">
          {warnings.map((w, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onSelectWarning?.(w.line)}
                className="text-left text-slate-400 dbml-light:text-slate-500 hover:text-amber-300 w-full truncate"
              >
                {w.line ? `Line ${w.line}: ` : ''}
                {w.message}
              </button>
            </li>
          ))}
        </ul>
      </details>
      {storageWarning && <StorageWarningNotice />}
    </>
  );
}
