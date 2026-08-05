import { useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { About } from '../components/AboutTech';
import { Team } from '../components/TeamProcess';
import { Footer } from '../components/AchievementsContact';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { useLanguage } from '../i18n/LanguageContext';

// A dedicated, indexable /about route — previously this content only
// existed as a same-page anchor (#about) on the homepage, so it had no URL
// of its own for Google to rank or for other pages to link to directly.
export const AboutPage = () => {
  const { lang } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content" className="pt-32">
        <div className="max-w-7xl mx-auto px-6">
          <Breadcrumbs
            className="mb-8"
            items={[{ name: 'Home', href: lang === 'hi' ? '/hi' : '/' }, { name: 'About' }]}
          />
        </div>
        <h1 className="sr-only">About 101 Tech Labs</h1>
        <About />
        <Team />
      </main>

      <Footer />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,209,255,0.03),transparent_70%)]" />
      </div>
    </div>
  );
};
