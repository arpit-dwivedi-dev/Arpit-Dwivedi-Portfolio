import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { Reveal } from '../components/ui/Reveal';
import { SectionRule } from '../components/ui/SectionRule';
import { GuideIndexBand } from '../components/guides/GuideRow';
import { GuideTopicSlab } from '../components/guides/GuideTopicSlab';
import { GuideHeroPanel } from '../components/guides/GuideHeroPanel';
import { useLanguage } from '../i18n/LanguageContext';
import { GUIDES, getGuideBySlug } from '../content/guides/data';
import { getGuideCategoriesWithCounts } from '../content/guides/categories';
import { guidesIndexContent as t } from '../content/guides/pageContent';

const categories = getGuideCategoriesWithCounts(GUIDES);

// The topic with the most guides: it gets the lit status dot in the slab, and
// its title fills the hero's secondary CTA. Derived rather than named, so it
// follows the content instead of going stale the moment a category grows.
const largestCategory = categories.reduce(
  (largest, category) => (category.count > largest.count ? category : largest),
  categories[0],
);

// English-only for now — see the App.tsx route comment for why. Still
// renders inside the shared Navbar/Footer so language switching elsewhere
// on the site keeps working; this page's own copy just doesn't localize yet.
//
// This page used to be a centered eyebrow above a centered gradient headline
// above a row of category pills above 51 guides in a two-column card grid.
// It now opens the way every other section on the site does — a labelled rule
// and a left-aligned display headline on the page's own light — and lists the
// guides as a ledger. See components/guides/GuideRow.tsx for why rows rather
// than cards, and GuideTopicSlab.tsx for what replaced the pills.
export const GuidesPage = () => {
  const { content } = useLanguage();
  const featured = getGuideBySlug(t.heroFeaturedSlug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="grain relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content">
        <section className="page-light relative pt-[72px]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-12 sm:pt-16 pb-16 sm:pb-20">
            <Breadcrumbs
              className="mb-6 sm:mb-7"
              items={[{ name: content.nav.breadcrumbHome, href: '/' }, { name: t.breadcrumbLabel }]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 lg:items-end">
              <Reveal className="flex flex-col">
                <p className="t-label text-secondary-text pb-6">{t.eyebrow}</p>

                <h1 className="t-dxl text-ink pb-6 max-w-[14ch] text-balance">
                  {t.title} {t.titleAccent}
                </h1>

                <p className="text-base sm:text-lg text-secondary-text leading-relaxed max-w-[46ch] pb-9">
                  {t.description.replace('{count}', String(GUIDES.length))}
                </p>

                {/* One primary action, matching the home hero's single ink
                    button. The secondary is a text link into the largest topic
                    — the "I know what I'm here for" path — not a second
                    competing button. */}
                <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
                  <Link
                    to="/tools"
                    className="group inline-flex items-center justify-center gap-2.5 h-13 px-7 bg-ink text-bg-pure font-semibold rounded-[3px] hover:bg-accent-blue transition-colors"
                  >
                    {t.ctaButton}
                    <ArrowRight
                      size={17}
                      className="group-hover:translate-x-0.5 transition-transform"
                      aria-hidden="true"
                    />
                  </Link>
                  {largestCategory && (
                    <Link
                      to={`/guides/${largestCategory.slug}`}
                      className="inline-flex items-center gap-2 h-11 text-sm font-semibold text-ink border-b border-accent-blue/40 hover:border-accent-blue hover:text-accent-blue transition-colors"
                    >
                      {t.heroSecondaryCta.replace('{category}', largestCategory.title)}
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </Reveal>

              {/* Absent only if the featured slug stops resolving — the hero
                  collapses to one column rather than rendering a placeholder. */}
              {featured && (
                <Reveal className="flex flex-col">
                  <GuideHeroPanel
                    guide={featured}
                    readTimeSuffix={t.readTimeSuffix}
                    tocLabel={t.heroPanelTocLabel}
                    toolLabel={t.heroPanelToolLabel}
                  />
                  <p className="t-label text-[0.5625rem] text-secondary-text pt-3.5">{t.heroPanelNote}</p>
                </Reveal>
              )}
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="max-w-7xl mx-auto px-5 sm:px-6">
            <SectionRule label={t.topicsRuleLabel.replace('{count}', String(categories.length))} />
            <Reveal className="pt-6 pb-10">
              <h2 className="t-dl text-ink max-w-[24ch]">{t.topicsTitle}</h2>
            </Reveal>
          </div>

          <GuideTopicSlab
            categories={categories}
            ariaLabel={t.categoriesAriaLabel}
            countLabel={t.guideCount}
            countLabelOne={t.guideCountOne}
            browseLabel={t.browseCategoryLabel}
            highlightSlug={largestCategory?.slug}
          />
        </section>

        <section className="relative pt-20 sm:pt-24">
          <div className="max-w-7xl mx-auto px-5 sm:px-6">
            <SectionRule label={t.allGuidesLabel.replace('{count}', String(GUIDES.length))} />
            <Reveal className="pt-6 pb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-16">
              <h2 className="t-dl text-ink max-w-[20ch]">{t.ledgerTitle}</h2>
              <p className="text-secondary-text leading-relaxed max-w-[44ch] lg:pb-1.5">
                {t.ledgerDescription.replace('{count}', String(GUIDES.length))}
              </p>
            </Reveal>
          </div>

          <GuideIndexBand guides={GUIDES} readTimeSuffix={t.readTimeSuffix} readLabel={t.readLabel} />
        </section>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-20 sm:pt-24 pb-16 sm:pb-24">
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
      </main>

      <Footer />
    </div>
  );
};
