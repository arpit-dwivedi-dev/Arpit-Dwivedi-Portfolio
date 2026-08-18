import { useEffect, useRef, type RefObject } from 'react';
import { isFocusCandidateEligible, resolveTabWrap } from '../focus/focusTrap';

/**
 * DOM glue around focusTrap.ts's pure decision logic. Not covered by the
 * (jsdom-less) unit test suite — verified manually in the running app.
 */

const FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, [tabindex]';

function isElementVisible(el: HTMLElement): boolean {
  return el.getClientRects().length > 0;
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) =>
    isFocusCandidateEligible({
      disabled: 'disabled' in el && (el as HTMLButtonElement).disabled === true,
      tabIndex: el.tabIndex,
      ariaHidden: el.getAttribute('aria-hidden') === 'true',
      visible: isElementVisible(el),
    }),
  );
}

// Nested dialogs (should any ever stack) each register here in mount order;
// only the topmost trap intercepts Tab so an inner dialog can't leak focus
// into whatever opened it.
const trapStack: number[] = [];
let idSeq = 0;

/**
 * Traps Tab/Shift+Tab focus inside `containerRef`'s element while `active` is
 * true, moves focus into it on activation (unless something inside already
 * has focus, e.g. via an existing `autoFocus`), and restores focus to
 * whatever was focused beforehand once deactivated/unmounted.
 *
 * Escape-to-close is intentionally left to each modal, since it's already
 * implemented per-component and this hook shouldn't duplicate it.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active = true): void {
  const idRef = useRef<number | null>(null);
  if (idRef.current === null) idRef.current = ++idSeq;

  // Captured during render — before this modal's content commits — so an
  // `autoFocus` child stealing `document.activeElement` in the same commit
  // can't overwrite what the *real* opener was.
  const openerRef = useRef<HTMLElement | null>(null);
  if (openerRef.current === null) openerRef.current = document.activeElement as HTMLElement | null;

  // Holds the pending "restore focus to opener" timeout so a same-tick
  // remount (React StrictMode's dev-only mount→cleanup→mount cycle) can
  // cancel it — otherwise that phantom cleanup would yank focus back to the
  // opener and clobber the initial-focus target the immediate remount sets.
  const pendingRestoreRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const id = idRef.current!;
    trapStack.push(id);

    if (pendingRestoreRef.current !== null) {
      window.clearTimeout(pendingRestoreRef.current);
      pendingRestoreRef.current = null;
    } else if (!container.contains(document.activeElement)) {
      const [first] = getFocusableElements(container);
      (first ?? container).focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      if (trapStack[trapStack.length - 1] !== id) return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const target = resolveTabWrap({ count: focusable.length, currentIndex, shiftKey: event.shiftKey });
      if (target !== null) {
        event.preventDefault();
        focusable[target].focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      const idx = trapStack.indexOf(id);
      if (idx !== -1) trapStack.splice(idx, 1);

      pendingRestoreRef.current = window.setTimeout(() => {
        pendingRestoreRef.current = null;

        // If something else (e.g. a modal opened in the same tick this one
        // closed, like a confirm dialog replacing it) has since claimed
        // focus, leave it alone — only reclaim focus that's still just
        // sitting on this now-removed container or has fallen back to body.
        const current = document.activeElement;
        const stillUnclaimed = current === null || current === document.body || container.contains(current);
        if (!stillUnclaimed) return;

        const opener = openerRef.current;
        if (opener && document.contains(opener)) {
          try {
            opener.focus();
          } catch {
            // Opener may refuse focus (e.g. mid-removal) — nothing to recover from.
          }
        }
      }, 0);
    };
  }, [active, containerRef]);
}
