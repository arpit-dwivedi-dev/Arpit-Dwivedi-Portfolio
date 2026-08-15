import { Table2 } from 'lucide-react';
import { Modal } from './Modal';
import type { ColumnSchema, TableRecords } from '../../../tools/dbmlDiagramBuilder/types';

interface RecordsModalProps {
  tableName: string;
  columns: ColumnSchema[];
  records: TableRecords[];
  onClose: () => void;
}

/** Renders `null` distinctly from the literal string "null". */
function Cell({ value }: { value: string | null }) {
  if (value === null) return <span className="text-slate-500 italic">(null)</span>;
  if (value === '') return <span className="text-slate-500 italic">(empty)</span>;
  return <span className="text-slate-100">{value}</span>;
}

export function RecordsModal({ tableName, columns, records, onClose }: RecordsModalProps) {
  const typeByColumn = new Map(columns.map((c) => [c.name.toLowerCase(), c.type]));
  const totalRows = records.reduce((sum, block) => sum + block.rows.length, 0);

  return (
    <Modal
      title={`Records · ${tableName}`}
      onClose={onClose}
      widthClass="max-w-3xl"
      footer={
        <span className="text-xs text-slate-400 mr-auto">
          {totalRows === 0 ? 'No rows' : `${totalRows} row${totalRows === 1 ? '' : 's'}`}
        </span>
      }
    >
      {records.length === 0 ? (
        <div className="text-center py-8">
          <Table2 size={28} className="mx-auto text-slate-600 mb-3" />
          <p className="text-sm text-slate-300 mb-1">No records defined for “{tableName}”.</p>
          <p className="text-xs text-slate-500 mb-4">Add a Records block in the editor to seed sample rows.</p>
          <pre className="text-left text-[11px] font-mono bg-slate-950 border border-slate-800 rounded p-3 overflow-x-auto text-slate-400">
            {`Records ${tableName}(${columns.slice(0, 3).map((c) => c.name).join(', ') || 'id'}) {\n  ${
              columns.slice(0, 3).map(() => '…').join(', ') || '…'
            }\n}`}
          </pre>
        </div>
      ) : (
        <div className="space-y-6">
          {records.map((block, blockIndex) => (
            <div key={`${block.line}-${blockIndex}`}>
              {records.length > 1 && (
                <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">
                  Block {blockIndex + 1} · line {block.line}
                </p>
              )}
              <div className="overflow-x-auto rounded border border-slate-800">
                <table className="w-full text-xs font-mono border-collapse">
                  <thead>
                    <tr className="bg-slate-950/70">
                      <th className="px-2 py-2 text-right font-normal text-slate-600 w-10 border-b border-slate-800">
                        #
                      </th>
                      {block.columns.map((col) => (
                        <th
                          key={col}
                          className="px-3 py-2 text-left border-b border-slate-800 whitespace-nowrap"
                        >
                          <span className="text-slate-200 font-semibold">{col}</span>
                          <span className="block text-[10px] text-slate-500 font-normal">
                            {typeByColumn.get(col.toLowerCase()) ?? 'unknown column'}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="odd:bg-slate-900/40 hover:bg-slate-800/50">
                        <td className="px-2 py-1.5 text-right text-slate-600 border-b border-slate-800/60">
                          {rowIndex + 1}
                        </td>
                        {block.columns.map((col, colIndex) => (
                          <td
                            key={col}
                            className="px-3 py-1.5 border-b border-slate-800/60 whitespace-nowrap"
                          >
                            {colIndex < row.length ? (
                              <Cell value={row[colIndex]} />
                            ) : (
                              <span className="text-amber-500/70 italic">(missing)</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {block.rows.length === 0 && (
                <p className="text-xs text-slate-500 mt-2">This block has no rows.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
