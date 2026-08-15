import { useState } from 'react';
import { Check, Copy, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Modal } from './Modal';
import type { DbmlDocument } from '../../../tools/dbmlDiagramBuilder/types';

interface DocumentsModalProps {
  documents: DbmlDocument[];
  activeId: string;
  onSwitch: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function DocumentRow({
  doc,
  active,
  onSwitch,
  onRename,
  onDuplicate,
  onDelete,
  canDelete,
}: {
  doc: DbmlDocument;
  active: boolean;
  onSwitch: () => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(doc.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onRename(trimmed);
    setEditing(false);
  };

  return (
    <li
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${active ? 'bg-blue-600/15 border border-blue-600/40' : 'border border-transparent hover:bg-slate-800'}`}
    >
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="flex-1 min-w-0 bg-slate-800 rounded px-2 py-1 text-sm outline outline-1 outline-blue-500"
        />
      ) : (
        <button type="button" onClick={onSwitch} className="flex-1 min-w-0 text-left text-sm truncate py-0.5">
          {doc.name}
        </button>
      )}

      <div className="flex items-center gap-0.5 shrink-0">
        {confirmingDelete ? (
          <>
            <span className="text-[11px] text-red-400 mr-1">Delete?</span>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Confirm delete ${doc.name}`}
              className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:bg-red-500/20"
            >
              <Check size={13} />
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              aria-label="Cancel delete"
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-700"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={`Rename ${doc.name}`}
              title="Rename"
              className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={onDuplicate}
              aria-label={`Duplicate ${doc.name}`}
              title="Duplicate"
              className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            >
              <Copy size={13} />
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                aria-label={`Delete ${doc.name}`}
                title="Delete"
                className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-red-500/20 hover:text-red-400"
              >
                <Trash2 size={13} />
              </button>
            )}
          </>
        )}
      </div>
    </li>
  );
}

export function DocumentsModal({
  documents,
  activeId,
  onSwitch,
  onNew,
  onRename,
  onDuplicate,
  onDelete,
  onClose,
}: DocumentsModalProps) {
  return (
    <Modal
      title="Documents"
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white"
        >
          <Plus size={14} />
          New diagram
        </button>
      }
    >
      <ul className="space-y-1">
        {documents.map((doc) => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            active={doc.id === activeId}
            canDelete={documents.length > 1}
            onSwitch={() => {
              onSwitch(doc.id);
              onClose();
            }}
            onRename={(name) => onRename(doc.id, name)}
            onDuplicate={() => onDuplicate(doc.id)}
            onDelete={() => onDelete(doc.id)}
          />
        ))}
      </ul>
    </Modal>
  );
}
