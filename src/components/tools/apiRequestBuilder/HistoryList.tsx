import { Trash2 } from 'lucide-react';
import type { HistoryEntry } from '../../../tools/apiRequestBuilder/types';
import { METHOD_COLORS, statusColor } from './sharedClasses';

interface HistoryListProps {
  entries: HistoryEntry[];
  onLoad: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export const HistoryList = ({ entries, onLoad, onDelete, onClear }: HistoryListProps) => {
  if (entries.length === 0) {
    return <p className="text-sm text-secondary-text p-5">No requests sent yet — your history will show up here.</p>;
  }

  return (
    <div>
      <div className="flex justify-end px-4 pt-3">
        <button type="button" onClick={onClear} className="text-xs font-mono text-secondary-text hover:text-red-400 transition-colors">
          Clear all
        </button>
      </div>
      <ul className="p-2 space-y-1">
        {entries.map((entry) => (
          <li key={entry.id} className="group flex items-center gap-2 rounded-lg hover:bg-ink/5 transition-colors">
            <button type="button" onClick={() => onLoad(entry)} className="flex-1 min-w-0 text-left px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className={`font-bold ${METHOD_COLORS[entry.request.method]}`}>{entry.request.method}</span>
                {entry.status !== undefined ? (
                  <span className={statusColor(entry.status)}>{entry.status}</span>
                ) : (
                  <span className="text-red-400">Failed</span>
                )}
                <span className="text-secondary-text ml-auto">{new Date(entry.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-sm text-ink truncate mt-0.5">{entry.request.url || '(no URL)'}</p>
            </button>
            <button
              type="button"
              onClick={() => onDelete(entry.id)}
              aria-label="Delete history entry"
              className="shrink-0 p-2 mr-1 rounded-lg text-secondary-text hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
