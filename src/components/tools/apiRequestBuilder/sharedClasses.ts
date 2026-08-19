export const fieldClass =
  'w-full bg-ink/[0.03] border border-ink/10 hover:border-ink/20 focus:border-accent-blue focus:bg-ink/5 rounded-lg px-3 py-2 text-[13px] font-mono text-ink placeholder:text-secondary-text/50 focus:outline-none transition-colors';

// The <Select> equivalent of fieldClass — same surface, but laid out as a
// trigger button (label on the left, chevron pushed to the right).
export const selectTriggerClass =
  'w-full flex items-center justify-between gap-2 text-left bg-ink/[0.03] border border-ink/10 hover:border-ink/20 focus:border-accent-blue focus:bg-ink/5 rounded-lg px-3 py-2 text-[13px] font-mono text-ink focus:outline-none transition-colors';

export const labelClass ='text-[11px] font-mono text-secondary-text uppercase tracking-widest';

export const smallButtonClass =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border border-ink/10 hover:border-ink/20 hover:bg-ink/5 text-secondary-text hover:text-ink transition-colors disabled:opacity-40 disabled:pointer-events-none';

export const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-400',
  POST: 'text-amber-400',
  PUT: 'text-accent-blue',
  PATCH: 'text-accent-purple-text',
  DELETE: 'text-red-400',
  HEAD: 'text-secondary-text',
  OPTIONS: 'text-secondary-text',
};

export const statusColor = (status: number): string => {
  if (status >= 200 && status < 300) return 'text-emerald-400';
  if (status >= 300 && status < 400) return 'text-accent-blue';
  if (status >= 400 && status < 500) return 'text-amber-400';
  if (status >= 500) return 'text-red-400';
  return 'text-secondary-text';
};
