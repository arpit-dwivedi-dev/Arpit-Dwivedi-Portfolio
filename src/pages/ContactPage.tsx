import { useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Contact } from '../components/AchievementsContact';
import { Footer } from '../components/AchievementsContact';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { useLanguage } from '../i18n/LanguageContext';

// A dedicated, indexable /contact route — AdSense review and general trust
// both expect a locatable contact page independent of the homepage anchor.
export const ContactPage = () => {
  const { lang, content } = useLanguage();
  const { contactPage } = content;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content" className="pt-24">
        <div className="max-w-7xl mx-auto px-6">
          <Breadcrumbs
            className="mb-2"
            items={[{ name: content.nav.breadcrumbHome, href: lang === 'hi' ? '/hi' : '/' }, { name: content.footer.navContact }]}
          />
        </div>
        <h1 className="sr-only">{contactPage.srTitle}</h1>
        <Contact compact />

        <section className="py-16 bg-bg-secondary">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-2xl font-bold tracking-tight mb-6">{contactPage.heading}</h2>
            <div className="space-y-6">
              {contactPage.items.map((item) => (
                <div key={item.question}>
                  <h3 className="font-semibold text-ink mb-1">{item.question}</h3>
                  <p className="text-secondary-text text-sm leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
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
