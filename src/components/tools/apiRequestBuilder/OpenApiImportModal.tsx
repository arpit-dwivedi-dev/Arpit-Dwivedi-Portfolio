import { useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, FileUp, FolderTree, Layers, Server, ShieldCheck } from 'lucide-react';
import { buildOpenApiImportPlan, MAX_OPENAPI_IMPORT_BYTES, type OpenApiImportOutcome, type OpenApiImportPlan } from '../../../tools/apiRequestBuilder/openapi';
import { Modal } from './Modal';

interface OpenApiImportModalProps {
  open: boolean;
  onClose: () => void;
  existingCollectionNames: string[];
  existingEnvironmentNames: string[];
  onImport: (plan: OpenApiImportPlan) => void;
}

const statClass = 'flex items-center gap-2 text-xs text-secondary-text';

export const OpenApiImportModal = ({ open, onClose, existingCollectionNames, existingEnvironmentNames, onImport }: OpenApiImportModalProps) => {
  const [outcome, setOutcome] = useState<OpenApiImportOutcome | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setOutcome(null);
    setFileName('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = async (e: { target: HTMLInputElement }) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // so re-picking the same file after fixing it still fires onChange
    if (!file) return;

    reset();
    setFileName(file.name);

    if (file.size > MAX_OPENAPI_IMPORT_BYTES) {
      setError(`File is too large to import (limit ${Math.floor(MAX_OPENAPI_IMPORT_BYTES / 1_000_000)}MB).`);
      return;
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      setError("Couldn't read that file.");
      return;
    }

    const result = buildOpenApiImportPlan(text, existingCollectionNames, existingEnvironmentNames);
    if (!result.ok) {
      setError(result.error ?? "Couldn't import that file.");
      return;
    }
    setOutcome(result);
  };

  const handleImport = () => {
    if (!outcome?.plan) return;
    onImport(outcome.plan);
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} titleId="openapi-import-heading" title="Import OpenAPI" maxWidthClassName="max-w-lg">
      <p className="text-sm text-secondary-text mb-4">
        Import an OpenAPI 3.0 or 3.1 document (JSON or YAML) as a new collection — endpoints become saved requests, grouped into
        folders by tag.
      </p>

      <input ref={fileInputRef} type="file" accept=".json,.yaml,.yml" onChange={(e) => void handleFileChange(e)} className="hidden" />

      {!outcome && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-ink/15 hover:border-accent-blue/40 hover:bg-ink/[0.03] transition-colors text-secondary-text hover:text-ink"
        >
          <FileUp size={22} aria-hidden="true" />
          <span className="text-sm font-medium">{fileName ? fileName : 'Choose a .json, .yaml, or .yml file'}</span>
        </button>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-400 flex items-start gap-1.5">
          <AlertCircle size={15} aria-hidden="true" className="shrink-0 mt-0.5" />
          {error}
        </p>
      )}

      {outcome?.ok && outcome.plan && outcome.summary && (
        <div className="mt-1">
          <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-4">
            <p className="text-sm font-bold text-ink mb-3 truncate">{outcome.summary.title}</p>
            <div className="grid grid-cols-2 gap-y-2">
              <span className={statClass}>
                <Layers size={13} aria-hidden="true" />
                {outcome.summary.operationCount} endpoint{outcome.summary.operationCount === 1 ? '' : 's'}
              </span>
              <span className={statClass}>
                <FolderTree size={13} aria-hidden="true" />
                {outcome.summary.folderCount} folder{outcome.summary.folderCount === 1 ? '' : 's'}
              </span>
              <span className={statClass}>
                <Server size={13} aria-hidden="true" />
                {outcome.summary.serverCount} server{outcome.summary.serverCount === 1 ? '' : 's'}
              </span>
              <span className={statClass}>
                <ShieldCheck size={13} aria-hidden="true" />
                {outcome.summary.securitySchemeCount} security scheme{outcome.summary.securitySchemeCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {(outcome.warnings?.length ?? 0) > 0 && (
            <ul className="mt-3 space-y-1">
              {outcome.warnings!.map((w) => (
                <li key={w} className="text-xs text-amber-400/90 flex items-start gap-1.5">
                  <AlertTriangle size={13} aria-hidden="true" className="shrink-0 mt-0.5" />
                  {w}
                </li>
              ))}
            </ul>
          )}

          {(outcome.skippedOperationCount ?? 0) > 0 && (
            <p className="mt-2 text-xs text-secondary-text">
              {outcome.skippedOperationCount} operation{outcome.skippedOperationCount === 1 ? '' : 's'} skipped (unsupported method or malformed).
            </p>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 text-xs font-medium text-accent-blue hover:text-accent-blue/80 transition-colors"
          >
            Choose a different file
          </button>
        </div>
      )}

      <div className="flex justify-end gap-2 mt-5">
        <button
          type="button"
          onClick={handleClose}
          className="px-4 py-2 rounded-lg text-sm font-medium text-secondary-text hover:text-ink transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={!outcome?.ok}
          className="px-4 py-2 rounded-lg text-sm font-bold bg-accent-blue text-bg-pure hover:glow-blue transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          Import {outcome?.summary ? `${outcome.summary.operationCount} request${outcome.summary.operationCount === 1 ? '' : 's'}` : ''}
        </button>
      </div>
    </Modal>
  );
};
