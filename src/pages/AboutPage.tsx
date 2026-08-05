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
  const { lang, content } = useLanguage();
  const { aboutPage } = content;

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
            items={[{ name: content.nav.breadcrumbHome, href: lang === 'hi' ? '/hi' : '/' }, { name: content.footer.navAbout }]}
          />
        </div>
        <h1 className="sr-only">{aboutPage.srTitle}</h1>
        <About />
        <Team />

        <section className="py-24 bg-bg-pure">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-8">{aboutPage.heading}</h2>
            <div className="space-y-5 text-base md:text-lg text-secondary-text leading-relaxed">
              {aboutPage.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <h3 className="text-accent-purple font-mono text-sm tracking-widest uppercase mt-12 mb-4">
              {aboutPage.workLabel}
            </h3>
            <ul className="space-y-3 text-base text-secondary-text leading-relaxed list-disc list-inside">
              {aboutPage.workItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <Footer />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,209,255,0.03),transparent_70%)]" />
      </div>
    </div>
  );
};
