import { createContext, useContext } from 'react';

export type DbmlEffectiveTheme = 'dark' | 'light';

/**
 * React Flow nodes/edges (TableNode, RelationshipEdge) render inside the
 * library's own tree and can't receive extra props the way a normal child
 * would — some of their colors are also SVG/inline styles that a CSS class
 * can't override once set. Threading the resolved (non-"system") theme
 * through context, same pattern as TableActionsContext, lets them pick the
 * right literal color in JS instead.
 */
const DbmlThemeContext = createContext<DbmlEffectiveTheme>('dark');

export const DbmlThemeProvider = DbmlThemeContext.Provider;

export function useDbmlTheme(): DbmlEffectiveTheme {
  return useContext(DbmlThemeContext);
}
