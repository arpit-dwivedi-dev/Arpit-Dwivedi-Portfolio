import { Plus, Trash2, Paperclip } from 'lucide-react';
import type { FormField } from '../../../tools/apiRequestBuilder/types';
import { fieldClass } from './sharedClasses';

interface FormFieldsEditorProps {
  fields: FormField[];
  allowFiles: boolean;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<FormField>) => void;
  onRemove: (id: string) => void;
}

export const FormFieldsEditor = ({ fields, allowFiles, onAdd, onUpdate, onRemove }: FormFieldsEditorProps) => (
  <div className="space-y-2">
    {fields.length === 0 && <p className="text-sm text-secondary-text py-2">No fields yet — add one below.</p>}

    {fields.map((field, idx) => (
      <div key={field.id} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={field.enabled}
          onChange={(e) => onUpdate(field.id, { enabled: e.target.checked })}
          aria-label={`Enable field ${idx + 1}`}
          className="size-4 shrink-0 rounded border-ink/20 accent-accent-blue cursor-pointer"
        />
        <input
          type="text"
          value={field.key}
          onChange={(e) => onUpdate(field.id, { key: e.target.value })}
          placeholder="Key"
          aria-label={`Field ${idx + 1} key`}
          className={`${fieldClass} flex-1 ${!field.enabled ? 'opacity-50' : ''}`}
        />

        {field.isFile ? (
          <label
            className={`${fieldClass} flex-1 flex items-center gap-2 cursor-pointer ${!field.enabled ? 'opacity-50' : ''}`}
          >
            <Paperclip size={13} aria-hidden="true" className="shrink-0 text-secondary-text" />
            <span className="truncate">{field.fileName ?? 'Choose file…'}</span>
            <input
              type="file"
              className="sr-only"
              aria-label={`Field ${idx + 1} file`}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpdate(field.id, { file, fileName: file.name, value: file.name });
              }}
            />
          </label>
        ) : (
          <input
            type="text"
            value={field.value}
            onChange={(e) => onUpdate(field.id, { value: e.target.value })}
            placeholder="Value"
            aria-label={`Field ${idx + 1} value`}
            className={`${fieldClass} flex-1 ${!field.enabled ? 'opacity-50' : ''}`}
          />
        )}

        {allowFiles && (
          <button
            type="button"
            onClick={() => onUpdate(field.id, { isFile: !field.isFile, file: undefined, fileName: undefined, value: '' })}
            aria-pressed={field.isFile}
            title={field.isFile ? 'Switch to text value' : 'Switch to file value'}
            className={`shrink-0 p-2 rounded-lg transition-colors ${
              field.isFile ? 'text-accent-blue bg-accent-blue/10' : 'text-secondary-text hover:bg-ink/10'
            }`}
          >
            <Paperclip size={15} aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          onClick={() => onRemove(field.id)}
          aria-label={`Delete field ${idx + 1}`}
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
      Add field
    </button>
  </div>
);
