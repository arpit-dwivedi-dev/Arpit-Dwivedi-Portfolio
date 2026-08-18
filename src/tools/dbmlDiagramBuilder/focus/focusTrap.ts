/** Pure decision logic for focus trapping — no DOM access, so it's testable under a plain node test environment. */

export interface FocusCandidate {
  disabled?: boolean;
  tabIndex?: number;
  ariaHidden?: boolean;
  visible?: boolean;
}

/** Whether a candidate element should be part of the trapped tab order. */
export function isFocusCandidateEligible(candidate: FocusCandidate): boolean {
  if (candidate.disabled) return false;
  if (candidate.ariaHidden) return false;
  if (candidate.visible === false) return false;
  if ((candidate.tabIndex ?? 0) < 0) return false;
  return true;
}

export interface ResolveTabWrapParams {
  /** Number of focusable elements currently inside the trap. */
  count: number;
  /** Index of the currently focused element within that list, or -1 if focus is outside it. */
  currentIndex: number;
  shiftKey: boolean;
}

/**
 * Returns the index Tab/Shift+Tab should jump to when it would otherwise leave
 * the trap, or `null` when the default browser behavior (move to the next/previous
 * focusable element) is already correct and should not be intercepted.
 */
export function resolveTabWrap({ count, currentIndex, shiftKey }: ResolveTabWrapParams): number | null {
  if (count === 0) return null;

  if (shiftKey) {
    if (currentIndex <= 0) return count - 1;
    return null;
  }

  if (currentIndex === -1 || currentIndex >= count - 1) return 0;
  return null;
}
