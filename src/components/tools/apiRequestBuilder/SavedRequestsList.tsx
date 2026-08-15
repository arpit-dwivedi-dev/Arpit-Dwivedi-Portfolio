import { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import type { SavedRequest } from '../../../tools/apiRequestBuilder/types';
import { METHOD_COLORS } from './sharedClasses';

interface SavedRequestsListProps {
  items: SavedRequest[];
  onLoad: (item: SavedRequest) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export const SavedRequestsList = ({ items, onLoad, onRename, onDelete }: SavedRequestsListProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  if (items.length === 0) {
    return <p className="text-sm text-secondary-text p-5">No saved requests yet — use Save (Ctrl/Cmd+S) to keep one here.</p>;
  }

  const startEditing = (item: SavedRequest) => {
    setEditingId(item.id);
    setDraftName(item.name);
  };

  const commitEdit = (id: string) => {
    const trimmed = draftName.trim();
    if (trimmed) onRename(id, trimmed);
    setEditingId(null);
  };

  return (
    <ul className="p-2 space-y-1">
      {items.map((item) => (
        <li key={item.id} className="group rounded-lg hover:bg-ink/5 transition-colors">
          {editingId === item.id ? (
            <div className="flex items-center gap-1.5 px-3 py-2">
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit(item.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                aria-label="Saved request name"
                className="flex-1 min-w-0 bg-ink/5 border border-accent-blue rounded-md px-2 py-1 text-sm text-ink focus:outline-none"
              />
              <button type="button" onClick={() => commitEdit(item.id)} aria-label="Confirm rename" className="p-1.5 text-emerald-400">
                <Check size={15} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => setEditingId(null)} aria-label="Cancel rename" className="p-1.5 text-secondary-text">
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => onLoad(item)} className="flex-1 min-w-0 text-left px-3 py-2.5">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className={`font-bold ${METHOD_COLORS[item.request.method]}`}>{item.request.method}</span>
                </div>
                <p className="text-sm text-ink truncate mt-0.5">{item.name}</p>
                <p className="text-xs text-secondary-text truncate">{item.request.url}</p>
              </button>
              <button
                type="button"
                onClick={() => startEditing(item)}
                aria-label="Rename saved request"
                className="shrink-0 p-2 rounded-lg text-secondary-text opacity-0 group-hover:opacity-100 hover:text-ink hover:bg-ink/10 transition-all"
              >
                <Pencil size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                aria-label="Delete saved request"
                className="shrink-0 p-2 mr-1 rounded-lg text-secondary-text opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};
