import { memo, type ReactNode } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { KeyRound, Link2, List, ListTree, MessageSquareText, Settings, Table2 } from 'lucide-react';
import { useTableActions } from './TableActionsContext';
import type { TableNode as TableNodeType } from '../../../tools/dbmlDiagramBuilder/diagram/buildNodes';
import {
  HEADER_HEIGHT,
  INDEX_ROW_HEIGHT,
  INDEX_SECTION_HEADER_HEIGHT,
  ROW_HEIGHT,
} from '../../../tools/dbmlDiagramBuilder/diagram/layout';
import { columnHandleId } from '../../../tools/dbmlDiagramBuilder/diagram/handles';

const dotHandleStyle = { opacity: 0, width: 8, height: 8, borderRadius: 9999 } as const;

// `top` is relative to the row <div> these handles live in (it is
// `position: relative`), NOT to the node — so it is always the row's own
// vertical center. Using a node-relative offset here silently doubles the
// offset and pushes lower rows' handles past the bottom of the table.
const HANDLE_TOP = ROW_HEIGHT / 2;

function ColumnHandles({ columnId, top }: { columnId: string; top: number }) {
  return (
    <>
      <Handle
        type="source"
        id={columnHandleId(columnId, 'left', 'source')}
        position={Position.Left}
        style={{ ...dotHandleStyle, top }}
      />
      <Handle
        type="target"
        id={columnHandleId(columnId, 'left', 'target')}
        position={Position.Left}
        style={{ ...dotHandleStyle, top }}
      />
      <Handle
        type="source"
        id={columnHandleId(columnId, 'right', 'source')}
        position={Position.Right}
        style={{ ...dotHandleStyle, top }}
      />
      <Handle
        type="target"
        id={columnHandleId(columnId, 'right', 'target')}
        position={Position.Right}
        style={{ ...dotHandleStyle, top }}
      />
    </>
  );
}

/**
 * `nodrag`/`nopan` stop React Flow from treating the press as a node drag, and
 * stopPropagation keeps the click from also selecting the node underneath.
 */
function HeaderButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      // 24px keeps the two header actions tappable on a phone without
      // outgrowing the 36px table header.
      className="nodrag nopan shrink-0 w-6 h-6 flex items-center justify-center rounded text-white/85 hover:text-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function TableNodeImpl({ data, selected }: NodeProps<TableNodeType>) {
  const {
    tableId,
    name,
    schema: schemaName,
    qualifiedName,
    columns,
    indexes,
    note,
    color,
    fkColumnNames,
    recordCount,
    enumsByType,
    searchFocused,
    highlightedColumnId,
  } = data;
  const headerColor = color || '#2563eb';
  const actions = useTableActions();

  return (
    <div
      className={`rounded-md border bg-slate-900 dbml-light:bg-white shadow-sm text-[13px] font-mono overflow-hidden ${
        selected || searchFocused ? 'border-blue-500 ring-2 ring-blue-500/40' : 'border-slate-700 dbml-light:border-slate-300'
      }`}
      style={{ width: '100%' }}
    >
      <div
        className="flex items-center gap-1.5 px-2.5 text-white font-sans font-semibold"
        style={{ height: HEADER_HEIGHT, background: headerColor }}
        title={qualifiedName}
      >
        {schemaName && (
          <span
            className="shrink-0 max-w-[35%] truncate rounded bg-black/25 px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/80"
            aria-label={`Schema: ${schemaName}`}
          >
            {schemaName}
          </span>
        )}
        <span className="truncate min-w-0">{name}</span>
        {note && <MessageSquareText size={12} className="shrink-0 opacity-80" aria-label="Has note" />}
        {actions && (
          <span className="ml-auto flex items-center gap-0.5">
            <HeaderButton
              label={
                recordCount > 0
                  ? `View ${recordCount} record${recordCount === 1 ? '' : 's'} in ${qualifiedName}`
                  : `View records in ${qualifiedName}`
              }
              onClick={() => actions.viewRecords(tableId)}
            >
              <Table2 size={13} />
            </HeaderButton>
            <HeaderButton label={`Edit table ${qualifiedName}`} onClick={() => actions.editTable(tableId)}>
              <Settings size={13} />
            </HeaderButton>
          </span>
        )}
      </div>
      <div>
        {columns.map((col, idx) => {
          const isFk = fkColumnNames.includes(col.name);
          const baseType = col.type.replace(/\[\]$/, '').toLowerCase();
          const columnEnum = enumsByType[baseType];
          const title = [
            col.note ? `${col.name}: ${col.note}` : undefined,
            columnEnum ? `${columnEnum.name}: ${columnEnum.values.map((v) => v.name).join(', ')}` : undefined,
          ]
            .filter(Boolean)
            .join('\n');
          const isSearchHighlighted = col.id === highlightedColumnId;
          return (
            <div
              key={col.id}
              className={`relative flex items-center gap-1.5 px-2.5 border-t border-slate-800 dbml-light:border-slate-100 hover:bg-slate-800/60 dbml-light:hover:bg-slate-50 ${
                isSearchHighlighted ? 'animate-pulse bg-blue-500/25 dbml-light:bg-blue-100' : ''
              }`}
              style={{ height: ROW_HEIGHT }}
              title={title || undefined}
            >
              <ColumnHandles columnId={col.id} top={HANDLE_TOP} />
              <span className="w-3.5 shrink-0 flex items-center justify-center text-amber-500">
                {col.primaryKey ? <KeyRound size={12} /> : isFk ? <Link2 size={11} className="text-sky-500" /> : null}
              </span>
              <span className={`truncate ${col.primaryKey ? 'font-semibold text-slate-100 dbml-light:text-slate-900' : 'text-slate-300 dbml-light:text-slate-700'}`}>
                {col.name}
              </span>
              {col.notNull && !col.primaryKey && <span className="text-rose-500 text-[10px] leading-none">*</span>}
              {columnEnum && (
                <span className="shrink-0 flex items-center text-violet-500" aria-label={`Enum: ${columnEnum.name}`}>
                  <List size={11} />
                </span>
              )}
              <span className="ml-auto shrink-0 text-slate-500 dbml-light:text-slate-400 text-[11px] pl-2 truncate max-w-[45%]">{col.type}</span>
            </div>
          );
        })}
        {columns.length === 0 && (
          <div className="px-2.5 text-slate-500 dbml-light:text-slate-400 italic" style={{ height: ROW_HEIGHT, lineHeight: `${ROW_HEIGHT}px` }}>
            No columns
          </div>
        )}
      </div>
      {indexes.length > 0 && (
        <div className="border-t border-slate-800 dbml-light:border-slate-200">
          <div
            className="flex items-center gap-1 px-2.5 bg-slate-800 dbml-light:bg-slate-50 text-slate-400 dbml-light:text-slate-500 font-sans font-semibold text-[10px] uppercase tracking-wide"
            style={{ height: INDEX_SECTION_HEADER_HEIGHT }}
          >
            <ListTree size={10} />
            <span>Indexes</span>
          </div>
          {indexes.map((idx) => (
            <div
              key={idx.id}
              className="flex items-center gap-1.5 px-2.5 border-t border-slate-800 dbml-light:border-slate-100 text-slate-400 dbml-light:text-slate-600"
              style={{ height: INDEX_ROW_HEIGHT }}
              title={idx.name}
            >
              <span className="truncate">{idx.columns.join(', ')}</span>
              {idx.unique && (
                <span className="ml-auto shrink-0 text-[10px] font-sans font-semibold text-amber-600">UNIQUE</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const TableNode = memo(TableNodeImpl);
