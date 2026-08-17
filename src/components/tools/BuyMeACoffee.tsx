import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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
  modalHeading = 'Buy me a coffee',
  modalBody = 'This tool is free, with no signup and no ads gating it. If you like the work, you can support it — scan the QR and pay.',
  closeLabel = 'Close',
  titleId = 'upi-modal-heading',
  className = '',
  hideLabelOnMobile = false,
}: BuyMeACoffeeProps) => {
  const [open, setOpen] = useState(false);
  const { className: variantClass, iconSize } = VARIANTS[variant];

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-bg-secondary border border-ink/10 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 id={titleId} className="text-lg font-bold text-ink flex items-center gap-2">
                  <Coffee size={18} className="text-[#FFDD00]" aria-hidden="true" />
                  {modalHeading}
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={closeLabel}
                  className="p-1.5 rounded-lg hover:bg-ink/10 text-secondary-text transition-colors"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <p className="text-sm text-secondary-text mb-4">{modalBody}</p>

              <div className="flex justify-center">
                <div className="p-3 rounded-2xl bg-white">
                  <QRCodeSVG value={UPI_LINK} size={180} bgColor="#ffffff" fgColor="#000000" level="M" includeMargin={false} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
