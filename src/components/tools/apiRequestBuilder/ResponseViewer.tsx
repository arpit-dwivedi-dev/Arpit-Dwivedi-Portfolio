import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  Download,
  Loader2,
  Route,
  Send,
  Timer,
  WifiOff,
  XCircle,
} from 'lucide-react';
import type { ApiResponse, RequestFailure } from '../../../tools/apiRequestBuilder/types';
import { formatBytes, formatDuration } from '../../../tools/apiRequestBuilder/urlUtils';
import { tryParseJson } from '../../../tools/apiRequestBuilder/jsonUtils';
import { JsonTreeView } from './JsonTreeView';
import { smallButtonClass, statusColor } from './sharedClasses';

interface ResponseViewerProps {
  sending: boolean;
  response: ApiResponse | null;
  error: RequestFailure | null;
  elapsedMs: number | null;
  /** Origin of the proxy this response actually came through, if the direct request was blocked and 'auto' mode fell back to one. */
  viaProxy: string | null;
  onCancel: () => void;
}

const ERROR_COPY: Record<RequestFailure['kind'], { title: string; icon: typeof AlertTriangle }> = {
  'invalid-url': { title: 'Invalid URL', icon: XCircle },
  'invalid-json': { title: 'Invalid JSON body', icon: XCircle },
  'network-or-cors': { title: 'Request blocked or failed', icon: WifiOff },
  timeout: { title: 'Request timed out', icon: Timer },
  aborted: { title: 'Request cancelled', icon: XCircle },
  unknown: { title: 'Something went wrong', icon: AlertTriangle },
};

type BodyView = 'pretty' | 'raw';
type ResponseTab = 'body' | 'headers';

export const ResponseViewer = ({ sending, response, error, elapsedMs, viaProxy, onCancel }: ResponseViewerProps) => {
  const [tab, setTab] = useState<ResponseTab>('body');
  const [bodyView, setBodyView] = useState<BodyView>('pretty');
  const [copied, setCopied] = useState(false);

  const parsedJson = useMemo(() => {
    if (!response?.isJson) return null;
    const result = tryParseJson(response.body);
    return result.ok ? result.value : null;
  }, [response]);

  const handleCopy = async () => {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(response.body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be denied by browser permissions — nothing sensible to
      // recover to here, the copy button simply stays in its unclicked state.
    }
  };

  const handleDownload = () => {
    if (!response) return;
    const ext = response.isJson ? 'json' : 'txt';
    const blob = new Blob([response.body], { type: response.isJson ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `response.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (sending) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-secondary-text">
        <Loader2 size={22} className="animate-spin text-accent-blue" aria-hidden="true" />
        <p className="text-sm">Sending request…</p>
        <button type="button" onClick={onCancel} className={smallButtonClass}>
          Cancel
        </button>
      </div>
    );
  }

  if (error) {
    const copy = ERROR_COPY[error.kind];
    const Icon = copy.icon;
    return (
      <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-5">
        <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-2">
          <Icon size={16} aria-hidden="true" />
          {copy.title}
          {elapsedMs !== null && <span className="ml-auto text-xs font-mono text-secondary-text font-normal">{formatDuration(elapsedMs)}</span>}
        </div>
        <p className="text-sm text-secondary-text leading-relaxed">{error.message}</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-secondary-text">
        <Send size={20} aria-hidden="true" className="opacity-40" />
        <p className="text-sm">Send a request to see the response here.</p>
      </div>
    );
  }

  const headerEntries = Object.entries(response.headers);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4 text-sm font-mono">
        <span className={`font-bold ${statusColor(response.status)}`}>
          {response.status} {response.statusText}
        </span>
        <span className="inline-flex items-center gap-1.5 text-secondary-text">
          <Clock size={13} aria-hidden="true" />
          {formatDuration(response.timeMs)}
        </span>
        <span className="text-secondary-text">{formatBytes(response.sizeBytes)}</span>
        {response.truncated && (
          <span className="inline-flex items-center gap-1 text-amber-400 text-xs">
            <AlertTriangle size={12} aria-hidden="true" />
            Truncated for display
          </span>
        )}
        {viaProxy && (
          <span
            className="inline-flex items-center gap-1 text-amber-400 text-xs"
            title="The direct request was blocked (CORS/network); this response came back through a public proxy instead."
          >
            <Route size={12} aria-hidden="true" />
            via {viaProxy}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-b border-ink/10 mb-3">
        <div role="tablist" aria-label="Response view" className="flex items-center gap-1">
          {(['body', 'headers'] as ResponseTab[]).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`relative px-3.5 py-2 text-sm font-mono font-medium capitalize transition-colors ${
                tab === id ? 'text-accent-blue' : 'text-secondary-text hover:text-ink'
              }`}
            >
              {id}
              {id === 'headers' && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-ink/10">{headerEntries.length}</span>}
              {tab === id && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent-blue rounded-full" aria-hidden="true" />}
            </button>
          ))}
        </div>

        {tab === 'body' && (
          <div className="flex items-center gap-1.5 pb-1.5">
            {response.isJson && parsedJson !== null && (
              <div className="flex rounded-lg border border-ink/10 overflow-hidden mr-1">
                {(['pretty', 'raw'] as BodyView[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setBodyView(v)}
                    className={`px-2.5 py-1 text-[11px] font-mono capitalize transition-colors ${
                      bodyView === v ? 'bg-accent-blue/10 text-accent-blue' : 'text-secondary-text hover:text-ink'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={handleCopy} className={smallButtonClass} aria-label="Copy response body">
              {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button type="button" onClick={handleDownload} className={smallButtonClass} aria-label="Download response body">
              <Download size={13} aria-hidden="true" />
              Download
            </button>
          </div>
        )}
      </div>

      {tab === 'body' && (
        <div className="rounded-lg bg-ink/[0.03] border border-ink/10 p-3.5 max-h-[480px] overflow-auto scrollbar-thin">
          {response.body === '' ? (
            <p className="text-sm text-secondary-text">Empty response body.</p>
          ) : response.isJson && parsedJson !== null && bodyView === 'pretty' ? (
            <JsonTreeView data={parsedJson as never} />
          ) : (
            <pre className="text-[13px] font-mono text-ink whitespace-pre-wrap break-words leading-relaxed">{response.body}</pre>
          )}
        </div>
      )}

      {tab === 'headers' && (
        <div className="rounded-lg bg-ink/[0.03] border border-ink/10 divide-y divide-ink/10 max-h-[480px] overflow-auto scrollbar-thin">
          {headerEntries.length === 0 ? (
            <p className="text-sm text-secondary-text p-3.5">No response headers.</p>
          ) : (
            headerEntries.map(([key, value]) => (
              <div key={key} className="flex gap-3 px-3.5 py-2 text-[13px] font-mono">
                <span className="text-secondary-text shrink-0">{key}</span>
                <span className="text-ink break-all">{value}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
