import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyRound, Search, Table2 } from 'lucide-react';
import { useFocusTrap } from '../../../tools/dbmlDiagramBuilder/hooks/useFocusTrap';
import {
  buildSchemaSearchIndex,
  flattenSearchResults,
  moveActiveIndex,
  resultToFocusTarget,
  searchSchema,
  type FocusTarget,
  type SchemaSearchResult,
} from '../../../tools/dbmlDiagramBuilder/search/schemaSearch';
import type { DatabaseSchema } from '../../../tools/dbmlDiagramBuilder/types';

const SEARCH_DEBOUNCE_MS = 120;

interface TableSearchPaletteProps {
  schema: DatabaseSchema;
  onClose: () => void;
  onSelect: (target: FocusTarget) => void;
}

export function TableSearchPalette({ schema, onClose, onSelect }: TableSearchPaletteProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useFocusTrap(containerRef);

  // The index only depends on the parsed schema, so typing never re-derives
  // it — each keystroke just re-filters this already-flattened, already
  // lowercased list.
  const searchIndex = useMemo(() => buildSchemaSearchIndex(schema), [schema]);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query]);

  const results = useMemo(() => searchSchema(searchIndex, debouncedQuery), [searchIndex, debouncedQuery]);
  const flat = useMemo(() => flattenSearchResults(results), [results]);

  useEffect(() => setActiveIndex(0), [debouncedQuery]);

  const runResult = (result: SchemaSearchResult | undefined) => {
    if (!result) return;
    onSelect(resultToFocusTarget(result));
    onClose();
  };

  const hasQuery = query.trim().length > 0;

  return (
    <div
      className="absolute inset-0 z-50 flex items-start justify-center bg-black/50 pt-8 sm:pt-[15vh] px-4 pb-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Search tables and columns"
        className="w-full max-w-md max-h-full flex flex-col rounded-lg border border-slate-700 dbml-light:border-slate-200 bg-slate-900 dbml-light:bg-white shadow-2xl text-slate-100 dbml-light:text-slate-900 overflow-hidden outline-none"
      >
        <div className="flex items-center gap-2 px-3 border-b border-slate-800 dbml-light:border-slate-200 shrink-0">
          <Search size={15} className="text-slate-500 dbml-light:text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tables & columns…"
            aria-label="Search tables and columns"
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 dbml-light:placeholder:text-slate-400"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => moveActiveIndex(i, 1, flat.length));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => moveActiveIndex(i, -1, flat.length));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                runResult(flat[activeIndex]);
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
          />
          <kbd className="text-[10px] text-slate-500 dbml-light:text-slate-400 border border-slate-700 dbml-light:border-slate-300 rounded px-1 py-0.5">Esc</kbd>
        </div>
        <ul className="max-h-80 flex-1 min-h-0 overflow-y-auto scrollbar-thin py-1" role="listbox" aria-label="Search results">
          {hasQuery && flat.length === 0 && (
            <li className="px-4 py-6 text-sm text-slate-500 dbml-light:text-slate-400 text-center">No matching tables or columns</li>
          )}
          {!hasQuery && (
            <li className="px-4 py-6 text-sm text-slate-500 dbml-light:text-slate-400 text-center">
              Start typing to find a table or column
            </li>
          )}

          {results.tables.length > 0 && (
            <li role="presentation" className="px-3 pt-2 pb-1 text-[10px] font-sans font-semibold uppercase tracking-wide text-slate-500 dbml-light:text-slate-400">
              Tables
            </li>
          )}
          {results.tables.map((result) => {
            const resultIndex = flat.indexOf(result);
            return (
              <li key={result.key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={resultIndex === activeIndex}
                  onMouseEnter={() => setActiveIndex(resultIndex)}
                  onClick={() => runResult(result)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm ${
                    resultIndex === activeIndex ? 'bg-blue-600/20 text-white dbml-light:text-blue-900' : 'text-slate-300 dbml-light:text-slate-700'
                  }`}
                >
                  <Table2 size={14} className="shrink-0 text-blue-400" />
                  <span className="truncate font-mono">{result.table.qualifiedName}</span>
                </button>
              </li>
            );
          })}

          {results.columns.length > 0 && (
            <li role="presentation" className="px-3 pt-2 pb-1 text-[10px] font-sans font-semibold uppercase tracking-wide text-slate-500 dbml-light:text-slate-400">
              Columns
            </li>
          )}
          {results.columns.map((result) => {
            const resultIndex = flat.indexOf(result);
            return (
              <li key={result.key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={resultIndex === activeIndex}
                  onMouseEnter={() => setActiveIndex(resultIndex)}
                  onClick={() => runResult(result)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm ${
                    resultIndex === activeIndex ? 'bg-blue-600/20 text-white dbml-light:text-blue-900' : 'text-slate-300 dbml-light:text-slate-700'
                  }`}
                >
                  <span className="w-3.5 shrink-0 flex items-center justify-center text-amber-500">
                    {result.column.primaryKey && <KeyRound size={12} />}
                  </span>
                  <span className="truncate font-mono">{result.column.name}</span>
                  <span className="ml-auto shrink-0 text-slate-500 dbml-light:text-slate-400 text-[11px] pl-2 truncate max-w-[45%]">
                    {result.table.qualifiedName}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
