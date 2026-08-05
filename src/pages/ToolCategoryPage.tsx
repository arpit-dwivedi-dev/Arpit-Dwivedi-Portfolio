import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { ToolCard } from '../components/tools/ToolCard';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { useLanguage } from '../i18n/LanguageContext';
import { getToolCategory, getToolsByCategory, categoryTitle, categoryDescription, toolTitle, toolDescription } from '../tools/registry';

export const ToolCategoryPage = () => {
  const { lang, content } = useLanguage();
  const t = content.toolsPage;
  const { category: categorySlug } = useParams<{ category: string }>();
  const basePath = lang === 'hi' ? '/hi/tools' : '/tools';

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

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content" className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <Breadcrumbs
            className="mb-8"
            items={[
              { name: content.nav.breadcrumbHome, href: lang === 'hi' ? '/hi' : '/' },
              { name: t.breadcrumb, href: basePath },
              { name: categoryTitle(category, lang) },
            ]}
          />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{t.toolCategoryEyebrow}</span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">{categoryTitle(category, lang)}</h1>
            <p className="text-secondary-text max-w-2xl mx-auto text-lg">{categoryDescription(category, lang)}</p>
          </motion.div>

          {tools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tools.map((tool, idx) => (
                <ToolCard
                  key={tool.id}
                  title={toolTitle(tool, lang)}
                  description={toolDescription(tool, lang)}
                  icon={tool.icon}
                  href={`${basePath}/${tool.category}/${tool.path}`}
                  index={idx}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-secondary-text">{t.noCategoryTools.replace('{category}', categoryTitle(category, lang).toLowerCase())}</p>
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
