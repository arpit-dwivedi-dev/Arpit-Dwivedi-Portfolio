import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
  ariaDescribedBy?: string;
  ariaLabel?: string;
  title?: string;
  /** Leading icon inside the trigger (e.g. the toolbar chips' Clock/Globe). */
  icon?: ReactNode;
  /** Replaces the default form-field trigger styling outright — pass this for
   *  the compact toolbar "chip" variant rather than fighting the defaults. */
  triggerClassName?: string;
  /** Replaces the popup's default `w-full` sizing. A narrow chip trigger needs
   *  a menu wider than itself (`w-max min-w-full`), a form field does not. */
  menuClassName?: string;
}

// Native <select> popups can't be themed cross-browser (Chrome/Firefox render
// the option list with OS-controlled colors, ignoring our dark theme) — this
// is a custom listbox following the WAI-ARIA APG "listbox popup" pattern:
// focus stays on the trigger button the whole time, arrow keys move a
// virtual "active" option via aria-activedescendant, and options are plain
// (non-focusable) list items so Tab never stops on them individually.
const defaultTriggerClass =
  'w-full flex items-center justify-between gap-2 bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-ink hover:border-ink/20 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

export const Select = ({
  id,
  value,
  onChange,
  options,
  disabled,
  className = '',
  ariaDescribedBy,
  ariaLabel,
  title,
  icon,
  triggerClassName,
  menuClassName,
}: SelectProps) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex];
  const listboxId = id ? `${id}-listbox` : undefined;
  const optionId = (index: number) => `${id ?? 'select'}-option-${index}`;

  const openAt = (index: number) => {
    setActiveIndex(Math.max(0, Math.min(index, options.length - 1)));
    setOpen(true);
  };

  const commit = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleTriggerKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openAt(selectedIndex >= 0 ? selectedIndex : 0);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        commit(activeIndex);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openAt(selectedIndex >= 0 ? selectedIndex : 0))}
        onKeyDown={handleTriggerKeyDown}
        onBlur={() => setOpen(false)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open ? optionId(activeIndex) : undefined}
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        title={title}
        className={triggerClassName ?? defaultTriggerClass}
      >
        {icon}
        <span className="truncate">{selected?.label ?? '—'}</span>
        <ChevronDown size={16} className={`text-secondary-text transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listboxId}
            role="listbox"
            // Prevents the browser's default mousedown-blurs-current-focus
            // behavior — without this, clicking an option blurs the trigger
            // (closing the panel via onBlur) before the option's onClick
            // ever fires, so the selection would silently never commit.
            onMouseDown={(e) => e.preventDefault()}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-20 mt-2 py-1.5 rounded-xl bg-bg-secondary border border-ink/10 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.5)] overflow-hidden ${menuClassName ?? 'w-full'}`}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={option.value === value}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(index)}
                className={`flex items-center justify-between gap-2 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                  index === activeIndex ? 'bg-ink/10' : ''
                } ${option.value === value ? 'text-accent-blue' : 'text-ink'}`}
              >
                {option.label}
                {option.value === value && <Check size={14} aria-hidden="true" />}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
