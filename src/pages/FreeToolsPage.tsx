import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { ToolCard } from '../components/tools/ToolCard';
import { AdSlot } from '../components/ads/AdSlot';
import { useLanguage } from '../i18n/LanguageContext';
import { TOOLS } from '../tools/registry';

// Ad sits between rows, not inside the grid — after the first row (up to 6
// cards), before whatever comes next. With only one tool today it just
// renders after that single card, which is correct once more are added.
const CARDS_BEFORE_AD = 6;

export const FreeToolsPage = () => {
  const { lang } = useLanguage();
  const basePath = lang === 'hi' ? '/hi/free-tools' : '/free-tools';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const firstRow = TOOLS.slice(0, CARDS_BEFORE_AD);
  const rest = TOOLS.slice(CARDS_BEFORE_AD);

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content" className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">Free Tools</span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Small tools, <span className="text-gradient">no signup</span>
            </h2>
            <p className="text-secondary-text max-w-2xl mx-auto text-lg">
              Things we built for our own work that turned out useful enough to share. Free to run, no account needed.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {firstRow.map((tool, idx) => (
              <ToolCard
                key={tool.id}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                href={`${basePath}/${tool.path}`}
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
                  href={`${basePath}/${tool.path}`}
                  index={idx}
                />
              ))}
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
