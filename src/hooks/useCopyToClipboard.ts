import { useCallback, useEffect, useRef, useState } from 'react';
import { copyTextToClipboard } from '../lib/clipboard';

export type CopyStatus = 'idle' | 'copied' | 'error';

interface UseCopyToClipboardResult {
  status: CopyStatus;
  /** Resolves to whether the copy succeeded, for callers that also want to
   *  fire analytics or close a modal only on success. */
  copy: (text: string) => Promise<boolean>;
}

/** Shared copy-button state: performs the copy and reports BOTH outcomes, so a
 *  failed copy shows the user something instead of leaving the button looking
 *  inert. Auto-resets to `idle` after `resetAfterMs`. */
export function useCopyToClipboard(resetAfterMs = 2000): UseCopyToClipboardResult {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
  }, []);

  const copy = useCallback(async (text: string) => {
    const ok = await copyTextToClipboard(text);
    setStatus(ok ? 'copied' : 'error');
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    // An error message needs longer on screen than a "Copied!" confirmation —
    // the user has to read it and then act on it manually.
    timeoutRef.current = window.setTimeout(() => setStatus('idle'), ok ? resetAfterMs : resetAfterMs * 2);
    return ok;
  }, [resetAfterMs]);

  return { status, copy };
}
