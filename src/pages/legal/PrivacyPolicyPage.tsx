import { useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/AchievementsContact';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { useLanguage } from '../../i18n/LanguageContext';

const CONTACT_EMAIL = '101techlabs@gmail.com';

const COPY = {
  pageTitle: 'Privacy Policy',
  breadcrumb: 'Privacy Policy',
  lastUpdated: 'Last updated: August 2026',
  reviewedBy: 'Reviewed by Arpit Dwivedi, Founder',
  sections: [
    {
      title: 'What this covers',
      body: 'This policy explains what data 101 Tech Labs ("we," "us") collects when you visit 101techlabs.com, use one of our free tools, or contact us — and how that data is used.',
    },
    {
      title: 'Information we collect',
      list: [
        { label: 'Contact form submissions', text: 'the name, email address, and message you submit, used only to respond to your inquiry.' },
        { label: 'Free tool inputs', text: 'what you enter into a tool (e.g. invoice details in the Invoice Generator, or content in the QR Code Generator) stays in your browser — none of it is sent to or stored on our servers.' },
        { label: 'Analytics', text: 'we use Google Analytics and Google Tag Manager to understand aggregate site usage (pages viewed, approximate location, device type). This does not identify you personally.' },
        { label: 'Usage recordings', text: 'we use Microsoft Clarity to record anonymised sessions and heatmaps — clicks, scrolling and navigation — so we can see where the tools are confusing. Text you type into the API Request Builder and DBML Diagram Builder is masked before it leaves your browser and is never recorded.' },
      ],
    },
    {
      title: 'Third parties we use',
      body: 'Google Analytics and Google Tag Manager (analytics); Microsoft Clarity (anonymised session recordings and heatmaps); Web3Forms (contact form delivery); WhatsApp Business (if you message us via the WhatsApp button). Each operates under its own privacy policy.',
    },
    {
      title: "What we don't do",
      body: "We don't sell your personal data. We don't require an account or payment to use any free tool. We don't store the results of your free tool searches on our servers beyond your active session.",
    },
    {
      title: 'Your choices',
      body: 'You can request a copy of, or deletion of, any personal data you\'ve sent us (e.g. via the contact form) by emailing the address below. Most browsers let you block or delete cookies; doing so may affect analytics but not the free tools themselves.',
      hasEmailLink: true,
    },
    {
      title: "Grievance officer",
      body: 'Under India\'s Digital Personal Data Protection Act, questions or complaints about how your data is handled can be directed to our grievance officer, Arpit Dwivedi (Founder), at the email address below.',
      hasEmailLink: true,
    },
    {
      title: 'Changes to this policy',
      body: 'If this policy changes materially, we\'ll update the "Last updated" date above.',
    },
    {
      title: 'Contact',
      body: 'Questions about this policy: ',
      hasEmailLink: true,
    },
  ],
};

export const PrivacyPolicyPage = () => {
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
                    {section.list.map((item) => (
                      <li key={item.label}>
                        <strong className="text-ink">{item.label}</strong> — {item.text}
                      </li>
                    ))}
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
