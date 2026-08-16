import { useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileUp,
  Folder as FolderIcon,
  FolderPlus,
  Move,
  Pencil,
  Share2,
  Trash2,
  Upload,
  Plus,
  X,
} from 'lucide-react';
import { canCreateSubfolder, MAX_FOLDER_DEPTH, type CollectionNode, type Folder, type FolderNode } from '../../../tools/apiRequestBuilder/collections';
import type { SavedRequest } from '../../../tools/apiRequestBuilder/types';
import { METHOD_COLORS } from './sharedClasses';

interface CollectionsBrowserProps {
  tree: CollectionNode[];
  /** Flat folder list (not the tree) — only used for the per-folder depth-limit check, which
   *  walks parent chains rather than the nested shape. */
  folders: Folder[];
  onOpenRequest: (request: SavedRequest) => void;
  onCreateCollection: () => void;
  onRenameCollection: (id: string, name: string) => void;
  onDeleteCollection: (id: string) => void;
  onExportCollection: (id: string) => void;
  onImportFile: (file: File) => void;
  onOpenOpenApiImport: () => void;
  onCreateFolder: (collectionId: string, parentFolderId: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameRequest: (id: string, name: string) => void;
  onDuplicateRequest: (id: string) => void;
  onMoveRequest: (request: SavedRequest) => void;
  onShareRequest: (request: SavedRequest) => void;
  onDeleteRequest: (id: string) => void;
}

type RenameKind = 'collection' | 'folder' | 'request';
type RenameTarget = { kind: RenameKind; id: string } | null;

const rowActionClass =
  'p-1.5 rounded-lg text-secondary-text hover:text-ink hover:bg-ink/10 transition-colors disabled:opacity-30 disabled:pointer-events-none';

export const CollectionsBrowser = ({
  tree,
  folders,
  onOpenRequest,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  onExportCollection,
  onImportFile,
  onOpenOpenApiImport,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onRenameRequest,
  onDuplicateRequest,
  onMoveRequest,
  onShareRequest,
  onDeleteRequest,
}: CollectionsBrowserProps) => {
  // Absence from this set is "expanded" (not presence in an "expanded" set) — so a newly
  // created collection/folder starts open without needing to sync this state against `tree`.
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [renameTarget, setRenameTarget] = useState<RenameTarget>(null);
  const [draftName, setDraftName] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImportFileChange = (e: { target: HTMLInputElement }) => {
    const file = e.target.files?.[0];
    if (file) onImportFile(file);
    // Reset so picking the same file again (e.g. re-import after fixing it) still fires onChange.
    e.target.value = '';
  };

  const toggle = (id: string) =>
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const startRename = (kind: RenameKind, id: string, name: string) => {
    setRenameTarget({ kind, id });
    setDraftName(name);
  };

  const cancelRename = () => setRenameTarget(null);

  const commitRename = () => {
    if (!renameTarget) return;
    const trimmed = draftName.trim();
    if (trimmed) {
      if (renameTarget.kind === 'collection') onRenameCollection(renameTarget.id, trimmed);
      else if (renameTarget.kind === 'folder') onRenameFolder(renameTarget.id, trimmed);
      else onRenameRequest(renameTarget.id, trimmed);
    }
    setRenameTarget(null);
  };

  const renameInput = (ariaLabel: string) => (
    <>
      <input
        autoFocus
        value={draftName}
        onChange={(e) => setDraftName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitRename();
          if (e.key === 'Escape') cancelRename();
        }}
        aria-label={ariaLabel}
        className="flex-1 min-w-0 bg-ink/5 border border-accent-blue rounded-md px-2 py-1 text-sm text-ink focus:outline-none"
      />
      <button type="button" onClick={commitRename} aria-label="Confirm rename" className="p-1.5 text-emerald-400 shrink-0">
        <Check size={14} aria-hidden="true" />
      </button>
      <button type="button" onClick={cancelRename} aria-label="Cancel rename" className="p-1.5 text-secondary-text shrink-0">
        <X size={14} aria-hidden="true" />
      </button>
    </>
  );

  const renderRequest = (request: SavedRequest, depth: number) => {
    const isRenaming = renameTarget?.kind === 'request' && renameTarget.id === request.id;
    return (
      <div
        key={request.id}
        className="group flex items-center gap-1 rounded-lg hover:bg-ink/5 transition-colors"
        style={{ paddingLeft: `${depth * 16 + 28}px` }}
      >
        {isRenaming ? (
          <div className="flex-1 min-w-0 flex items-center gap-1 px-2 py-1.5">{renameInput('Rename request')}</div>
        ) : (
          <>
            <button type="button" onClick={() => onOpenRequest(request)} className="flex-1 min-w-0 flex items-center gap-2 text-left px-2 py-1.5">
              <span className={`text-[10px] font-mono font-bold shrink-0 ${METHOD_COLORS[request.request.method]}`}>
                {request.request.method}
              </span>
              <span className="text-sm text-ink truncate">{request.name}</span>
            </button>
            <div className="hidden group-hover:flex items-center gap-0.5 pr-1 shrink-0">
              <button type="button" onClick={() => startRename('request', request.id, request.name)} aria-label={`Rename ${request.name}`} className={rowActionClass}>
                <Pencil size={13} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => onDuplicateRequest(request.id)} aria-label={`Duplicate ${request.name}`} className={rowActionClass}>
                <Copy size={13} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => onShareRequest(request)} aria-label={`Share ${request.name}`} className={rowActionClass}>
                <Share2 size={13} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => onMoveRequest(request)} aria-label={`Move ${request.name}`} className={rowActionClass}>
                <Move size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteRequest(request.id)}
                aria-label={`Delete ${request.name}`}
                className={`${rowActionClass} hover:text-red-400 hover:bg-red-400/10`}
              >
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderFolder = (node: FolderNode, depth: number) => {
    const { folder, children, requests } = node;
    const isCollapsed = collapsedIds.has(folder.id);
    const isRenaming = renameTarget?.kind === 'folder' && renameTarget.id === folder.id;
    const isEmpty = children.length === 0 && requests.length === 0;
    const canAddSubfolder = canCreateSubfolder(folders, folder.id);
    const indent = depth * 16 + 8;

    return (
      <div key={folder.id}>
        <div className="group flex items-center gap-1 rounded-lg hover:bg-ink/5 transition-colors" style={{ paddingLeft: `${indent}px` }}>
          {isRenaming ? (
            <div className="flex-1 min-w-0 flex items-center gap-1 px-2 py-1.5">{renameInput('Rename folder')}</div>
          ) : (
            <>
              <button type="button" onClick={() => toggle(folder.id)} className="flex-1 min-w-0 flex items-center gap-1.5 text-left px-2 py-1.5">
                {isCollapsed ? <ChevronRight size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
                <FolderIcon size={13} className="text-secondary-text shrink-0" aria-hidden="true" />
                <span className="text-sm text-ink truncate">{folder.name}</span>
              </button>
              <div className="hidden group-hover:flex items-center gap-0.5 pr-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onCreateFolder(folder.collectionId, folder.id)}
                  disabled={!canAddSubfolder}
                  aria-label={`New subfolder in ${folder.name}`}
                  title={canAddSubfolder ? 'New subfolder' : `Maximum folder depth (${MAX_FOLDER_DEPTH}) reached`}
                  className={rowActionClass}
                >
                  <FolderPlus size={13} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => startRename('folder', folder.id, folder.name)} aria-label={`Rename ${folder.name}`} className={rowActionClass}>
                  <Pencil size={13} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteFolder(folder.id)}
                  aria-label={`Delete ${folder.name}`}
                  className={`${rowActionClass} hover:text-red-400 hover:bg-red-400/10`}
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </div>
        {!isCollapsed && !isRenaming && (
          <div>
            {isEmpty && (
              <p className="text-xs text-secondary-text py-1" style={{ paddingLeft: `${indent + 28}px` }}>
                This folder doesn't contain any requests yet.
              </p>
            )}
            {children.map((child) => renderFolder(child, depth + 1))}
            {requests.map((request) => renderRequest(request, depth))}
          </div>
        )}
      </div>
    );
  };

  const renderCollection = (node: CollectionNode) => {
    const { collection, folders: rootFolders, requests: rootRequests } = node;
    const isCollapsed = collapsedIds.has(collection.id);
    const isRenaming = renameTarget?.kind === 'collection' && renameTarget.id === collection.id;
    const isEmpty = rootFolders.length === 0 && rootRequests.length === 0;

    return (
      <div key={collection.id}>
        <div className="group flex items-center gap-1 rounded-lg hover:bg-ink/5 transition-colors">
          {isRenaming ? (
            <div className="flex-1 min-w-0 flex items-center gap-1 px-2 py-2">{renameInput('Rename collection')}</div>
          ) : (
            <>
              <button type="button" onClick={() => toggle(collection.id)} className="flex-1 min-w-0 flex items-center gap-1.5 text-left px-2 py-2">
                {isCollapsed ? <ChevronRight size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
                <span className="text-sm font-bold text-ink truncate">{collection.name}</span>
              </button>
              <div className="hidden group-hover:flex items-center gap-0.5 pr-1 shrink-0">
                <button type="button" onClick={() => onCreateFolder(collection.id, null)} aria-label={`New folder in ${collection.name}`} title="New folder" className={rowActionClass}>
                  <FolderPlus size={13} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => onExportCollection(collection.id)} aria-label={`Export ${collection.name} as JSON`} title="Export as JSON" className={rowActionClass}>
                  <Download size={13} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => startRename('collection', collection.id, collection.name)} aria-label={`Rename ${collection.name}`} className={rowActionClass}>
                  <Pencil size={13} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCollection(collection.id)}
                  aria-label={`Delete ${collection.name}`}
                  className={`${rowActionClass} hover:text-red-400 hover:bg-red-400/10`}
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </div>
        {!isCollapsed && !isRenaming && (
          <div>
            {isEmpty && <p className="text-xs text-secondary-text py-1.5 pl-11">No folders or requests yet.</p>}
            {rootFolders.map((folder) => renderFolder(folder, 1))}
            {rootRequests.map((request) => renderRequest(request, 0))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-end gap-3 px-3 pt-3 pb-1">
        <input ref={importInputRef} type="file" accept="application/json,.json" onChange={handleImportFileChange} className="hidden" />
        <button
          type="button"
          onClick={onOpenOpenApiImport}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-secondary-text hover:text-ink transition-colors"
        >
          <FileUp size={14} aria-hidden="true" />
          Import OpenAPI
        </button>
        <button
          type="button"
          onClick={() => importInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-secondary-text hover:text-ink transition-colors"
        >
          <Upload size={14} aria-hidden="true" />
          Import
        </button>
        <button type="button" onClick={onCreateCollection} className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-accent-blue hover:text-accent-blue/80 transition-colors">
          <Plus size={14} aria-hidden="true" />
          New collection
        </button>
      </div>
      {tree.length === 0 ? (
        <p className="text-sm text-secondary-text p-5">Create a collection to organize your API requests.</p>
      ) : (
        <div className="p-2 space-y-0.5">{tree.map(renderCollection)}</div>
      )}
    </div>
  );
};
