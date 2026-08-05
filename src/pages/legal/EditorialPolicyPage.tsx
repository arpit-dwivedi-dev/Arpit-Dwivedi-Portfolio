import { useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/AchievementsContact';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { useLanguage } from '../../i18n/LanguageContext';

const CONTACT_EMAIL = '101techlabs@gmail.com';

export const EditorialPolicyPage = () => {
  const { lang } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content" className="pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <Breadcrumbs
            className="mb-8"
            items={[{ name: 'Home', href: lang === 'hi' ? '/hi' : '/' }, { name: 'Editorial Policy' }]}
          />

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Editorial Policy</h1>
          <p className="text-secondary-text text-sm mb-10">Last updated: August 2026</p>

          <div className="space-y-8 text-secondary-text leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-ink mb-2">Who writes this</h2>
              <p>
                Articles and tool documentation on 101techlabs.com are written and reviewed in-house by our team, based on
                first-hand experience building software, running the free tools on this site, and working with real clients.
                We don't publish sponsored posts, and we don't accept payment in exchange for editorial coverage.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-2">Accuracy and sourcing</h2>
              <p>
                We aim to state only what we can verify: documented Google Search Central guidance, our own tools' actual
                behavior and limits, and outcomes from projects we've shipped. We don't invent statistics, and we clearly mark
                anything we're not fully certain is still current.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-2">Corrections</h2>
              <p>
                If you spot an error in something we've published, tell us and we'll fix it. Material corrections are noted at
                the bottom of the affected article.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-2">Links to our own tools and services</h2>
              <p>
                Our blog posts often link to our own free tools or to our services page. We disclose this plainly rather than
                disguising it — a post about a tool we built is written by the people who built it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-2">Contact</h2>
              <p>Report an error or ask about editorial content: <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-blue hover:underline">{CONTACT_EMAIL}</a>.</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
