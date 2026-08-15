import type { RequestTab } from '../../../tools/apiRequestBuilder/useApiRequestBuilder';

interface TabDef {
  id: RequestTab;
  label: string;
  count?: number;
}

interface RequestTabsProps {
  active: RequestTab;
  onChange: (tab: RequestTab) => void;
  paramsCount: number;
  headersCount: number;
  bodyActive: boolean;
  authActive: boolean;
}

export const RequestTabs = ({ active, onChange, paramsCount, headersCount, bodyActive, authActive }: RequestTabsProps) => {
  const tabs: TabDef[] = [
    { id: 'params', label: 'Params', count: paramsCount },
    { id: 'headers', label: 'Headers', count: headersCount },
    { id: 'body', label: 'Body' },
    { id: 'auth', label: 'Auth' },
  ];

  return (
    <div role="tablist" aria-label="Request configuration" className="flex items-center gap-1 border-b border-ink/10">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const showDot = (tab.id === 'body' && bodyActive) || (tab.id === 'auth' && authActive);
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-mono font-medium transition-colors ${
              isActive ? 'text-accent-blue' : 'text-secondary-text hover:text-ink'
            }`}
          >
            {tab.label}
            {!!tab.count && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ink/10 text-secondary-text">{tab.count}</span>}
            {showDot && <span className="size-1.5 rounded-full bg-accent-blue" aria-hidden="true" />}
            {isActive && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent-blue rounded-full" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
};
