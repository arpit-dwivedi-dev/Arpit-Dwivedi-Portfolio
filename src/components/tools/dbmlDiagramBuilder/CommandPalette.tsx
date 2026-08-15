import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { Search } from 'lucide-react';

export interface Command {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  action: () => void;
  keywords?: string;
}

interface CommandPaletteProps {
  commands: Command[];
  onClose: () => void;
}

export function CommandPalette({ commands, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.keywords ?? ''}`.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => setActiveIndex(0), [query]);

  const run = (command: Command | undefined) => {
    if (!command) return;
    command.action();
    onClose();
  };

  return (
    // Anchored to the tool root (which tracks the visual viewport on phones)
    // so the on-screen keyboard can never cover the palette.
    <div
      className="absolute inset-0 z-50 flex items-start justify-center bg-black/50 pt-8 sm:pt-[15vh] px-4 pb-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-md max-h-full flex flex-col rounded-lg border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden"
      >
        <div className="flex items-center gap-2 px-3 border-b border-slate-800 shrink-0">
          <Search size={15} className="text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command…"
            aria-label="Search commands"
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-slate-500"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(0, i - 1));
              } else if (e.key === 'Enter') {
                run(filtered[activeIndex]);
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
          />
          <kbd className="text-[10px] text-slate-500 border border-slate-700 rounded px-1 py-0.5">Esc</kbd>
        </div>
        <ul className="max-h-72 flex-1 min-h-0 overflow-y-auto scrollbar-thin py-1" role="listbox">
          {filtered.length === 0 && <li className="px-4 py-6 text-sm text-slate-500 text-center">No matching commands</li>}
          {filtered.map((command, index) => {
            const Icon = command.icon;
            return (
              <li key={command.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => run(command)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm ${
                    index === activeIndex ? 'bg-blue-600/20 text-white' : 'text-slate-300'
                  }`}
                >
                  <Icon size={14} />
                  {command.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
