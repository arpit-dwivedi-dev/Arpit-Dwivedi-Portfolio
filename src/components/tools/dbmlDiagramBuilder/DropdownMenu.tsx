import { useRef, useState, type ReactNode } from 'react';
import { useOnClickOutside } from '../../../tools/dbmlDiagramBuilder/hooks/useOnClickOutside';

interface DropdownMenuProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
}

export function DropdownMenu({ trigger, children, align = 'left' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false), open);

  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          role="menu"
          className={`absolute z-40 mt-1.5 min-w-[200px] rounded-md border border-slate-700 bg-slate-900 py-1 shadow-lg shadow-black/30 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  onClick,
  icon,
  children,
  danger,
}: {
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-slate-800 focus-visible:bg-slate-800 focus-visible:outline-none ${
        danger ? 'text-red-400' : 'text-slate-200'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
