import { useState } from 'react';
import { Modal } from './Modal';
import { validateTableName } from '../../../tools/dbmlDiagramBuilder/edit/renameTable';
import type { TableRef } from '../../../tools/dbmlDiagramBuilder/schema/tableIdentity';

interface TableSettingsModalProps {
  /** The table's own (unqualified) name — this modal only edits this part, never the schema. */
  tableName: string;
  /** The table's schema prefix, `undefined` when unqualified — kept fixed by this dialog. */
  tableSchema?: string;
  /** Schema-qualified display name, e.g. "public.users", for the dialog title. */
  qualifiedName: string;
  existingRefs: TableRef[];
  /** Count of places the rename will rewrite, shown so the edit isn't a surprise. */
  referenceCount: number;
  onRename: (newName: string) => void;
  onClose: () => void;
}

export function TableSettingsModal({
  tableName,
  tableSchema,
  qualifiedName,
  existingRefs,
  referenceCount,
  onRename,
  onClose,
}: TableSettingsModalProps) {
  const [value, setValue] = useState(tableName);
  const [touched, setTouched] = useState(false);

  const validation = validateTableName(value, existingRefs, { schema: tableSchema, name: tableName });
  const unchanged = value.trim() === tableName;
  const canSubmit = validation.ok && !unchanged;

  const submit = () => {
    if (!canSubmit) return;
    onRename(value.trim());
    onClose();
  };

  return (
    <Modal
      title={`Table settings · ${qualifiedName}`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded border border-slate-700 dbml-light:border-slate-300 hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            Rename
          </button>
        </>
      }
    >
      <label htmlFor="dbml-table-name" className="block text-xs text-slate-400 dbml-light:text-slate-500 mb-1.5">
        Table Name
      </label>
      <input
        id="dbml-table-name"
        autoFocus
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setTouched(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        className="w-full px-2.5 py-2 text-sm font-mono rounded bg-slate-950 dbml-light:bg-slate-50 text-slate-100 dbml-light:text-slate-900 border border-slate-700 dbml-light:border-slate-300 focus:border-blue-500 focus:outline-none"
      />

      {touched && !validation.ok ? (
        <p className="mt-2 text-xs text-rose-400">{validation.error}</p>
      ) : (
        <p className="mt-2 text-xs text-slate-500 dbml-light:text-slate-400">
          {referenceCount > 0
            ? `Renaming updates the DBML in ${referenceCount} place${referenceCount === 1 ? '' : 's'} — the declaration plus every reference.`
            : 'Renaming rewrites the DBML in the editor.'}
        </p>
      )}
    </Modal>
  );
}
