import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../../tools/dbmlDiagramBuilder/hooks/useFocusTrap';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  widthClass?: string;
}

export function Modal({ title, onClose, children, footer, widthClass = 'max-w-md' }: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    // `absolute`, not `fixed`: the tool's root is sized to the *visual*
    // viewport on phones, so anchoring to it keeps a dialog inside the area the
    // on-screen keyboard leaves visible instead of centring it behind one.
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${widthClass} rounded-lg border border-slate-700 dbml-light:border-slate-200 bg-slate-900 dbml-light:bg-white shadow-xl text-slate-100 dbml-light:text-slate-900 max-h-full flex flex-col outline-none`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 dbml-light:border-slate-200 shrink-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto scrollbar-thin flex-1 min-h-0">{children}</div>
        {footer && <div className="px-4 py-3 border-t border-slate-800 dbml-light:border-slate-200 flex justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
