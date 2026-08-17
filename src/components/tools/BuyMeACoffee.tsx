import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { registerSupportModalOpen, useSupportPrompt } from './supportPrompt';

// Single source of truth for the support/tip destination — every tool's
// "buy me a coffee" button renders the same UPI QR from these.
const UPI_ID = 'marpit697.ad@ybl';
const UPI_PAYEE_NAME = 'Arpit Dwivedi';
export const UPI_LINK = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_PAYEE_NAME)}&cu=INR`;

/** Button shapes the tools actually use:
 *  - `block`   full-width row inside a sidebar/actions stack
 *  - `blockSm` same, compact (smaller type, used in dense panels)
 *  - `pill`    inline pill in a results toolbar; label hides under `sm`
 *  - `icon`    icon-only square, for tight toolbars (label → tooltip/aria) */
export type BuyMeACoffeeVariant = 'block' | 'blockSm' | 'pill' | 'icon';

const BASE =
  'bg-[#FFDD00]/10 text-[#FFDD00] font-bold hover:bg-[#FFDD00]/20 transition-all focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure';

const VARIANTS: Record<BuyMeACoffeeVariant, { className: string; iconSize: number }> = {
  block: { className: `${BASE} w-full py-3 rounded-xl flex items-center justify-center gap-2`, iconSize: 16 },
  blockSm: { className: `${BASE} w-full py-2 rounded-xl text-xs flex items-center justify-center gap-1.5`, iconSize: 14 },
  pill: {
    className: `${BASE} inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm`,
    iconSize: 16,
  },
  icon: {
    className:
      'flex items-center px-3 border-y border-r border-[#FFDD00]/30 bg-[#FFDD00]/10 text-[#FFDD00] hover:bg-[#FFDD00]/20 transition-colors',
    iconSize: 16,
  },
};

/** Copy for the support card. Every field is overridable so localized pages can
 *  pass translated strings; the defaults are the English source of truth. */
export interface SupportCopy {
  title: string;
  subtitle: string;
  /** Second line under the subtitle. Omitted when a page overrides `subtitle`
   *  with a single self-contained sentence. */
  supporting?: string;
  cta: string;
  qrHint: string;
  footer: string;
  closeLabel: string;
}

export const DEFAULT_SUPPORT_COPY: SupportCopy = {
  title: '☕ Support this free tool',
  subtitle: 'This tool is free, with no signup, ads, or paywall.',
  supporting: 'If it saved you some time, you can help keep it running.',
  cta: '☕ Support the project',
  qrHint: 'Or scan the QR code',
  footer: 'Thank you for supporting independent tools ❤️',
  closeLabel: 'Close',
};

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
  copy?: Partial<SupportCopy>;
  /** Unique per page — the dialog's aria-labelledby target. */
  titleId?: string;
}

/** The compact support card. Shared by the manual button below and the
 *  post-use auto prompt, so there is exactly one popup implementation. */
export const SupportModal = ({ open, onClose, copy, titleId }: SupportModalProps) => {
  const generatedId = useId();
  const headingId = titleId ?? `support-modal-heading-${generatedId}`;
  const bodyId = `support-modal-body-${generatedId}`;
  const c = { ...DEFAULT_SUPPORT_COPY, ...copy };

  const cardRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Held in a ref so the effect below depends only on `open` — an inline
  // onClose would otherwise re-run it on every parent render, stealing focus
  // back to the close button mid-interaction.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const unregister = registerSupportModalOpen();
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      // Keep Tab inside the dialog — the tool behind it stays untouchable
      // while the card is up, and focus can't escape to a hidden control.
      const focusable = cardRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      unregister();
      previouslyFocused?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[2px] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            ref={cardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            aria-describedby={bodyId}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[420px] max-h-[90dvh] overflow-y-auto rounded-2xl bg-bg-secondary border border-ink/10 px-5 py-5 sm:px-6 sm:py-6 shadow-2xl shadow-black/40 ring-1 ring-[#FFDD00]/10 text-center"
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label={c.closeLabel}
              className="absolute top-3 right-3 p-2 rounded-lg text-secondary-text hover:text-ink hover:bg-ink/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            >
              <X size={18} aria-hidden="true" />
            </button>

            <h2 id={headingId} className="text-base sm:text-lg font-bold text-ink pr-10 text-left sm:text-center">
              {c.title}
            </h2>

            <div id={bodyId} className="mt-2 space-y-1 text-sm text-secondary-text text-left sm:text-center">
              <p>{c.subtitle}</p>
              {c.supporting && <p>{c.supporting}</p>}
            </div>

            <a
              href={UPI_LINK}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#FFDD00]/15 text-[#FFDD00] font-bold text-sm border border-[#FFDD00]/25 hover:bg-[#FFDD00]/25 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-secondary"
            >
              {c.cta}
            </a>

            <p className="mt-4 text-xs text-secondary-text">{c.qrHint}</p>

            <div className="mt-3 flex justify-center">
              <div className="p-3 rounded-xl bg-white">
                <QRCodeSVG
                  value={UPI_LINK}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                  includeMargin={false}
                  title="UPI payment QR code"
                />
              </div>
            </div>

            <p className="mt-4 text-[11px] text-secondary-text/70">{c.footer}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/** Mount once per tool page. Opens the support card a moment after the tool
 *  reports a successful use (see notifyToolUsed) — never on first load — and
 *  stays quiet for 14 days once dismissed. */
export const SupportPrompt = ({ copy, titleId }: { copy?: Partial<SupportCopy>; titleId?: string }): ReactNode => {
  const { open, close } = useSupportPrompt();
  return <SupportModal open={open} onClose={close} copy={copy} titleId={titleId} />;
};

interface BuyMeACoffeeProps {
  variant?: BuyMeACoffeeVariant;
  /** Button label. Hidden (aria-label only) for the `icon` variant. */
  label?: string;
  modalHeading?: string;
  modalBody?: string;
  closeLabel?: string;
  /** Unique per page — the dialog's aria-labelledby target. */
  titleId?: string;
  /** Extra classes on the trigger (layout/order concerns owned by the page). */
  className?: string;
  /** Hide the label below the `sm` breakpoint (the results-toolbar pill). */
  hideLabelOnMobile?: boolean;
}

export const BuyMeACoffee = ({
  variant = 'block',
  label = 'Buy me a coffee',
  modalHeading,
  modalBody,
  closeLabel,
  titleId = 'upi-modal-heading',
  className = '',
  hideLabelOnMobile = false,
}: BuyMeACoffeeProps) => {
  const [open, setOpen] = useState(false);
  const { className: variantClass, iconSize } = VARIANTS[variant];

  // A page-supplied body is a complete sentence on its own (localized copy),
  // so it replaces both default body lines rather than stacking with them.
  const copy: Partial<SupportCopy> = {
    ...(modalHeading ? { title: modalHeading } : {}),
    ...(modalBody ? { subtitle: modalBody, supporting: undefined } : {}),
    ...(closeLabel ? { closeLabel } : {}),
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={variant === 'icon' ? label : undefined}
        aria-label={variant === 'icon' ? label : undefined}
        className={`${variantClass} ${className}`.trim()}
      >
        <Coffee size={iconSize} aria-hidden="true" />
        {variant !== 'icon' && (hideLabelOnMobile ? <span className="hidden sm:inline">{label}</span> : label)}
      </button>

      <SupportModal open={open} onClose={() => setOpen(false)} copy={copy} titleId={titleId} />
    </>
  );
};
