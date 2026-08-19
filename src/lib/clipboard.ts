/** Writes `text` to the clipboard, returning whether it actually landed there.
 *
 *  The async Clipboard API is unavailable in a surprising number of real
 *  situations — any insecure context (the app served over http:// from a LAN
 *  IP rather than localhost), older Safari/Firefox, an iframe without
 *  `clipboard-write` permission, or a denied permission prompt. In all of
 *  those `navigator.clipboard` is either undefined or its promise rejects, so
 *  we fall back to a hidden textarea + `document.execCommand('copy')`, which
 *  still works everywhere because it runs synchronously inside the user's
 *  click gesture.
 *
 *  Callers MUST surface the boolean — a silently-swallowed failure is
 *  indistinguishable to the user from the button doing nothing at all. */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the execCommand path below rather than giving up.
    }
  }
  return copyViaExecCommand(text);
}

function copyViaExecCommand(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  // Keep it off-screen but still focusable/selectable — `display: none` or
  // `hidden` would make the selection (and therefore the copy) a no-op.
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  textarea.setAttribute('aria-hidden', 'true');

  const previouslyFocused = document.activeElement as HTMLElement | null;
  document.body.appendChild(textarea);
  try {
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
    // Restore focus so copying from inside a modal doesn't break its focus trap.
    previouslyFocused?.focus?.();
  }
}
