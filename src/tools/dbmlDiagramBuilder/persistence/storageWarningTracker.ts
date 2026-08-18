/**
 * Tracks whether the "storage might have failed" warning should be visible,
 * without depending on React. A save attempt is reported via the returned
 * function; `onChange` only fires on an actual true/false transition, so a
 * run of consecutive failures (e.g. a full-quota browser rejecting every
 * keystroke's autosave) reports once instead of on every attempt.
 */
export function createStorageWarningTracker(onChange: (warning: boolean) => void): (success: boolean) => void {
  let warning = false;
  return (success: boolean) => {
    const next = !success;
    if (next === warning) return;
    warning = next;
    onChange(next);
  };
}
