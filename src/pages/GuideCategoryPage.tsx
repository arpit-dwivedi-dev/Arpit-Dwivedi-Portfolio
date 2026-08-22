import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { JsonLd } from '../components/seo/JsonLd';
import { Reveal } from '../components/ui/Reveal';
import { SectionRule } from '../components/ui/SectionRule';
import { GuideIndexBand } from '../components/guides/GuideRow';
import { GuideTopicSlab } from '../components/guides/GuideTopicSlab';
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
//
// Deliberately the same shape as GuidesPage — same hero treatment, the same
// ledger band, the same slab for cross-links — so a visitor who lands here
// from search and then clicks up to /guides does not appear to change sites.
export const GuideCategoryPage = ({ category }: GuideCategoryPageProps) => {
  const { content } = useLanguage();
  const guides = getGuidesByCategory(category.slug);
  const otherCategories = getGuideCategoriesWithCounts(GUIDES).filter((c) => c.slug !== category.slug);
  const url = `${SITE_ORIGIN}/guides/${category.slug}`;
  const countLabel = (guides.length === 1 ? t.guideCountOne : t.guideCount).replace('{count}', String(guides.length));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [category.slug]);

  return (
    <div className="grain relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
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

      <main id="main-content">
        <section className="page-light relative pt-[72px]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-12 sm:pt-16 pb-12 sm:pb-14">
            <Breadcrumbs
              className="mb-6 sm:mb-7"
              items={[
                { name: content.nav.breadcrumbHome, href: '/' },
                { name: t.breadcrumbLabel, href: '/guides' },
                { name: category.title },
              ]}
            />

            {/* No trailing status here: cyan is reserved site-wide for things
                that are actually running, and a listing isn't one. */}
            <SectionRule label={countLabel} />

            <Reveal className="pt-6 sm:pt-7">
              <h1 className="t-dxl text-ink max-w-[16ch] text-balance">
                {category.title} {t.titleAccent}
              </h1>
              <p className="pt-5 text-base sm:text-lg text-secondary-text leading-relaxed max-w-[52ch]">
                {category.description}
              </p>
            </Reveal>
          </div>
        </section>

        {/* No section rule above the band here: the h1 above already names
            what the list is, and a "{n} guides" rule would repeat the one in
            the hero verbatim. */}
        <GuideIndexBand
          guides={guides}
          readTimeSuffix={t.readTimeSuffix}
          readLabel={t.readLabel}
          showCategory={false}
        />

        <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-20 sm:pt-24">
          <Reveal
            from="none"
            className="glass rounded-[3px] px-6 sm:px-10 py-8 sm:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-7"
          >
            <div className="flex flex-col gap-2.5">
              <span className="t-label text-accent-purple-text">{t.ctaEyebrow}</span>
              <p className="t-ds text-ink max-w-[30ch]">{t.ctaText}</p>
            </div>
            <Link
              to="/tools"
              className="group shrink-0 inline-flex items-center justify-center gap-2.5 h-13 px-7 bg-accent-blue text-bg-pure font-bold rounded-[3px] hover:glow-blue transition-all"
            >
              {t.ctaButton}
              <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>

        {otherCategories.length > 0 && (
          <section className="relative pt-20 sm:pt-24 pb-16 sm:pb-24">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 pb-10">
              <SectionRule label={t.otherCategoriesLabel} />
            </div>
            <GuideTopicSlab
              categories={otherCategories}
              ariaLabel={t.categoriesAriaLabel}
              countLabel={t.guideCount}
              countLabelOne={t.guideCountOne}
              browseLabel={t.browseCategoryLabel}
            />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};
