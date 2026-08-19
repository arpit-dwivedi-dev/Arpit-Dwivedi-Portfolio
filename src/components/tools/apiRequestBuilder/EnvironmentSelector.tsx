import { Globe, Settings } from 'lucide-react';
import type { Environment } from '../../../tools/apiRequestBuilder/environment';
import { Select } from '../../ui/Select';
import { smallButtonClass } from './sharedClasses';

interface EnvironmentSelectorProps {
  environments: Environment[];
  activeEnvironmentId: string | null;
  onSelect: (id: string | null) => void;
  onManage: () => void;
}

// A dropdown + a small manage button (rather than a permanent sidebar) so switching or editing
// environments never grows the main request editor — matches how the Timeout control sits inline
// in the toolbar just below it.
export const EnvironmentSelector = ({ environments, activeEnvironmentId, onSelect, onManage }: EnvironmentSelectorProps) => (
  <div className="inline-flex items-stretch">
    <Select
      id="api-environment"
      value={activeEnvironmentId ?? ''}
      onChange={(id) => onSelect(id || null)}
      options={[{ value: '', label: 'No Environment' }, ...environments.map((env) => ({ value: env.id, label: env.name }))]}
      ariaLabel="Active environment"
      title="Active environment — variables like {{baseUrl}} resolve from here. Values stay local to this browser."
      icon={<Globe size={13} aria-hidden="true" className="shrink-0" />}
      triggerClassName={`${smallButtonClass} rounded-r-none border-r-0 max-w-[200px]`}
      menuClassName="w-max min-w-full max-w-[240px] font-mono"
    />
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
