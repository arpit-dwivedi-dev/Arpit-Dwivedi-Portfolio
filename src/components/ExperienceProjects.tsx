import { motion } from 'motion/react';
import { Layout, Calendar, Zap, Search, Brain, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const serviceIcons = [Layout, Calendar, Zap, Search, Brain];
const serviceColors = ['accent-blue', 'accent-purple', 'accent-blue', 'accent-purple', 'accent-blue'];
const serviceClassMap: Record<string, string> = {
  'accent-blue': 'bg-accent-blue/10 text-accent-blue',
  'accent-purple': 'bg-accent-purple/10 text-accent-purple',
};

export const Services = () => {
  const { content } = useLanguage();
  const { services, servicesSection } = content;

  return (
    <section id="experience" className="py-24 relative overflow-hidden bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-accent-purple font-mono text-sm tracking-widest uppercase mb-2 block">{servicesSection.label}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{servicesSection.title} <span className="text-accent-blue">{servicesSection.titleAccent}</span></h2>
        </motion.div>

        {/* 5 cards on a 3-col grid leaves row 2 with a dangling empty slot.
            grid-cols-6 lets the first 3 cards fill row 1 exactly (2 cols
            each) and the last 2 sit centered on row 2 instead of hugging
            the left edge — a 3-2 layout instead of 3-2-gap. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {services.map((service, idx) => {
            const Icon = serviceIcons[idx % serviceIcons.length];
            const color = serviceColors[idx % serviceColors.length];
            const spanClass =
              idx < 3 ? 'lg:col-span-2' : idx === 3 ? 'lg:col-span-2 lg:col-start-2' : 'md:col-span-2 lg:col-span-2 lg:col-start-4';
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`p-6 rounded-3xl glass border-ink/5 hover:border-accent-blue/20 transition-all group ${spanClass}`}
              >
                <div className={`${serviceClassMap[color]} w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon size={24} aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-ink mb-3 group-hover:text-accent-blue transition-colors">{service.title}</h3>
                <p className="text-secondary-text text-sm mb-6 leading-relaxed">{service.description}</p>
                <ul className="flex flex-wrap gap-2 list-none">
                  {service.highlights.map(h => (
                    <li key={h} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ink/5 text-[10px] font-mono text-ink">
                      <CheckCircle2 size={10} className="text-accent-blue" aria-hidden="true" />
                      {h}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Projects mini-grid ("Key Projects") deleted 2026-08-12 — it duplicated
// /projects' full case studies in a prominent mid-homepage position,
// including the SA Ethics Biotech demo shown as an equal card alongside real
// delivered work. positioning.md's PORTFOLIO rule demotes this off the
// homepage; HomePage.tsx now carries a single low-key line instead. See
// positioning.md.
