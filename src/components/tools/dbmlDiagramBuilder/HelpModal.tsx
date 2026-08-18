import { Modal } from './Modal';

const SHORTCUTS: [string, string][] = [
  ['Ctrl / Cmd + S', 'Save'],
  ['Ctrl / Cmd + O', 'Import a .dbml file'],
  ['Ctrl / Cmd + K', 'Open the command palette'],
  ['Ctrl / Cmd + Shift + F', 'Search tables & columns'],
  ['Ctrl / Cmd + Z', 'Undo (in the editor)'],
  ['Ctrl / Cmd + Shift + Z', 'Redo (in the editor)'],
  ['Ctrl / Cmd + F', 'Find in the editor'],
  ['Escape', 'Close the open dialog'],
];

export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Help & shortcuts" onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dbml-light:text-slate-500 mb-1.5">How it works</h3>
          <p className="text-slate-300 dbml-light:text-slate-700">
            Write DBML on the left — tables, columns, and <code className="text-blue-300">Ref</code> relationships —
            and the diagram on the right updates automatically. Drag any table to reposition it; your layout is
            remembered.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dbml-light:text-slate-500 mb-1.5">Keyboard shortcuts</h3>
          <dl className="space-y-1">
            {SHORTCUTS.map(([keys, desc]) => (
              <div key={keys} className="flex items-center justify-between gap-3">
                <dt className="text-slate-400 dbml-light:text-slate-500">{desc}</dt>
                <dd>
                  <kbd className="rounded border border-slate-700 dbml-light:border-slate-300 bg-slate-800 dbml-light:bg-slate-100 px-1.5 py-0.5 text-[11px] font-mono text-slate-300 dbml-light:text-slate-700">
                    {keys}
                  </kbd>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dbml-light:text-slate-500 mb-1.5">Everything stays local</h3>
          <p className="text-slate-300 dbml-light:text-slate-700">
            Your diagrams are stored in this browser's local storage — nothing is sent to a server. Sharing works by
            compressing your DBML into the link itself.
          </p>
        </div>
      </div>
    </Modal>
  );
}
