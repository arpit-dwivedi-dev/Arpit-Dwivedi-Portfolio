import { useState } from 'react';
import { Modal } from './Modal';
import { validateTableName } from '../../../tools/dbmlDiagramBuilder/edit/renameTable';

interface TableSettingsModalProps {
  tableName: string;
  existingNames: string[];
  /** Count of places the rename will rewrite, shown so the edit isn't a surprise. */
  referenceCount: number;
  onRename: (newName: string) => void;
  onClose: () => void;
}

export function TableSettingsModal({
  tableName,
  existingNames,
  referenceCount,
  onRename,
  onClose,
}: TableSettingsModalProps) {
  const [value, setValue] = useState(tableName);
  const [touched, setTouched] = useState(false);

  const validation = validateTableName(value, existingNames, tableName);
  const unchanged = value.trim() === tableName;
  const canSubmit = validation.ok && !unchanged;

  const submit = () => {
    if (!canSubmit) return;
    onRename(value.trim());
    onClose();
  };

  return (
    <Modal
      title={`Table settings · ${tableName}`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded border border-slate-700 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
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
      <label htmlFor="dbml-table-name" className="block text-xs text-slate-400 mb-1.5">
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
        className="w-full px-2.5 py-2 text-sm font-mono rounded bg-slate-950 border border-slate-700 focus:border-blue-500 focus:outline-none"
      />

      {touched && !validation.ok ? (
        <p className="mt-2 text-xs text-rose-400">{validation.error}</p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          {referenceCount > 0
            ? `Renaming updates the DBML in ${referenceCount} place${referenceCount === 1 ? '' : 's'} — the declaration plus every reference.`
            : 'Renaming rewrites the DBML in the editor.'}
        </p>
      )}
    </Modal>
  );
}
