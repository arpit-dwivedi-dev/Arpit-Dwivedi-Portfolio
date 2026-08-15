import { createContext, useContext } from 'react';

export interface TableActions {
  /** Open the read-only data viewer for a table's `Records` rows. */
  viewRecords: (tableName: string) => void;
  /** Open the settings dialog (currently: rename the table). */
  editTable: (tableName: string) => void;
}

/**
 * Header-button handlers are passed to TableNode through context rather than
 * through node data: React Flow diffs `data` to decide what to re-render, and
 * a fresh callback identity on every parse would invalidate every node.
 */
const TableActionsContext = createContext<TableActions | null>(null);

export const TableActionsProvider = TableActionsContext.Provider;

export function useTableActions(): TableActions | null {
  return useContext(TableActionsContext);
}
