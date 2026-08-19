import { useEffect, useMemo, useState } from 'react';
import { folderPath } from '../../../tools/apiRequestBuilder/collections';
import type { Collection, Folder } from '../../../tools/apiRequestBuilder/collections';
import type { SavedRequest } from '../../../tools/apiRequestBuilder/types';
import { Modal } from './Modal';
import { fieldClass, labelClass, selectTriggerClass } from './sharedClasses';
import { Select } from '../../ui/Select';

interface MoveRequestModalProps {
  open: boolean;
  onClose: () => void;
  /** The saved request being relocated — null closes/hides the modal's content, matching how
   *  every other "act on a specific item" modal in this tool is driven from the outside. */
  request: SavedRequest | null;
  collections: Collection[];
  folders: Folder[];
  onMove: (id: string, collectionId: string, folderId: string | null) => void;
}

export const MoveRequestModal = ({ open, onClose, request, collections, folders, onMove }: MoveRequestModalProps) => {
  const [collectionId, setCollectionId] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !request) return;
    setCollectionId(request.collectionId);
    setFolderId(request.folderId);
  }, [open, request]);

  const folderOptions = useMemo(
    () =>
      folders
        .filter((f) => f.collectionId === collectionId)
        .map((f) => ({ id: f.id, label: folderPath(folders, f.id) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [folders, collectionId],
  );

  if (!request) return null;

  const handleCollectionChange = (nextCollectionId: string) => {
    setCollectionId(nextCollectionId);
    setFolderId(null);
  };

  const unchanged = collectionId === request.collectionId && folderId === request.folderId;

  const handleMove = () => {
    onMove(request.id, collectionId, folderId);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} titleId="move-request-heading" title={`Move "${request.name}"`} maxWidthClassName="max-w-sm">
      <p className="text-xs text-secondary-text mb-3 leading-snug">
        Only the request's location changes — its method, URL, headers, body, and any{' '}
        <code className="font-mono text-ink">{'{{variables}}'}</code> stay exactly as they are.
      </p>

      <label htmlFor="move-request-collection" className={`${labelClass} block mb-1.5`}>
        Collection
      </label>
      <Select
        id="move-request-collection"
        value={collectionId}
        onChange={handleCollectionChange}
        options={collections.map((c) => ({ value: c.id, label: c.name }))}
        className="mb-3"
        triggerClassName={selectTriggerClass}
      />

      <label htmlFor="move-request-folder" className={`${labelClass} block mb-1.5`}>
        Folder
      </label>
      <Select
        id="move-request-folder"
        value={folderId ?? ''}
        onChange={(id) => setFolderId(id || null)}
        options={[
          { value: '', label: 'Collection root (no folder)' },
          ...folderOptions.map((f) => ({ value: f.id, label: f.label })),
        ]}
        triggerClassName={selectTriggerClass}
      />

      <div className="flex justify-end gap-2 mt-5">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium text-secondary-text hover:text-ink transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleMove}
          disabled={unchanged}
          className="px-4 py-2 rounded-lg text-sm font-bold bg-accent-blue text-bg-pure hover:glow-blue transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          Move
        </button>
      </div>
    </Modal>
  );
};
