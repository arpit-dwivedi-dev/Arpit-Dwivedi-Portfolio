import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { GuideCard } from '../components/guides/GuideCard';
import { GuideCategoryNav } from '../components/guides/GuideCategoryNav';
import { useLanguage } from '../i18n/LanguageContext';
import { GUIDES } from '../content/guides/data';
import { getGuideCategoriesWithCounts } from '../content/guides/categories';
import { guidesIndexContent as t } from '../content/guides/pageContent';

const categories = getGuideCategoriesWithCounts(GUIDES);

// English-only for now — see the App.tsx route comment for why. Still
// renders inside the shared Navbar/Footer so language switching elsewhere
// on the site keeps working; this page's own copy just doesn't localize yet.
export const GuidesPage = () => {
  const { lang, content } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

          <GuideCategoryNav categories={categories} ariaLabel={t.categoriesAriaLabel} className="mb-10" />

          <span className="text-xs font-mono uppercase tracking-widest text-secondary-text mb-4 block">
            {t.allGuidesLabel} <span className="opacity-70">({GUIDES.length})</span>
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {GUIDES.map((guide, idx) => (
              <GuideCard key={guide.slug} guide={guide} index={idx} readTimeSuffix={t.readTimeSuffix} />
            ))}
          </div>

          <div className="mt-10 sm:mt-14 p-6 rounded-3xl glass border-ink/10 flex flex-wrap items-center justify-between gap-4">
            <p className="text-ink font-medium">{t.ctaText}</p>
            <Link
              to={lang === 'hi' ? '/hi/tools' : '/tools'}
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
