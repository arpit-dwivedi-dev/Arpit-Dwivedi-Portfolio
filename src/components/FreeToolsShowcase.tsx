import { motion } from 'motion/react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { TOOLS, toolTitle, toolDescription } from '../tools/registry';

// The homepage's primary proof-of-capability section, per positioning.md:
// "the free tools are the real portfolio." Shows every live tool with its
// judgment line — the specific decision made while building it — not just
// a feature blurb. judgment is English-only (see registry.ts), so it's
// simply omitted on the Hindi homepage rather than left half-translated.
export const FreeTools = () => {
  const { lang, content } = useLanguage();
  const t = content.freeToolsSection;
  const basePath = lang === 'hi' ? '/hi/tools' : '/tools';
  const visibleTools = TOOLS.filter((tool) => !tool.hidden);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{t.label}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{t.title} <span className="text-gradient">{t.titleAccent}</span></h2>
          <p className="text-secondary-text max-w-xl mx-auto mt-4">{t.description}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleTools.map((tool, idx) => (
            <motion.a
              key={tool.id}
              href={`${basePath}/${tool.category}/${tool.path}`}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group p-8 rounded-3xl bg-bg-secondary border border-ink/5 hover:border-accent-blue/30 transition-all flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="bg-accent-blue/10 text-accent-blue w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <tool.icon size={24} aria-hidden="true" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-secondary-text group-hover:text-accent-blue group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-ink group-hover:text-accent-blue transition-colors">{toolTitle(tool, lang)}</h3>
              <p className="text-secondary-text text-sm leading-relaxed">{toolDescription(tool, lang)}</p>
              {tool.judgment && lang === 'en' && (
                <p className="text-xs text-secondary-text/80 leading-relaxed pt-4 mt-auto border-t border-ink/5">
                  <span className="text-accent-blue font-mono uppercase tracking-widest text-[10px] block mb-1.5">A decision made building this</span>
                  {tool.judgment}
                </p>
              )}
            </motion.a>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to={basePath}
            className="inline-flex items-center gap-2 text-accent-blue hover:text-ink transition-colors font-mono text-sm group"
          >
            {t.viewAll} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};
