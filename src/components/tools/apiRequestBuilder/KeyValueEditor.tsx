import { Plus, Trash2 } from 'lucide-react';
import type { RequestHeader, RequestParameter } from '../../../tools/apiRequestBuilder/types';
import { fieldClass } from './sharedClasses';

interface Row extends Pick<RequestParameter | RequestHeader, 'id' | 'key' | 'value' | 'enabled'> {}

interface KeyValueEditorProps {
  rows: Row[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Row>) => void;
  onRemove: (id: string) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel: string;
  emptyLabel: string;
  rowLabel: string;
}

export const KeyValueEditor = ({
  rows,
  onAdd,
  onUpdate,
  onRemove,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  addLabel,
  emptyLabel,
  rowLabel,
}: KeyValueEditorProps) => (
  <div className="space-y-2">
    {rows.length === 0 && <p className="text-sm text-secondary-text py-2">{emptyLabel}</p>}

    {rows.map((row, idx) => (
      <div key={row.id} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={row.enabled}
          onChange={(e) => onUpdate(row.id, { enabled: e.target.checked })}
          aria-label={`Enable ${rowLabel} ${idx + 1}`}
          className="size-4 shrink-0 rounded border-ink/20 accent-accent-blue cursor-pointer"
        />
        <input
          type="text"
          value={row.key}
          onChange={(e) => onUpdate(row.id, { key: e.target.value })}
          placeholder={keyPlaceholder}
          aria-label={`${rowLabel} ${idx + 1} key`}
          className={`${fieldClass} flex-1 ${!row.enabled ? 'opacity-50' : ''}`}
        />
        <input
          type="text"
          value={row.value}
          onChange={(e) => onUpdate(row.id, { value: e.target.value })}
          placeholder={valuePlaceholder}
          aria-label={`${rowLabel} ${idx + 1} value`}
          className={`${fieldClass} flex-1 ${!row.enabled ? 'opacity-50' : ''}`}
        />
        <button
          type="button"
          onClick={() => onRemove(row.id)}
          aria-label={`Delete ${rowLabel} ${idx + 1}`}
          className="shrink-0 p-2 rounded-lg text-secondary-text hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>
    ))}

    <button
      type="button"
      onClick={onAdd}
      className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-accent-blue hover:text-accent-blue/80 transition-colors mt-1"
    >
      <Plus size={14} aria-hidden="true" />
      {addLabel}
    </button>
  </div>
);
