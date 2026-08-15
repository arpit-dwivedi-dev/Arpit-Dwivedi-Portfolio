import { useState } from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import type { ApiRequest } from '../../../tools/apiRequestBuilder/types';
import { parseCurlCommand } from '../../../tools/apiRequestBuilder/curlParser';
import { Modal } from './Modal';

interface CurlImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (request: ApiRequest) => void;
}

export const CurlImportModal = ({ open, onClose, onImport }: CurlImportModalProps) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleClose = () => {
    setInput('');
    setError(null);
    setWarnings([]);
    onClose();
  };

  const handleImport = () => {
    const result = parseCurlCommand(input);
    if (!result.ok || !result.request) {
      setError(result.error ?? 'Could not parse that command.');
      setWarnings([]);
      return;
    }
    onImport(result.request);
    setError(null);
    // Import already applied — if there's nothing to flag, close immediately;
    // otherwise stay open so the warnings are actually seen before dismissing.
    if (result.warnings.length > 0) setWarnings(result.warnings);
    else handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} titleId="curl-import-heading" title="Import from cURL" maxWidthClassName="max-w-xl">
      <label htmlFor="curl-input" className="sr-only">
        cURL command
      </label>
      <textarea
        id="curl-input"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setError(null);
        }}
        spellCheck={false}
        placeholder={`curl -X POST "https://example.com/api/users" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"John"}'`}
        className="w-full min-h-[160px] resize-y bg-ink/[0.03] border border-ink/10 hover:border-ink/20 focus:border-accent-blue focus:bg-ink/5 rounded-lg px-3 py-2.5 text-[13px] font-mono text-ink placeholder:text-secondary-text/50 focus:outline-none transition-colors leading-relaxed"
      />

      {error && (
        <p className="mt-3 text-sm text-red-400 flex items-start gap-1.5">
          <AlertCircle size={15} aria-hidden="true" className="shrink-0 mt-0.5" />
          {error}
        </p>
      )}

      {warnings.length > 0 && (
        <ul className="mt-3 space-y-1">
          {warnings.map((w) => (
            <li key={w} className="text-xs text-amber-400/90 flex items-start gap-1.5">
              <AlertTriangle size={13} aria-hidden="true" className="shrink-0 mt-0.5" />
              {w}
            </li>
          ))}
        </ul>
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
          disabled={!input.trim()}
          className="px-4 py-2 rounded-lg text-sm font-bold bg-accent-blue text-bg-pure hover:glow-blue transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          Import
        </button>
      </div>
    </Modal>
  );
};
