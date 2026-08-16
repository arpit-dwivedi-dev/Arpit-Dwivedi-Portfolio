import { Globe, Settings } from 'lucide-react';
import type { Environment } from '../../../tools/apiRequestBuilder/environment';
import { smallButtonClass } from './sharedClasses';

interface EnvironmentSelectorProps {
  environments: Environment[];
  activeEnvironmentId: string | null;
  onSelect: (id: string | null) => void;
  onManage: () => void;
  /** Matches the Timeout select's `colorScheme` fix so this native dropdown also renders with
   *  correctly themed option text in dark mode instead of the browser's light-mode default. */
  theme?: 'light' | 'dark';
}

// A dropdown + a small manage button (rather than a permanent sidebar) so switching or editing
// environments never grows the main request editor — matches how the Timeout control sits inline
// in the toolbar just below it.
export const EnvironmentSelector = ({ environments, activeEnvironmentId, onSelect, onManage, theme }: EnvironmentSelectorProps) => (
  <div className="inline-flex items-stretch">
    <label
      className={`${smallButtonClass} rounded-r-none border-r-0 cursor-pointer`}
      title="Active environment — variables like {{baseUrl}} resolve from here. Values stay local to this browser."
    >
      <Globe size={13} aria-hidden="true" />
      <select
        value={activeEnvironmentId ?? ''}
        onChange={(e) => onSelect(e.target.value || null)}
        aria-label="Active environment"
        style={theme ? { colorScheme: theme } : undefined}
        className="bg-transparent border-none text-xs font-mono font-medium focus:outline-none cursor-pointer appearance-none max-w-[110px] truncate"
      >
        <option value="">No Environment</option>
        {environments.map((env) => (
          <option key={env.id} value={env.id}>
            {env.name}
          </option>
        ))}
      </select>
    </label>
    <button
      type="button"
      onClick={onManage}
      aria-label="Manage environments"
      title="Manage environments"
      className={`${smallButtonClass} rounded-l-none`}
    >
      <Settings size={13} aria-hidden="true" />
    </button>
  </div>
);
