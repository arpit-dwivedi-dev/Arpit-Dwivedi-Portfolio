import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight, Clock } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { useLanguage } from '../i18n/LanguageContext';
import { GUIDES } from '../content/guides/data';

// English-only for now — see the App.tsx route comment for why. Still
// renders inside the shared Navbar/Footer so language switching elsewhere
// on the site keeps working; this page's own copy just doesn't localize yet.
export const GuidesPage = () => {
  const { lang, content } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content" className="pt-32 pb-24">
        <div className="max-w-5xl mx-auto px-6">
          <Breadcrumbs
            className="mb-8"
            items={[{ name: content.nav.breadcrumbHome, href: lang === 'hi' ? '/hi' : '/' }, { name: 'Guides' }]}
          />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">Invoicing Guides</span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Learn <span className="text-gradient">Invoicing</span>
            </h1>
            <p className="text-secondary-text max-w-2xl mx-auto text-lg">
              Practical, no-fluff guides on making invoices, setting payment terms, and getting paid on time — written for
              freelancers and small businesses, not accountants.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {GUIDES.map((guide, idx) => (
              <motion.div
                key={guide.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to={`/guides/${guide.slug}`}
                  className="group p-6 rounded-3xl bg-bg-secondary border border-ink/5 hover:border-accent-blue/30 transition-all flex flex-col h-full"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-xs font-mono text-accent-blue uppercase tracking-widest">{guide.category}</span>
                    <ArrowUpRight size={16} className="text-secondary-text group-hover:text-accent-blue group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" aria-hidden="true" />
                  </div>
                  <h2 className="text-lg font-bold text-ink mb-2 group-hover:text-accent-blue transition-colors">{guide.title}</h2>
                  <p className="text-secondary-text text-sm leading-relaxed flex-grow mb-3">{guide.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-secondary-text/70">
                    <Clock size={12} aria-hidden="true" />
                    {guide.readTimeMinutes} min read
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 p-6 rounded-3xl glass border-ink/10 flex flex-wrap items-center justify-between gap-4">
            <p className="text-ink font-medium">Ready to put this into practice?</p>
            <Link
              to="/tools/generators/invoice-generator"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-accent-blue text-bg-pure font-bold rounded-xl hover:glow-blue transition-all"
            >
              Try the free Invoice Generator
            </Link>
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
