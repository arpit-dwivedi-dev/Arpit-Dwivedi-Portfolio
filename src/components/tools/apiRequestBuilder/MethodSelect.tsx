import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { HTTP_METHODS, type HttpMethod } from '../../../tools/apiRequestBuilder/types';
import { METHOD_COLORS } from './sharedClasses';

interface MethodSelectProps {
  value: HttpMethod;
  onChange: (method: HttpMethod) => void;
}

// Custom listbox (same WAI-ARIA APG pattern as components/ui/Select) rather than
// a native <select> — needed here so each method can carry its own color.
export const MethodSelect = ({ value, onChange }: MethodSelectProps) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const commit = (index: number) => {
    onChange(HTTP_METHODS[index]);
    setOpen(false);
  };

  const onKeyDown = (e: { key: string; preventDefault: () => void }) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setActiveIndex(HTTP_METHODS.indexOf(value));
        setOpen(true);
      } else {
        setActiveIndex((i) => Math.min(i + 1, HTTP_METHODS.length - 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (open) setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open) commit(activeIndex);
      else setOpen(true);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`flex items-center gap-1.5 h-full min-w-[108px] px-3 py-2.5 rounded-l-xl border border-ink/10 bg-bg-secondary hover:bg-ink/5 font-mono font-bold text-sm ${METHOD_COLORS[value]} transition-colors focus:outline-none focus:border-accent-blue`}
      >
        {value}
        <ChevronDown size={14} aria-hidden="true" className="ml-auto text-secondary-text" />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-activedescendant={`method-option-${activeIndex}`}
          className="absolute left-0 top-[calc(100%+4px)] z-30 w-40 rounded-xl border border-ink/10 bg-bg-secondary shadow-2xl py-1.5 overflow-hidden"
        >
          {HTTP_METHODS.map((method, idx) => (
            <li
              key={method}
              id={`method-option-${idx}`}
              role="option"
              aria-selected={method === value}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => commit(idx)}
              className={`px-3 py-2 font-mono font-bold text-sm cursor-pointer ${METHOD_COLORS[method]} ${
                idx === activeIndex ? 'bg-ink/10' : ''
              }`}
            >
              {method}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
