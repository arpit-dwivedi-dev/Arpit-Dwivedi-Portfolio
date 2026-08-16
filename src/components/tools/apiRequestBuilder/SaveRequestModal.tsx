import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ShieldOff } from 'lucide-react';
import { folderPath } from '../../../tools/apiRequestBuilder/collections';
import type { Collection, Folder } from '../../../tools/apiRequestBuilder/collections';
import { Modal } from './Modal';
import { fieldClass, labelClass } from './sharedClasses';

interface SaveRequestModalProps {
  open: boolean;
  onClose: () => void;
  initialName: string;
  onSave: (name: string, collectionId: string, folderId: string | null) => void;
  hasSecrets: boolean;
  collections: Collection[];
  folders: Folder[];
  /** Seeds the Collection/Folder selects — the request's current location when updating an
   *  existing saved request, otherwise a sensible default (the first/only collection). */
  defaultCollectionId: string;
  defaultFolderId: string | null;
}

export const SaveRequestModal = ({
  open,
  onClose,
  initialName,
  onSave,
  hasSecrets,
  collections,
  folders,
  defaultCollectionId,
  defaultFolderId,
}: SaveRequestModalProps) => {
  const [name, setName] = useState(initialName);
  const [collectionId, setCollectionId] = useState(defaultCollectionId);
  const [folderId, setFolderId] = useState<string | null>(defaultFolderId);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setCollectionId(defaultCollectionId);
    setFolderId(defaultFolderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Folders are scoped to a collection — switching Collection resets Folder back to "root"
  // rather than silently keeping a folder id that belongs to the collection just left.
  const handleCollectionChange = (nextCollectionId: string) => {
    setCollectionId(nextCollectionId);
    setFolderId(null);
  };

  const folderOptions = useMemo(
    () =>
      folders
        .filter((f) => f.collectionId === collectionId)
        .map((f) => ({ id: f.id, label: folderPath(folders, f.id) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [folders, collectionId],
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, collectionId, folderId);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} titleId="save-request-heading" title="Save request" maxWidthClassName="max-w-sm">
      <form onSubmit={handleSubmit}>
        {hasSecrets && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-400/25 bg-amber-400/5 p-2 sm:p-2.5 mb-3 text-xs text-amber-400/90 leading-snug">
            <ShieldOff size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong className="text-amber-300">Auth secrets aren't saved.</strong> The bearer token, password, or API key
              value on this request is stripped before it's stored — you'll need to re-enter it after loading this saved
              request.
            </p>
          </div>
        )}
        <label htmlFor="save-request-name" className={`${labelClass} block mb-1.5`}>
          Name
        </label>
        <input
          id="save-request-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Get Users"
          className={`${fieldClass} mb-3`}
        />

        <label htmlFor="save-request-collection" className={`${labelClass} block mb-1.5`}>
          Collection
        </label>
        <select
          id="save-request-collection"
          value={collectionId}
          onChange={(e) => handleCollectionChange(e.target.value)}
          className={`${fieldClass} mb-3`}
        >
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label htmlFor="save-request-folder" className={`${labelClass} block mb-1.5`}>
          Folder
        </label>
        <select
          id="save-request-folder"
          value={folderId ?? ''}
          onChange={(e) => setFolderId(e.target.value || null)}
          className={fieldClass}
        >
          <option value="">Collection root (no folder)</option>
          {folderOptions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-secondary-text hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-accent-blue text-bg-pure hover:glow-blue transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
};
