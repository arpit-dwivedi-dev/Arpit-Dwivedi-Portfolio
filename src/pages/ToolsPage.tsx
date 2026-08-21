import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { ToolCard } from '../components/tools/ToolCard';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { useLanguage } from '../i18n/LanguageContext';
import { TOOLS, TOOL_CATEGORIES, getToolsByCategory, categoryTitle, toolTitle, toolDescription } from '../tools/registry';

export const ToolsPage = () => {
  const { content } = useLanguage();
  const t = content.toolsPage;
  const [searchParams, setSearchParams] = useSearchParams();
  const basePath = '/tools';
  // Backs the WebSite SearchAction in index.html's JSON-LD (/tools?q=...) —
  // that schema is only honest if this page actually reads and applies `q`.
  const query = searchParams.get('q') ?? '';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filtered = useMemo(() => {
    const visible = TOOLS.filter((tool) => !tool.hidden);
    const q = query.trim().toLowerCase();
    if (!q) return visible;
    return visible.filter(
      (tool) => toolTitle(tool).toLowerCase().includes(q) || toolDescription(tool).toLowerCase().includes(q),
    );
  }, [query]);

  // Categories are only worth their own listed/linked page once they hold a
  // tool — an empty category page is thin content, not a topical hub.
  const populatedCategories = TOOL_CATEGORIES.filter((category) => getToolsByCategory(category.slug).length > 0);

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content" className="pt-16 sm:pt-20 pb-12 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Breadcrumbs
            className="mb-3 sm:mb-6"
            items={[{ name: content.nav.breadcrumbHome, href: '/' }, { name: t.breadcrumb }]}
          />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-4 sm:mb-6">
            <span className="text-accent-blue font-mono text-xs sm:text-sm tracking-widest uppercase mb-1 sm:mb-2 block">{t.eyebrow}</span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2 sm:mb-3">
              {t.titleStart} <span className="text-gradient">{t.titleAccent}</span>
            </h1>
            <p className="text-secondary-text max-w-2xl mx-auto text-sm sm:text-lg">{t.description}</p>
          </motion.div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <form
              role="search"
              onSubmit={(e) => e.preventDefault()}
              className="relative w-full md:max-w-xs md:flex-shrink-0 order-2 md:order-1"
            >
              <Search size={16} className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-secondary-text" aria-hidden="true" />
              <label htmlFor="tools-search" className="sr-only">
                {t.searchAriaLabel}
              </label>
              <input
                id="tools-search"
                type="search"
                value={query}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchParams(value ? { q: value } : {}, { replace: true });
                }}
                placeholder={t.searchPlaceholder}
                className="w-full bg-bg-secondary border border-ink/10 rounded-xl pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 text-sm sm:text-base text-ink focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure transition-colors"
              />
            </form>

            {populatedCategories.length > 1 && (
              <nav
                aria-label={t.categoriesAriaLabel}
                className="flex flex-wrap gap-1.5 sm:gap-2 justify-center md:justify-end order-1 md:order-2"
              >
                {populatedCategories.map((category) => (
                  <a
                    key={category.slug}
                    href={`${basePath}/${category.slug}`}
                    className="px-2.5 sm:px-4 py-1 sm:py-2 rounded-full bg-bg-secondary border border-ink/5 text-xs sm:text-sm text-secondary-text hover:text-ink hover:border-accent-blue/30 transition-colors whitespace-nowrap"
                  >
                    {categoryTitle(category)}
                  </a>
                ))}
              </nav>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-secondary-text">{t.noToolsMatch.replace('{query}', query)}</p>
          ) : (
            <>
              <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6">
                {filtered.map((tool, idx) => (
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
            </>
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
