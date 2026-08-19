import { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { ToolCard } from '../components/tools/ToolCard';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { useLanguage } from '../i18n/LanguageContext';
// categories.ts only — importing guides/data.ts here would pull the whole
// guide library into this route's chunk just to read a category title.
import { getGuideCategory } from '../content/guides/categories';
import { getToolCategory, getToolsByCategory, categoryTitle, categoryDescription, toolTitle, toolDescription } from '../tools/registry';

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
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content" className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <Breadcrumbs
            className="mb-8"
            items={[
              { name: content.nav.breadcrumbHome, href: '/' },
              { name: t.breadcrumb, href: basePath },
              { name: categoryTitle(category) },
            ]}
          />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{t.toolCategoryEyebrow}</span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">{categoryTitle(category)}</h1>
            <p className="text-secondary-text max-w-2xl mx-auto text-lg">{categoryDescription(category)}</p>
          </motion.div>

          {tools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tools.map((tool, idx) => (
                <ToolCard
                  key={tool.id}
                  title={toolTitle(tool)}
                  description={toolDescription(tool)}
                  icon={tool.icon}
                  href={`${basePath}/${tool.category}/${tool.path}`}
                  index={idx}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-secondary-text">{t.noCategoryTools.replace('{category}', categoryTitle(category).toLowerCase())}</p>
          )}

          {/* One contextual link into the matching guide hub — the tools here
              have written how-to guides, and nothing on this page said so.
              Guides are English-only (no /hi/guides route, see App.tsx), so
              this href deliberately skips the /hi prefix, same as the footer. */}
          {guideCategory && (
            <div className="mt-16 p-6 rounded-3xl glass border-ink/10 flex flex-wrap items-center justify-between gap-4">
              <p className="text-ink font-medium">{t.categoryGuidesText}</p>
              <Link
                to={`/guides/${guideCategory.slug}`}
                title={guideCategory.description}
                className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-accent-blue text-bg-pure font-bold rounded-xl hover:glow-blue transition-all"
              >
                <BookOpen size={18} aria-hidden="true" />
                {t.categoryGuidesLink.replace('{category}', guideCategory.title)}
              </Link>
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
