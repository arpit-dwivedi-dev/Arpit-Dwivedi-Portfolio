import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileWarning,
  Loader2,
  Route,
  Send,
  ShieldAlert,
  Timer,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import type { ApiResponse, RequestFailure, ResponseBodyKind } from '../../../tools/apiRequestBuilder/types';
import { formatBytes, formatDuration } from '../../../tools/apiRequestBuilder/urlUtils';
import { tryParseJson } from '../../../tools/apiRequestBuilder/jsonUtils';
import { formatXml } from '../../../tools/apiRequestBuilder/xmlFormatter';
import { isSafeToPreviewAsImage } from '../../../tools/apiRequestBuilder/contentType';
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

const BODY_KIND_LABEL: Record<ResponseBodyKind, string> = {
  json: 'JSON',
  xml: 'XML',
  html: 'HTML',
  image: 'Image',
  text: 'Text',
  binary: 'Binary',
};

const DEFAULT_MIME_FOR_KIND: Record<ResponseBodyKind, string> = {
  json: 'application/json',
  xml: 'application/xml',
  html: 'text/html',
  text: 'text/plain',
  image: 'application/octet-stream',
  binary: 'application/octet-stream',
};

type BodyView = 'pretty' | 'raw';
type ResponseTab = 'body' | 'headers';

export const ResponseViewer = ({ sending, response, error, elapsedMs, viaProxy, onCancel }: ResponseViewerProps) => {
  const [tab, setTab] = useState<ResponseTab>('body');
  const [bodyView, setBodyView] = useState<BodyView>('pretty');
  const { status: copyStatus, copy: copyText } = useCopyToClipboard();
  const copied = copyStatus === 'copied';
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const newTabUrlRef = useRef<string | null>(null);

  const canPreviewAsImage = response?.bodyKind === 'image' && isSafeToPreviewAsImage(response.contentType);

  // Object URL lifecycle: create one preview URL per response, revoke it the moment the response
  // is replaced (new request sent) or the viewer unmounts — never left dangling across requests.
  useEffect(() => {
    if (!response || !canPreviewAsImage || !response.bodyBytes) {
      setImageUrl(null);
      return;
    }
    const blob = new Blob([response.bodyBytes], { type: response.contentType || 'image/*' });
    const url = URL.createObjectURL(blob);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response, canPreviewAsImage]);

  // The ad-hoc "open in new tab" URL for binary responses is created on demand (not eagerly, so
  // it never grows the memory footprint of a response the user never asks to open) — but still
  // needs cleanup whenever the response changes or the component unmounts.
  useEffect(
    () => () => {
      if (newTabUrlRef.current) {
        URL.revokeObjectURL(newTabUrlRef.current);
        newTabUrlRef.current = null;
      }
    },
    [response],
  );

  const parsedJson = useMemo(() => {
    if (response?.bodyKind !== 'json') return null;
    const result = tryParseJson(response.bodyText);
    return result.ok ? result.value : null;
  }, [response]);

  const xmlResult = useMemo(() => {
    if (response?.bodyKind !== 'xml') return null;
    return formatXml(response.bodyText);
  }, [response]);

  const buildBodyBlob = (): Blob | null => {
    if (!response) return null;
    if ((response.bodyKind === 'image' || response.bodyKind === 'binary') && response.bodyBytes) {
      return new Blob([response.bodyBytes], { type: response.contentType || 'application/octet-stream' });
    }
    return new Blob([response.bodyText], { type: response.contentType || DEFAULT_MIME_FOR_KIND[response.bodyKind] });
  };

  const canCopy = response !== null && response.bodyKind !== 'image' && response.bodyKind !== 'binary' && response.bodyText !== '';

  const handleCopy = () => {
    if (!response || !canCopy) return;
    void copyText(response.bodyText);
  };

  const handleDownload = () => {
    const blob = buildBodyBlob();
    if (!blob || !response) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = response.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewTab = () => {
    const blob = buildBodyBlob();
    if (!blob) return;
    if (newTabUrlRef.current) URL.revokeObjectURL(newTabUrlRef.current);
    const url = URL.createObjectURL(blob);
    newTabUrlRef.current = url;
    window.open(url, '_blank', 'noopener,noreferrer');
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
  const isEmpty = response.bodyKind === 'image' || response.bodyKind === 'binary' ? response.sizeBytes === 0 : response.bodyText === '';
  const showPrettyRawToggle =
    (response.bodyKind === 'json' && parsedJson !== null) || (response.bodyKind === 'xml' && xmlResult?.ok === true);
  const isSvg = response.bodyKind === 'image' && response.contentType === 'image/svg+xml';
  const showOpenInNewTab = response.bodyKind === 'binary' || response.bodyKind === 'image';

  const renderJson = () => {
    if (parsedJson === null) {
      return (
        <>
          {response.truncated && (
            <div className="flex items-center gap-1.5 text-amber-400 text-xs mb-2">
              <AlertTriangle size={12} aria-hidden="true" />
              Response was truncated for display — showing raw text instead of the JSON tree.
            </div>
          )}
          <pre className="text-[13px] font-mono text-ink whitespace-pre-wrap break-words leading-relaxed">{response.bodyText}</pre>
        </>
      );
    }
    return bodyView === 'pretty' ? (
      <JsonTreeView data={parsedJson as never} />
    ) : (
      <pre className="text-[13px] font-mono text-ink whitespace-pre-wrap break-words leading-relaxed">{response.bodyText}</pre>
    );
  };

  const renderXml = () => {
    if (!xmlResult) return null;
    if (!xmlResult.ok) {
      return (
        <>
          <div className="flex items-center gap-1.5 text-amber-400 text-xs mb-2">
            <AlertTriangle size={12} aria-hidden="true" />
            Malformed XML{xmlResult.error ? ` — ${xmlResult.error}` : ''}. Showing raw text.
          </div>
          <pre className="text-[13px] font-mono text-ink whitespace-pre-wrap break-words leading-relaxed">{response.bodyText}</pre>
        </>
      );
    }
    const shown = bodyView === 'pretty' ? xmlResult.formatted : response.bodyText;
    return <pre className="text-[13px] font-mono text-ink whitespace-pre-wrap break-words leading-relaxed">{shown}</pre>;
  };

  const renderImage = () => {
    if (isSvg) {
      return (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <ShieldAlert size={26} aria-hidden="true" className="text-secondary-text opacity-50" />
          <p className="text-sm text-secondary-text max-w-sm">
            SVG responses can embed scripts, so this one isn't rendered inline. Download it or open it in a new tab to view it safely.
          </p>
          <div className="text-xs font-mono text-secondary-text">
            {response.contentType || 'image/svg+xml'} · {formatBytes(response.sizeBytes)}
          </div>
        </div>
      );
    }
    if (!imageUrl) {
      return <p className="text-sm text-secondary-text">Preparing preview…</p>;
    }
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <img
          src={imageUrl}
          alt="Response preview"
          className="max-w-full max-h-[420px] w-auto h-auto object-contain rounded-lg border border-ink/10"
        />
        <div className="text-xs font-mono text-secondary-text">
          {response.contentType || 'unknown type'} · {formatBytes(response.sizeBytes)}
        </div>
      </div>
    );
  };

  const renderBinary = () => (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <FileWarning size={26} aria-hidden="true" className="text-secondary-text opacity-50" />
      <p className="text-sm text-secondary-text max-w-sm">
        Binary response body — {response.contentType || 'unknown type'} can't be previewed as text. Use Download to save the original bytes.
      </p>
      <div className="text-xs font-mono text-secondary-text">{formatBytes(response.sizeBytes)}</div>
    </div>
  );

  const renderHtml = () => (
    <>
      <div className="flex items-center gap-1.5 text-secondary-text text-xs mb-2">
        <ShieldAlert size={12} aria-hidden="true" />
        Shown as plain text, not rendered — API responses are never executed as page content here.
      </div>
      <pre className="text-[13px] font-mono text-ink whitespace-pre-wrap break-words leading-relaxed">{response.bodyText}</pre>
    </>
  );

  const renderBody = () => {
    if (isEmpty) return <p className="text-sm text-secondary-text">Empty response body.</p>;
    switch (response.bodyKind) {
      case 'json':
        return renderJson();
      case 'xml':
        return renderXml();
      case 'html':
        return renderHtml();
      case 'image':
        return renderImage();
      case 'binary':
        return renderBinary();
      case 'text':
      default:
        return <pre className="text-[13px] font-mono text-ink whitespace-pre-wrap break-words leading-relaxed">{response.bodyText}</pre>;
    }
  };

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
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-ink/10 text-secondary-text uppercase tracking-wide">
          {BODY_KIND_LABEL[response.bodyKind]}
        </span>
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
            {showPrettyRawToggle && (
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
            {canCopy && (
              <button type="button" onClick={handleCopy} className={smallButtonClass} aria-label="Copy response body">
                {copied ? (
                  <Check size={13} aria-hidden="true" />
                ) : copyStatus === 'error' ? (
                  <AlertTriangle size={13} aria-hidden="true" className="text-red-400" />
                ) : (
                  <Copy size={13} aria-hidden="true" />
                )}
                {copied ? 'Copied' : copyStatus === 'error' ? "Couldn't copy" : 'Copy'}
              </button>
            )}
            {showOpenInNewTab && !isEmpty && (
              <button type="button" onClick={handleOpenInNewTab} className={smallButtonClass} aria-label="Open response in a new tab">
                <ExternalLink size={13} aria-hidden="true" />
                Open
              </button>
            )}
            {!isEmpty && (
              <button type="button" onClick={handleDownload} className={smallButtonClass} aria-label="Download response body">
                <Download size={13} aria-hidden="true" />
                Download
              </button>
            )}
          </div>
        )}
      </div>

      {tab === 'body' && (
        <div className="rounded-lg bg-ink/[0.03] border border-ink/10 p-3.5 max-h-[480px] overflow-auto scrollbar-thin">
          {renderBody()}
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
