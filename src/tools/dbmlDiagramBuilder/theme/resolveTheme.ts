import type { UiPrefs } from '../persistence/localStorage';

export type DbmlTheme = UiPrefs['theme'];
export type DbmlEffectiveTheme = 'dark' | 'light';

/**
 * "system" isn't a real paint state — it resolves to whichever of dark/light
 * the OS/browser currently reports, and stays reactive to that as it changes
 * (the caller re-derives this on every render from a `prefers-color-scheme`
 * media query match, e.g. useMediaQuery in useDbmlWorkspace).
 */
export function resolveEffectiveTheme(theme: DbmlTheme, systemPrefersDark: boolean): DbmlEffectiveTheme {
  if (theme === 'system') return systemPrefersDark ? 'dark' : 'light';
  return theme;
}

/**
 * Single source of truth for the dark → light → system → dark cycle, shared
 * by the Header's theme button and the command palette's "Toggle Theme"
 * command so the two can't drift out of sync (one only cycling dark/light
 * while the other also offers system).
 */
export function cycleDbmlTheme(theme: DbmlTheme): DbmlTheme {
  if (theme === 'dark') return 'light';
  if (theme === 'light') return 'system';
  return 'dark';
}

export function monacoThemeFor(effectiveTheme: DbmlEffectiveTheme): 'dbml-dark' | 'dbml-light' {
  return effectiveTheme === 'dark' ? 'dbml-dark' : 'dbml-light';
}
