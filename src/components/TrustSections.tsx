import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCheck, ShieldCheck, Layers, Rocket, ChevronDown } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const reasonIcons = [UserCheck, ShieldCheck, Layers, Rocket];
const reasonColors = ['accent-blue', 'accent-purple', 'accent-blue', 'accent-purple'];
const reasonClassMap: Record<string, string> = {
  'accent-blue': 'bg-accent-blue/10 text-accent-blue',
  'accent-purple': 'bg-accent-purple/10 text-accent-purple',
};

export const WhyChooseUs = () => {
  const { content } = useLanguage();
  const { whyChooseUs } = content;

  return (
    <section className="py-24 relative overflow-hidden bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{whyChooseUs.label}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{whyChooseUs.title} <span className="text-gradient">{whyChooseUs.titleAccent}</span></h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyChooseUs.reasons.map((reason, idx) => {
            const Icon = reasonIcons[idx % reasonIcons.length];
            const color = reasonColors[idx % reasonColors.length];
            return (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-3xl glass border-ink/5 hover:border-accent-blue/20 transition-all"
              >
                <div className={`${reasonClassMap[color]} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
                  <Icon size={24} aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-ink mb-2">{reason.title}</h3>
                <p className="text-secondary-text text-sm leading-relaxed">{reason.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Industries component deleted 2026-08-12 — 3 of its 4 categories rested on
// zero real evidence: "Enterprise HR & Operations" was a disguised reference
// to the off-site-only HRMS design work, "Manufacturing & Equipment" was
// built entirely on the unpaid SA Ethics Biotech demo, and "Local Businesses
// & Hospitality" had no supporting project at all. Only "Nonprofits & NGOs"
// (Rashtriya Swasthya Sangathan) is real — too thin on its own to justify an
// "Industries We Serve" grid. See positioning.md's industry-vertical note.

// Testimonials component deleted 2026-08-12 — it rendered quotes that were
// never actually said or sent by either named client (confirmed with the
// founder during the content-rewrite project). Never commented back in
// without real, verifiable quotes. See positioning.md.

export const FAQ = () => {
  const { content } = useLanguage();
  const { faq } = content;
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent-purple font-mono text-sm tracking-widest uppercase mb-2 block">{faq.label}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{faq.title} <span className="text-gradient">{faq.titleAccent}</span></h2>
        </motion.div>

        <div className="space-y-4">
          {faq.items.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={item.question} className="rounded-2xl glass border-ink/5 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  className="w-full flex items-center justify-between gap-4 p-6 text-left"
                >
                  <span className="font-bold text-ink">{item.question}</span>
                  <ChevronDown size={20} className={`shrink-0 text-secondary-text transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${idx}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-secondary-text text-sm leading-relaxed">{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
