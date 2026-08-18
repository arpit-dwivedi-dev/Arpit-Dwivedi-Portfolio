import { useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import { Modal } from './Modal';
import { buildShareUrl } from '../../../tools/dbmlDiagramBuilder/persistence/urlShare';

interface ShareModalProps {
  dbml: string;
  onClose: () => void;
}

export function ShareModal({ dbml, onClose }: ShareModalProps) {
  const { url, tooLong } = useMemo(() => buildShareUrl(dbml), [dbml]);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (e.g. insecure context) — the
      // read-only input below still lets the user select-and-copy manually.
    }
  };

  return (
    <Modal title="Share diagram" onClose={onClose} widthClass="max-w-lg">
      <p className="text-sm text-slate-400 dbml-light:text-slate-500 mb-3">
        Anyone with this link can open a read-only copy of this schema — the DBML is compressed directly into the
        URL, nothing is uploaded anywhere.
      </p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 bg-slate-800 dbml-light:bg-slate-100 rounded px-2 py-1.5 text-xs font-mono text-slate-200 dbml-light:text-slate-800"
          aria-label="Share URL"
        />
        <button
          type="button"
          onClick={copy}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {tooLong && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-400">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          This schema is large — the link is {url.length.toLocaleString()} characters and may be rejected by some
          browsers, chat apps, or servers. Consider exporting the .dbml file instead for large schemas.
        </p>
      )}
    </Modal>
  );
}
