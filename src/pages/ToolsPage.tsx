import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { ToolCard } from '../components/tools/ToolCard';
import { AdSlot } from '../components/ads/AdSlot';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { useLanguage } from '../i18n/LanguageContext';
import { TOOLS, TOOL_CATEGORIES, getToolsByCategory } from '../tools/registry';

// Ad sits after the first row of results, not inside the grid.
const CARDS_BEFORE_AD = 6;

export const ToolsPage = () => {
  const { lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const basePath = lang === 'hi' ? '/hi/tools' : '/tools';
  // Backs the WebSite SearchAction in index.html's JSON-LD (/tools?q=...) —
  // that schema is only honest if this page actually reads and applies `q`.
  const query = searchParams.get('q') ?? '';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOOLS;
    return TOOLS.filter(
      (tool) => tool.title.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q),
    );
  }, [query]);

  const firstRow = filtered.slice(0, CARDS_BEFORE_AD);
  const rest = filtered.slice(CARDS_BEFORE_AD);

  // Categories are only worth their own listed/linked page once they hold a
  // tool — an empty category page is thin content, not a topical hub.
  const populatedCategories = TOOL_CATEGORIES.filter((category) => getToolsByCategory(category.slug).length > 0);

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content" className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <Breadcrumbs
            className="mb-8"
            items={[{ name: 'Home', href: lang === 'hi' ? '/hi' : '/' }, { name: 'Tools' }]}
          />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">Free Tools</span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Small tools, <span className="text-gradient">no signup</span>
            </h1>
            <p className="text-secondary-text max-w-2xl mx-auto text-lg">
              Things we built for our own work that turned out useful enough to share. Free to run, no account needed.
            </p>
          </motion.div>

          {populatedCategories.length > 1 && (
            <nav aria-label="Tool categories" className="flex flex-wrap justify-center gap-2 mb-12">
              {populatedCategories.map((category) => (
                <a
                  key={category.slug}
                  href={`${basePath}/${category.slug}`}
                  className="px-4 py-2 rounded-full bg-bg-secondary border border-ink/5 text-sm text-secondary-text hover:text-ink hover:border-accent-blue/30 transition-colors"
                >
                  {category.title}
                </a>
              ))}
            </nav>
          )}

          <form
            role="search"
            onSubmit={(e) => e.preventDefault()}
            className="relative max-w-md mx-auto mb-12"
          >
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-text" aria-hidden="true" />
            <label htmlFor="tools-search" className="sr-only">
              Search tools
            </label>
            <input
              id="tools-search"
              type="search"
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setSearchParams(value ? { q: value } : {}, { replace: true });
              }}
              placeholder="Search tools…"
              className="w-full bg-bg-secondary border border-ink/10 rounded-xl pl-11 pr-4 py-3 text-ink focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure transition-colors"
            />
          </form>

          {filtered.length === 0 ? (
            <p className="text-center text-secondary-text">No tools match "{query}" yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {firstRow.map((tool, idx) => (
                  <ToolCard
                    key={tool.id}
                    title={tool.title}
                    description={tool.description}
                    icon={tool.icon}
                    href={`${basePath}/${tool.category}/${tool.path}`}
                    index={idx}
                  />
                ))}
              </div>

              <AdSlot slot={import.meta.env.VITE_ADSENSE_SLOT_TOOLS_LISTING} className="my-16" />

              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {rest.map((tool, idx) => (
                    <ToolCard
                      key={tool.id}
                      title={tool.title}
                      description={tool.description}
                      icon={tool.icon}
                      href={`${basePath}/${tool.category}/${tool.path}`}
                      index={idx}
                    />
                  ))}
                </div>
              )}
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
