import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCheck, ShieldCheck, Layers, Rocket, HeartPulse, HandHeart, Building2, Store, Star, ChevronDown } from 'lucide-react';
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

const industryIcons = [HeartPulse, HandHeart, Building2, Store];
const industryColors = ['accent-blue', 'accent-purple', 'accent-blue', 'accent-purple'];

export const Industries = () => {
  const { content } = useLanguage();
  const { industries } = content;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent-purple font-mono text-sm tracking-widest uppercase mb-2 block">{industries.label}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{industries.title} <span className="text-gradient">{industries.titleAccent}</span></h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.items.map((item, idx) => {
            const Icon = industryIcons[idx % industryIcons.length];
            const color = industryColors[idx % industryColors.length];
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-3xl glass border-ink/5 hover:border-accent-purple/20 transition-all"
              >
                <div className={`${reasonClassMap[color]} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
                  <Icon size={24} aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-ink mb-2">{item.title}</h3>
                <p className="text-secondary-text text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const Testimonials = () => {
  const { content } = useLanguage();
  const { testimonialsSection } = content;

  return (
    <section className="py-24 relative overflow-hidden bg-bg-secondary">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{testimonialsSection.label}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{testimonialsSection.title} <span className="text-gradient">{testimonialsSection.titleAccent}</span></h2>
        </motion.div>

        <div className={testimonialsSection.items.length > 1 ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'grid grid-cols-1'}>
          {testimonialsSection.items.map((item) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl glass border-ink/5 text-center flex flex-col items-center gap-4"
            >
              <div className="flex gap-1" aria-hidden="true">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star key={i} size={18} className="text-accent-blue fill-accent-blue" />
                ))}
              </div>
              <p className="text-ink text-lg leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
              <div className="text-sm font-bold text-secondary-text uppercase tracking-widest font-mono">{item.name}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

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
