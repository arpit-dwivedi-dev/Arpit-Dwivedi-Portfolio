import { useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Services } from '../components/ExperienceProjects';
import { Footer } from '../components/AchievementsContact';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { useLanguage } from '../i18n/LanguageContext';

// A dedicated, indexable /services route — the five services previously
// only existed as a same-page anchor (#experience) on the homepage.
export const ServicesPage = () => {
  const { lang, content } = useLanguage();
  const { servicesPage } = content;

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
            items={[{ name: content.nav.breadcrumbHome, href: lang === 'hi' ? '/hi' : '/' }, { name: content.footer.navServices }]}
          />
        </div>
        <h1 className="sr-only">{servicesPage.srTitle}</h1>
        <Services />

        <section className="py-24 bg-bg-secondary">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{servicesPage.heading}</h2>
            <p className="text-secondary-text text-base md:text-lg mb-12">{servicesPage.intro}</p>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {servicesPage.steps.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="text-accent-blue font-mono text-2xl font-bold shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="font-bold text-ink mb-1">{step.title}</h3>
                    <p className="text-secondary-text text-sm leading-relaxed">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
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
