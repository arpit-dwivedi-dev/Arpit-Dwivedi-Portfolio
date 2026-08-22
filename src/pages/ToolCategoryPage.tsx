import { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { ToolIndexBand } from '../components/tools/ToolRow';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { Reveal } from '../components/ui/Reveal';
import { SectionRule } from '../components/ui/SectionRule';
import { useLanguage } from '../i18n/LanguageContext';
// categories.ts only — importing guides/data.ts here would pull the whole
// guide library into this route's chunk just to read a category title.
import { getGuideCategory } from '../content/guides/categories';
import { getToolCategory, getToolsByCategory, categoryTitle, categoryDescription } from '../tools/registry';

export const ToolCategoryPage = () => {
  const { content } = useLanguage();
  const t = content.toolsPage;
  const { category: categorySlug } = useParams<{ category: string }>();
  const basePath = '/tools';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const category = categorySlug ? getToolCategory(categorySlug) : undefined;

  // Unknown category slug — send to the tools index rather than rendering
  // an empty shell Google could index as a real, unrelated page.
  if (!category) {
    return <Navigate to={basePath} replace />;
  }

  const tools = getToolsByCategory(category.slug);
  const guideCategory = category.guideCategorySlug ? getGuideCategory(category.guideCategorySlug) : undefined;

  return <ToolCategoryPageContent category={category} tools={tools} guideCategory={guideCategory} basePath={basePath} content={content} t={t} />;
};

type ToolCategoryPageContentProps = {
  category: NonNullable<ReturnType<typeof getToolCategory>>;
  tools: ReturnType<typeof getToolsByCategory>;
  guideCategory: ReturnType<typeof getGuideCategory>;
  basePath: string;
  content: ReturnType<typeof useLanguage>['content'];
  t: ReturnType<typeof useLanguage>['content']['toolsPage'];
};

// Split out so the noindex effect below only ever runs for the case it's
// meant for: a category slug that resolves (the !category branch above
// already redirects unknown ones) but currently has zero visible tools —
// same thin/empty-page call ToolsPage's populatedCategories filter and
// src/content/siteRoutes.ts#getIndexableToolCategoryRoutes already make for
// the sitemap. Those exclusions only stop this page from being *advertised*
// (no nav link, no sitemap entry) — the route itself stays live, so a
// crawler that already found it another way still needs to be told not to
// index it, same reasoning that applies to a hidden/unlisted tool page's
// own noindex meta tag.
const ToolCategoryPageContent = ({ category, tools, guideCategory, basePath, content, t }: ToolCategoryPageContentProps) => {
  useEffect(() => {
    if (tools.length > 0) return;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, follow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, [tools.length]);

  return (
    <div className="grain relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content">
        {/* One display step down from the tools index (t-dl against its
            t-dxl), so a category reads as a level inside the index rather
            than a competing landing page. The old page had this the other way
            round — its heading was larger than the index's. */}
        <section className="page-light relative pt-[72px]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-12 sm:pt-16">
            <Breadcrumbs
              className="mb-6 sm:mb-7"
              backHref={basePath}
              backLabel={t.breadcrumb}
              items={[
                { name: content.nav.breadcrumbHome, href: '/' },
                { name: t.breadcrumb, href: basePath },
                { name: categoryTitle(category) },
              ]}
            />

            <SectionRule label={t.toolCategoryEyebrow} />

            <Reveal className="pt-6 sm:pt-7">
              <h1 className="t-dl text-ink max-w-[20ch]">{categoryTitle(category)}</h1>
              <p className="pt-5 text-secondary-text leading-relaxed max-w-[56ch]">{categoryDescription(category)}</p>
            </Reveal>
          </div>
        </section>

        <div className="pt-10 sm:pt-14">
          {tools.length > 0 ? (
            <ToolIndexBand
              tools={tools}
              basePath={basePath}
              noteLabel={t.buildNoteLabel}
              openLabel={t.openLabel}
              showCategory={false}
            />
          ) : (
            <Reveal from="none" className="surface border-x-0 rounded-none">
              <div className="max-w-7xl mx-auto px-5 sm:px-6 py-16 sm:py-20 flex flex-col items-start gap-4">
                <span className="t-label text-secondary-text">{t.noResultsLabel}</span>
                <p className="t-ds text-ink max-w-[34ch]">
                  {t.noCategoryTools.replace('{category}', categoryTitle(category).toLowerCase())}
                </p>
                <Link
                  to={basePath}
                  className="mt-2 h-11 px-4 inline-flex items-center rounded-[3px] text-sm font-semibold text-bg-pure bg-ink hover:bg-accent-blue transition-colors"
                >
                  {t.breadcrumb}
                </Link>
              </div>
            </Reveal>
          )}
        </div>

        {/* One contextual link into the matching guide hub — the tools here
            have written how-to guides, and nothing on this page said so.
            Guides are English-only (no /hi/guides route, see App.tsx), so
            this href deliberately skips the /hi prefix, same as the footer. */}
        <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-16 sm:pt-20 pb-16 sm:pb-24">
          {guideCategory && (
            <Reveal
              from="none"
              className="border-y border-hairline border-t-lit py-6 flex flex-wrap items-center justify-between gap-4"
            >
              <p className="text-sm text-ink max-w-[52ch]">{t.categoryGuidesText}</p>
              <Link
                to={`/guides/${guideCategory.slug}`}
                title={guideCategory.description}
                className="shrink-0 inline-flex items-center gap-2 h-11 px-4 rounded-[3px] text-sm font-semibold text-bg-pure bg-ink hover:bg-accent-blue transition-colors"
              >
                <BookOpen size={16} aria-hidden="true" />
                {t.categoryGuidesLink.replace('{category}', guideCategory.title)}
              </Link>
            </Reveal>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
