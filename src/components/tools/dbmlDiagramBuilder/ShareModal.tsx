import { useMemo } from 'react';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { Modal } from './Modal';
import { buildShareUrl } from '../../../tools/dbmlDiagramBuilder/persistence/urlShare';

interface ShareModalProps {
  dbml: string;
  onClose: () => void;
}

export function ShareModal({ dbml, onClose }: ShareModalProps) {
  const { url, tooLong } = useMemo(() => buildShareUrl(dbml), [dbml]);
  const { status: copyStatus, copy: copyText } = useCopyToClipboard();
  const copied = copyStatus === 'copied';

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
          onClick={() => void copyText(url)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {copyStatus === 'error' && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-red-400" role="status">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          Couldn't copy automatically — select the link above and copy it manually.
        </p>
      )}
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
