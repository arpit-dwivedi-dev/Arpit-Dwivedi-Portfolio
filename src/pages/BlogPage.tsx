import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight, Clock } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { useLanguage } from '../i18n/LanguageContext';
import { BLOG_POSTS } from '../content/blog/data';
import { blogIndexContent as t } from '../content/blog/pageContent';

// English-only for now, same reasoning as GuidesPage — see App.tsx route
// comment. Renders inside the shared Navbar/Footer so language switching
// elsewhere on the site keeps working.
export const BlogPage = () => {
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
            <p className="text-secondary-text max-w-2xl mx-auto text-base sm:text-lg">{t.description}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BLOG_POSTS.map((post, idx) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to={`/blog/${post.slug}`}
                  className="group p-6 rounded-3xl bg-bg-secondary border border-ink/5 hover:border-accent-blue/30 transition-all flex flex-col h-full"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-xs font-mono text-accent-blue uppercase tracking-widest">{post.category}</span>
                    <ArrowUpRight size={16} className="text-secondary-text group-hover:text-accent-blue group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" aria-hidden="true" />
                  </div>
                  <h2 className="text-lg font-bold text-ink mb-2 group-hover:text-accent-blue transition-colors">{post.title}</h2>
                  <p className="text-secondary-text text-sm leading-relaxed flex-grow mb-3">{post.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-secondary-text/70">
                    <Clock size={12} aria-hidden="true" />
                    {post.readTimeMinutes} {t.readTimeSuffix}
                  </span>
                </Link>
              </motion.div>
            ))}
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
