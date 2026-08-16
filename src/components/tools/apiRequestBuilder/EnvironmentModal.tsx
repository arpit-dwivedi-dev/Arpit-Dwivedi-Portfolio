import { useEffect, useMemo, useState } from 'react';
import { Info, Plus, Trash2 } from 'lucide-react';
import {
  createEnvironmentVariable,
  sanitizeVariables,
  type Environment,
  type EnvironmentVariable,
} from '../../../tools/apiRequestBuilder/environment';
import { Modal } from './Modal';
import { fieldClass, labelClass } from './sharedClasses';

interface EnvironmentModalProps {
  open: boolean;
  onClose: () => void;
  environments: Environment[];
  onCreate: () => Environment;
  onChange: (environment: Environment) => void;
  onDelete: (id: string) => void;
}

export const EnvironmentModal = ({ open, onClose, environments, onCreate, onChange, onDelete }: EnvironmentModalProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Kept separate from `environments` (which is already sanitized on every persist) so a variable
  // row mid-edit — a blank name being typed, or a name that briefly matches another row's — stays
  // visible instead of vanishing the instant it round-trips through storage.
  const [draftName, setDraftName] = useState('');
  const [draftVariables, setDraftVariables] = useState<EnvironmentVariable[]>([]);

  useEffect(() => {
    if (!open) return;
    if (!selectedId || !environments.some((e) => e.id === selectedId)) {
      setSelectedId(environments[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, environments]);

  useEffect(() => {
    const env = environments.find((e) => e.id === selectedId);
    setDraftName(env?.name ?? '');
    setDraftVariables(env?.variables ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const selectedEnvironment = environments.find((e) => e.id === selectedId) ?? null;

  // Rows whose trimmed name collides with a later row — sanitizeVariables keeps the last one, so
  // these are the ones that get silently dropped from what's actually persisted/resolved.
  const overriddenRowIds = useMemo(() => {
    const lastRowIdForKey = new Map<string, string>();
    for (const row of draftVariables) {
      const key = row.key.trim();
      if (key) lastRowIdForKey.set(key, row.id);
    }
    const overridden = new Set<string>();
    for (const row of draftVariables) {
      const key = row.key.trim();
      if (key && lastRowIdForKey.get(key) !== row.id) overridden.add(row.id);
    }
    return overridden;
  }, [draftVariables]);

  const commitVariables = (next: EnvironmentVariable[]) => {
    setDraftVariables(next);
    if (!selectedEnvironment) return;
    onChange({ ...selectedEnvironment, variables: sanitizeVariables(next) });
  };

  const handleRename = (name: string) => {
    setDraftName(name);
    if (!selectedEnvironment || !name.trim()) return;
    onChange({ ...selectedEnvironment, name });
  };

  const handleCreate = () => {
    const created = onCreate();
    setSelectedId(created.id);
  };

  const handleAddVariable = () => commitVariables([...draftVariables, createEnvironmentVariable()]);

  const handleUpdateVariable = (id: string, patch: Partial<EnvironmentVariable>) =>
    commitVariables(draftVariables.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const handleRemoveVariable = (id: string) => commitVariables(draftVariables.filter((v) => v.id !== id));

  return (
    <Modal open={open} onClose={onClose} titleId="environment-manager-heading" title="Environments" maxWidthClassName="max-w-2xl">
      <div className="flex items-start gap-2 rounded-lg border border-accent-blue/20 bg-accent-blue/5 p-2 sm:p-2.5 mb-3 text-xs text-secondary-text leading-snug">
        <Info size={14} className="shrink-0 mt-0.5 text-accent-blue" aria-hidden="true" />
        <p>
          Environment variables are stored in this browser's local storage only — never synced or sent anywhere except
          substituted into your own requests. Local storage is <strong className="text-ink">not encrypted</strong>, so treat this
          browser as sensitive if you keep real secrets here.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="sm:w-44 shrink-0">
          <p className={`${labelClass} block mb-1.5`}>Environments</p>
          {environments.length === 0 && <p className="text-xs text-secondary-text mb-2">None yet.</p>}
          <ul className="space-y-1 mb-2 max-h-56 overflow-y-auto scrollbar-thin">
            {environments.map((env) => (
              <li key={env.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedId(env.id)}
                  aria-current={env.id === selectedId}
                  className={`flex-1 min-w-0 text-left px-2.5 py-1.5 rounded-lg text-sm truncate transition-colors ${
                    env.id === selectedId ? 'bg-accent-blue/10 text-accent-blue font-medium' : 'text-secondary-text hover:text-ink hover:bg-ink/5'
                  }`}
                >
                  {env.name || 'Untitled'}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(env.id)}
                  aria-label={`Delete environment ${env.name}`}
                  className="shrink-0 p-1.5 rounded-lg text-secondary-text hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-accent-blue hover:text-accent-blue/80 transition-colors"
          >
            <Plus size={14} aria-hidden="true" />
            New environment
          </button>
        </div>

        <div className="flex-1 min-w-0 border-t sm:border-t-0 sm:border-l border-ink/10 pt-4 sm:pt-0 sm:pl-4">
          {!selectedEnvironment ? (
            <p className="text-sm text-secondary-text py-4">
              Create an environment to define reusable variables like <code className="font-mono text-ink">{'{{baseUrl}}'}</code>{' '}
              or <code className="font-mono text-ink">{'{{token}}'}</code>.
            </p>
          ) : (
            <>
              <label htmlFor="environment-name" className={`${labelClass} block mb-1.5`}>
                Name
              </label>
              <input
                id="environment-name"
                type="text"
                value={draftName}
                onChange={(e) => handleRename(e.target.value)}
                placeholder="e.g. Staging"
                className={`${fieldClass} mb-4`}
              />

              <p className={`${labelClass} block mb-1.5`}>Variables</p>
              <div className="space-y-2">
                {draftVariables.length === 0 && <p className="text-sm text-secondary-text py-1">No variables yet.</p>}
                {draftVariables.map((row, idx) => (
                  <div key={row.id}>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={row.key}
                        onChange={(e) => handleUpdateVariable(row.id, { key: e.target.value })}
                        placeholder="e.g. baseUrl"
                        aria-label={`Variable ${idx + 1} name`}
                        spellCheck={false}
                        className={`${fieldClass} flex-1`}
                      />
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) => handleUpdateVariable(row.id, { value: e.target.value })}
                        placeholder="Value"
                        aria-label={`Variable ${idx + 1} value`}
                        spellCheck={false}
                        className={`${fieldClass} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVariable(row.id)}
                        aria-label={`Delete variable ${idx + 1}`}
                        className="shrink-0 p-2 rounded-lg text-secondary-text hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                    {overriddenRowIds.has(row.id) && (
                      <p className="text-xs text-amber-400 mt-1">
                        Duplicate name — a later row named "{row.key.trim()}" overrides this one.
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddVariable}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-accent-blue hover:text-accent-blue/80 transition-colors mt-3"
              >
                <Plus size={14} aria-hidden="true" />
                Add variable
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-bold bg-accent-blue text-bg-pure hover:glow-blue transition-all"
        >
          Done
        </button>
      </div>
    </Modal>
  );
};
