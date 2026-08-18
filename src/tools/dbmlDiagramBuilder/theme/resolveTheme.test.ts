import { cycleDbmlTheme, monacoThemeFor, resolveEffectiveTheme, type DbmlTheme } from './resolveTheme';

describe('resolveEffectiveTheme', () => {
  test('dark and light pass through regardless of system preference', () => {
    expect(resolveEffectiveTheme('dark', true)).toBe('dark');
    expect(resolveEffectiveTheme('dark', false)).toBe('dark');
    expect(resolveEffectiveTheme('light', true)).toBe('light');
    expect(resolveEffectiveTheme('light', false)).toBe('light');
  });

  test('system resolves to whatever the OS/browser currently prefers', () => {
    expect(resolveEffectiveTheme('system', true)).toBe('dark');
    expect(resolveEffectiveTheme('system', false)).toBe('light');
  });
});

describe('cycleDbmlTheme', () => {
  test('cycles dark -> light -> system -> dark', () => {
    expect(cycleDbmlTheme('dark')).toBe('light');
    expect(cycleDbmlTheme('light')).toBe('system');
    expect(cycleDbmlTheme('system')).toBe('dark');
  });

  test('is the single cycle used by both the Header button and the command palette', () => {
    // Regression guard: the command palette's "Toggle Theme" command used to
    // hardcode a dark/light-only toggle while the Header supported all three
    // states — asserting the full cycle here (rather than each caller
    // reimplementing it) is what keeps them from drifting apart again.
    const seen: DbmlTheme[] = ['dark'];
    while (seen.length < 4) {
      seen.push(cycleDbmlTheme(seen[seen.length - 1]));
    }
    expect(seen).toEqual(['dark', 'light', 'system', 'dark']);
  });
});

describe('monacoThemeFor', () => {
  test('maps the resolved (non-system) theme to the registered Monaco theme names', () => {
    expect(monacoThemeFor('dark')).toBe('dbml-dark');
    expect(monacoThemeFor('light')).toBe('dbml-light');
  });

  test('composes with resolveEffectiveTheme for the "system" case', () => {
    expect(monacoThemeFor(resolveEffectiveTheme('system', true))).toBe('dbml-dark');
    expect(monacoThemeFor(resolveEffectiveTheme('system', false))).toBe('dbml-light');
  });
});
