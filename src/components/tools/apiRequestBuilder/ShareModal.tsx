import { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { Modal } from './Modal';
import type { ApiRequest } from '../../../tools/apiRequestBuilder/types';
import { buildShareUrl, encodeShareRequest } from '../../../tools/apiRequestBuilder/shareRequest';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  /** The request being shared — null hides content, matching this tool's other
   *  "act on a specific item" modals (see MoveRequestModal). */
  request: ApiRequest | null;
  /** `window.location.origin + window.location.pathname` — passed in rather than read
   *  directly so this component stays easy to render in a test environment. */
  baseUrl: string;
}

/** Builds a shareable link for a single request and lets the user copy or open it. Every
 *  auth secret and credential-shaped header is stripped before the link is generated (see
 *  shareRequest.sanitizeForShare) — nothing here ever needs to know that already happened,
 *  since encodeShareRequest() does it internally. */
export const ShareModal = ({ open, onClose, request, baseUrl }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!open || !request) return null;
    const encoded = encodeShareRequest(request);
    if (!encoded.ok) return { ok: false as const, error: encoded.error };
    return { ok: true as const, url: buildShareUrl(baseUrl, encoded.encoded) };
  }, [open, request, baseUrl]);

  if (!request) return null;

  const handleCopy = async () => {
    if (!result?.ok) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied — the URL is still visible in the field to copy manually.
    }
  };

  return (
    <Modal open={open} onClose={onClose} titleId="share-request-heading" title="Share request" maxWidthClassName="max-w-lg">
      {result?.ok ? (
        <>
          <div className="flex items-stretch gap-2 mb-3">
            <input
              type="text"
              readOnly
              value={result.url}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Share URL"
              className="flex-1 min-w-0 bg-ink/[0.03] border border-ink/10 rounded-lg px-3 py-2 text-xs font-mono text-ink focus:outline-none focus:border-accent-blue"
            />
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-blue text-bg-pure text-xs font-bold hover:glow-blue transition-all"
            >
              {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-accent-blue hover:text-accent-blue/80 transition-colors mb-4"
          >
            <ExternalLink size={13} aria-hidden="true" />
            Open in a new tab
          </a>

          <p className="text-[11px] text-secondary-text leading-relaxed">
            <ShieldCheck size={12} className="inline -mt-0.5 mr-1 text-accent-blue" aria-hidden="true" />
            Secrets are removed from shared requests — bearer tokens, basic auth passwords, API keys, and Authorization/Cookie
            header values are stripped before the link is generated. Any <code className="font-mono text-ink">{'{{variable}}'}</code>{' '}
            references stay as-is; the person who opens this link picks or creates their own environment. This link is not
            encrypted — it's a compressed copy of the request, so treat it the same as any other URL you share.
          </p>
        </>
      ) : (
        <p className="text-sm text-red-400 leading-relaxed">{result?.error ?? 'Request is too large to create a share link.'}</p>
      )}
    </Modal>
  );
};
