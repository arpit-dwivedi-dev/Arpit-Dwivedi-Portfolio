import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight, Clock } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { useLanguage } from '../i18n/LanguageContext';
import { GUIDES } from '../content/guides/data';
import { guidesIndexContent as t } from '../content/guides/pageContent';

// Fixed display order rather than derived from data insertion order, so the
// tab order stays intentional (most commercial-intent category first) even
// as guides get added or reordered within data.ts.
const CATEGORY_ORDER = ['Getting Paid', 'Document Basics', 'Client Billing', 'Business Finance'];

// English-only for now — see the App.tsx route comment for why. Still
// renders inside the shared Navbar/Footer so language switching elsewhere
// on the site keeps working; this page's own copy just doesn't localize yet.
export const GuidesPage = () => {
  const { lang, content } = useLanguage();
  // 'all' is the default on purpose: the prerender script snapshots this
  // page in its initial state, so every guide card (and link) must be in
  // the DOM before any tab click — filtering below is a client-side
  // enhancement on top of that, not a replacement for it.
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const guide of GUIDES) counts.set(guide.category, (counts.get(guide.category) ?? 0) + 1);
    return CATEGORY_ORDER.filter((category) => counts.has(category)).map((category) => ({
      category,
      count: counts.get(category)!,
    }));
  }, []);

  const filteredGuides = activeCategory === 'all' ? GUIDES : GUIDES.filter((guide) => guide.category === activeCategory);

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content" className="pt-20 sm:pt-28 pb-12 sm:pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <Breadcrumbs
            className="mb-3 sm:mb-6"
            items={[{ name: content.nav.breadcrumbHome, href: lang === 'hi' ? '/hi' : '/' }, { name: t.breadcrumbLabel }]}
          />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-12">
            <span className="text-accent-blue font-mono text-xs sm:text-sm tracking-widest uppercase mb-1 sm:mb-2 block">{t.eyebrow}</span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-3 sm:mb-5">
              {t.title} <span className="text-gradient">{t.titleAccent}</span>
            </h1>
            <p className="text-secondary-text max-w-2xl mx-auto text-base sm:text-lg">
              {t.description}
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-2 mb-8" role="tablist" aria-label={t.categoriesAriaLabel}>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                activeCategory === 'all'
                  ? 'bg-accent-blue text-bg-pure'
                  : 'bg-bg-secondary text-secondary-text border border-ink/5 hover:text-ink hover:border-accent-blue/30'
              }`}
            >
              {t.allGuidesLabel} <span className="opacity-70">({GUIDES.length})</span>
            </button>
            {categories.map(({ category, count }) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  activeCategory === category
                    ? 'bg-accent-blue text-bg-pure'
                    : 'bg-bg-secondary text-secondary-text border border-ink/5 hover:text-ink hover:border-accent-blue/30'
                }`}
              >
                {category} <span className="opacity-70">({count})</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredGuides.map((guide, idx) => (
              <motion.div
                key={guide.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to={`/guides/${guide.slug}`}
                  className="group p-6 rounded-3xl bg-bg-secondary border border-ink/5 hover:border-accent-blue/30 transition-all flex flex-col h-full"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-xs font-mono text-accent-blue uppercase tracking-widest">{guide.category}</span>
                    <ArrowUpRight size={16} className="text-secondary-text group-hover:text-accent-blue group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" aria-hidden="true" />
                  </div>
                  <h2 className="text-lg font-bold text-ink mb-2 group-hover:text-accent-blue transition-colors">{guide.title}</h2>
                  <p className="text-secondary-text text-sm leading-relaxed flex-grow mb-3">{guide.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-secondary-text/70">
                    <Clock size={12} aria-hidden="true" />
                    {guide.readTimeMinutes} {t.readTimeSuffix}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 sm:mt-14 p-6 rounded-3xl glass border-ink/10 flex flex-wrap items-center justify-between gap-4">
            <p className="text-ink font-medium">{t.ctaText}</p>
            <Link
              to="/tools/generators/invoice-generator"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-accent-blue text-bg-pure font-bold rounded-xl hover:glow-blue transition-all"
            >
              {t.ctaButton}
            </Link>
          </div>
        </div>
      </main>

      <Footer />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,209,255,0.03),transparent_70%)]" />
      </div>
    </div>
  );
};
