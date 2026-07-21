import { motion } from 'motion/react';
import { FaWhatsapp } from 'react-icons/fa';
import { useLanguage } from '../i18n/LanguageContext';

export const WhatsAppButton = () => {
  const { content } = useLanguage();
  const { whatsapp, whatsappLabel } = content.contact;
  const href = `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(whatsapp.message)}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={whatsappLabel}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      whileHover={{ scale: 1.1 }}
      // z-40, one level below Navbar's z-50: the mobile hamburger menu is a
      // full-screen overlay rendered inside the navbar, and this button used
      // to tie with it on z-index and (by DOM order) paint on top, floating
      // over the open mobile menu.
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#128C7E] flex items-center justify-center shadow-[0_0_20px_rgba(18,140,126,0.5)] text-white"
    >
      {/* #128C7E (WhatsApp's own darker brand teal) instead of #25D366 — the white icon
          on #25D366 measured 1.98:1, failing WCAG 1.4.11's 3:1 minimum. This measures 4.14:1. */}
      <FaWhatsapp size={28} />
    </motion.a>
  );
};
