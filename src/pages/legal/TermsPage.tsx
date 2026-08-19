import { useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/AchievementsContact';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { useLanguage } from '../../i18n/LanguageContext';

const CONTACT_EMAIL = '101techlabs@gmail.com';

const COPY = {
  pageTitle: 'Terms of Service',
  breadcrumb: 'Terms of Service',
  lastUpdated: 'Last updated: August 2026',
  reviewedBy: 'Reviewed by Arpit Dwivedi, Founder',
  sections: [
    {
      title: 'Using this site',
      body: "By using 101techlabs.com, including our free tools, you agree to these terms. If you don't agree, please don't use the site.",
    },
    {
      title: 'Free tools',
      list: [
        'Our free tools (e.g. the Invoice Generator and QR Code Generator) are provided "as is," without warranty of any kind, for personal and light professional use.',
        'Free-tier usage limits (results per search, searches per session) are enforced to keep the tools fast and available to everyone. Attempting to circumvent these limits through automated means is not permitted.',
        'Higher-volume or commercial use requires contacting us directly for a paid arrangement.',
        'We may change, limit, or discontinue a free tool at any time.',
      ],
    },
    {
      title: 'Client and project work',
      body: 'Software development engagements are governed by the separate written proposal or contract agreed with each client, not by these general terms.',
    },
    {
      title: 'Intellectual property',
      body: "The 101 Tech Labs name, logo, and site content are our property unless otherwise noted. Data you export from a free tool (e.g. business listings) is yours to use, subject to the data source's own terms — our tools read publicly visible information and don't grant rights beyond what that source already makes public.",
    },
    {
      title: 'Limitation of liability',
      body: "We aren't liable for indirect, incidental, or consequential damages arising from your use of this site or our free tools, including inaccuracies in tool output pulled from third-party sources.",
    },
    {
      title: 'Governing law',
      body: 'These terms are governed by the laws of India, without regard to conflict-of-law principles.',
    },
    {
      title: 'Contact',
      body: 'Questions about these terms: ',
      hasEmailLink: true,
    },
  ],
};

export const TermsPage = () => {
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
                {section.list ? (
                  <ul className="list-disc list-inside space-y-1">
                    {section.list.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : (
                  <p>
                    {section.body}
                    {section.hasEmailLink ? (
                      <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-blue hover:underline">{CONTACT_EMAIL}</a>
                    ) : null}
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
