import { useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/AchievementsContact';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { useLanguage } from '../../i18n/LanguageContext';

const CONTACT_EMAIL = '101techlabs@gmail.com';

const COPY = {
  pageTitle: 'Editorial Policy',
  breadcrumb: 'Editorial Policy',
  lastUpdated: 'Last updated: August 2026',
  reviewedBy: 'Reviewed by Arpit Dwivedi, Founder',
  sections: [
    {
      title: 'Who writes this',
      body: "Articles and tool documentation on 101techlabs.com are written and reviewed in-house by our team, based on first-hand experience building software, running the free tools on this site, and working with real clients. We don't publish sponsored posts, and we don't accept payment in exchange for editorial coverage.",
    },
    {
      title: 'Accuracy and sourcing',
      body: "We aim to state only what we can verify: documented Google Search Central guidance, our own tools' actual behavior and limits, and outcomes from projects we've shipped. We don't invent statistics, and we clearly mark anything we're not fully certain is still current.",
    },
    {
      title: 'Corrections',
      body: "If you spot an error in something we've published, tell us and we'll fix it. Once we publish articles beyond tool and policy pages, material corrections will be noted directly on the affected page, with the date of the correction.",
    },
    {
      title: 'Links to our own tools and services',
      body: 'Our content often links to our own free tools or to our services page. We disclose this plainly rather than disguising it — a page about a tool we built is written by the people who built it.',
    },
    {
      title: 'Contact',
      body: 'Report an error or ask about editorial content: ',
      hasEmailLink: true,
    },
  ],
};

export const EditorialPolicyPage = () => {
  const { content } = useLanguage();
  const t = COPY;

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
            items={[{ name: content.nav.breadcrumbHome, href: '/' }, { name: t.breadcrumb }]}
          />

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{t.pageTitle}</h1>
          <p className="text-secondary-text text-sm mb-10">
            {t.lastUpdated} · {t.reviewedBy}
          </p>

          <div className="space-y-8 text-secondary-text leading-relaxed">
            {t.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-bold text-ink mb-2">{section.title}</h2>
                <p>
                  {section.body}
                  {section.hasEmailLink ? (
                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-blue hover:underline">{CONTACT_EMAIL}</a>
                  ) : null}
                </p>
              </section>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
