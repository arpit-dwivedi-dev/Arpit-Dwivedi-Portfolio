import { useEffect, useRef, useState } from 'react';

// Trigger/suppression logic for the automatic "support this free tool" prompt.
// Kept out of the component so tools can signal a successful run (notifyToolUsed)
// without importing any UI.

const DISMISSED_KEY = '101tl_support_prompt_dismissed_v1';
const DISMISS_DAYS = 14;
const DISMISS_MS = DISMISS_DAYS * 24 * 60 * 60 * 1000;

// The prompt lands *after* the user has seen their result, not on top of it.
const SHOW_DELAY_MS = 1500;

/** True while the user's dismissal is still inside the 14-day quiet period. */
export const isSupportPromptSuppressed = (): boolean => {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return true; // unparseable → stay quiet rather than nag
    return Date.now() - at < DISMISS_MS;
  } catch {
    // Storage blocked (private browsing): we can't remember a dismissal, so
    // never auto-show — an un-rememberable prompt is the nagging kind.
    return true;
  }
};

export const suppressSupportPrompt = (): void => {
  try {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  } catch {
    // Nothing to do — the session-level guard below still stops a re-show.
  }
};

type Listener = () => void;
const listeners = new Set<Listener>();

// Once per page session, regardless of how many times the tool is run.
let shownThisSession = false;

// Set while any support modal (manual button or auto prompt) is on screen, so
// the auto prompt never stacks on top of one the user opened themselves.
let openModals = 0;
export const registerSupportModalOpen = (): (() => void) => {
  openModals += 1;
  return () => {
    openModals -= 1;
  };
};

/** Called by a tool after a *successful* use (export, download, request sent…). */
export const notifyToolUsed = (): void => {
  if (shownThisSession || openModals > 0 || isSupportPromptSuppressed()) return;
  listeners.forEach((listener) => listener());
};

/** Drives the auto prompt: opens shortly after the first successful tool use. */
export const useSupportPrompt = () => {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const listener = () => {
      if (shownThisSession || timerRef.current !== null) return;
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        if (openModals > 0 || isSupportPromptSuppressed()) return;
        shownThisSession = true;
        setOpen(true);
      }, SHOW_DELAY_MS);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const close = () => {
    setOpen(false);
    suppressSupportPrompt();
  };

  return { open, close };
};

// Test-only reset for the module-level session guards.
export const __resetSupportPromptSession = () => {
  shownThisSession = false;
  openModals = 0;
};
