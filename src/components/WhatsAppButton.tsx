import { motion } from 'motion/react';
import { FaWhatsapp } from 'react-icons/fa';
import metadata from '../../metadata.json';

export const WhatsAppButton = () => {
  const { whatsapp } = metadata.content.contact;
  const href = `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(whatsapp.message)}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      whileHover={{ scale: 1.1 }}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.5)] text-white"
    >
      <FaWhatsapp size={28} />
    </motion.a>
  );
};
