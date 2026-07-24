import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export const Team = () => {
  const { content } = useLanguage();
  const { team } = content;
  const { founder } = team;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent-purple font-mono text-sm tracking-widest uppercase mb-2 block">{team.label}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{team.title} <span className="text-gradient">{team.titleAccent}</span></h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="p-8 md:p-10 rounded-3xl glass border-ink/5 flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left"
        >
          <div className="w-20 h-20 rounded-2xl bg-accent-purple/10 text-accent-purple flex items-center justify-center text-2xl font-bold shrink-0">
            {founder.initials}
          </div>
          <div>
            <h3 className="text-xl font-bold text-ink">{founder.name}</h3>
            <p className="text-accent-blue font-mono text-xs uppercase tracking-widest mb-4">{founder.role}</p>
            <p className="text-secondary-text text-sm md:text-base leading-relaxed mb-6">{founder.bio}</p>
            <ul className="flex flex-wrap justify-center sm:justify-start gap-2 list-none">
              {founder.highlights.map(h => (
                <li key={h} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ink/5 text-[10px] font-mono text-ink">
                  <CheckCircle2 size={10} className="text-accent-blue" aria-hidden="true" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export const Process = () => {
  const { content } = useLanguage();
  const { process } = content;

  return (
    <section className="py-24 relative overflow-hidden bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{process.label}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">{process.title} <span className="text-gradient">{process.titleAccent}</span></h2>
          <p className="text-secondary-text max-w-xl mx-auto">{process.description}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {process.steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-3xl glass border-ink/5 hover:border-accent-blue/20 transition-all"
            >
              <div className="text-4xl font-extrabold text-ink/10 mb-4 tracking-tighter">{String(idx + 1).padStart(2, '0')}</div>
              <h3 className="text-lg font-bold text-ink mb-2">{step.title}</h3>
              <p className="text-secondary-text text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-blue text-bg-pure font-bold hover:glow-blue transition-all group"
          >
            {process.cta} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
};
