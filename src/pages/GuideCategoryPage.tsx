import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { JsonLd } from '../components/seo/JsonLd';
import { GuideCard } from '../components/guides/GuideCard';
import { GuideCategoryNav } from '../components/guides/GuideCategoryNav';
import { useLanguage } from '../i18n/LanguageContext';
import { GUIDES, getGuidesByCategory } from '../content/guides/data';
import { getGuideCategoriesWithCounts, guidePath, type GuideCategory } from '../content/guides/categories';
import { guidesIndexContent as t } from '../content/guides/pageContent';

const SITE_ORIGIN = 'https://101techlabs.com';

interface GuideCategoryPageProps {
  category: GuideCategory;
}

// Rendered by GuideOrCategoryPage for the /guides/:slug segments that
// resolve to a category rather than an article — see that file for the
// resolution order. Every guide list here is derived from GUIDES/
// GUIDE_CATEGORIES at render time, never hand-maintained.
export const GuideCategoryPage = ({ category }: GuideCategoryPageProps) => {
  const { lang, content } = useLanguage();
  const guides = getGuidesByCategory(category.slug);
  const otherCategories = getGuideCategoriesWithCounts(GUIDES).filter((c) => c.slug !== category.slug);
  const url = `${SITE_ORIGIN}/guides/${category.slug}`;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [category.slug]);

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      {/* CollectionPage, not Article — this page lists guides, it doesn't
         write one. mainEntity/ItemList is the schema.org-recommended shape
         for a collection/listing page (see Google's docs on list pages). */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${category.title} Guides`,
          description: category.description,
          url,
          isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: guides.map((guide, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              url: `${SITE_ORIGIN}${guidePath(guide)}`,
              name: guide.title,
            })),
          },
        }}
      />

      <main id="main-content" className="pt-20 sm:pt-28 pb-12 sm:pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <Breadcrumbs
            className="mb-3 sm:mb-6"
            items={[
              { name: content.nav.breadcrumbHome, href: lang === 'hi' ? '/hi' : '/' },
              { name: t.breadcrumbLabel, href: '/guides' },
              { name: category.title },
            ]}
          />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-3 sm:mb-5">
              {category.title} <span className="text-gradient">Guides</span>
            </h1>
            <p className="text-secondary-text max-w-2xl mx-auto text-base sm:text-lg mb-3">{category.description}</p>
            <span className="text-xs font-mono uppercase tracking-widest text-secondary-text">
              {guides.length} {guides.length === 1 ? 'Guide' : 'Guides'}
            </span>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guides.map((guide, idx) => (
              <GuideCard key={guide.slug} guide={guide} index={idx} readTimeSuffix={t.readTimeSuffix} showCategory={false} />
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

          {otherCategories.length > 0 && (
            <div className="mt-10 sm:mt-14 text-center">
              <span className="text-xs font-mono uppercase tracking-widest text-secondary-text mb-4 block">
                {t.otherCategoriesLabel}
              </span>
              <GuideCategoryNav categories={otherCategories} ariaLabel={t.categoriesAriaLabel} />
            </div>
          )}
        </div>
      </main>

      <Footer />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,209,255,0.03),transparent_70%)]" />
      </div>
    </div>
  );
};
