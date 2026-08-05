import { useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/AchievementsContact';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { useLanguage } from '../../i18n/LanguageContext';

const CONTACT_EMAIL = '101techlabs@gmail.com';

export const PrivacyPolicyPage = () => {
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
            items={[{ name: 'Home', href: lang === 'hi' ? '/hi' : '/' }, { name: 'Privacy Policy' }]}
          />

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-secondary-text text-sm mb-10">Last updated: August 2026</p>

          <div className="space-y-8 text-secondary-text leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-ink mb-2">What this covers</h2>
              <p>
                This policy explains what data 101 Tech Labs ("we," "us") collects when you visit 101techlabs.com,
                use one of our free tools, or contact us — and how that data is used.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-2">Information we collect</h2>
              <ul className="list-disc list-inside space-y-1">
                <li><strong className="text-ink">Contact form submissions</strong> — the name, email address, and message you submit, used only to respond to your inquiry.</li>
                <li><strong className="text-ink">Free tool inputs</strong> — search terms you enter into a tool (e.g. the Google Maps Business Finder) are used to run that search and are not stored on our servers after your session ends.</li>
                <li><strong className="text-ink">Analytics</strong> — we use Google Analytics and Google Tag Manager to understand aggregate site usage (pages viewed, approximate location, device type). This does not identify you personally.</li>
                <li><strong className="text-ink">Advertising</strong> — we use Google AdSense to show ads on our free tools pages. Google and its partners may use cookies to serve ads based on your visits to this and other sites. You can manage ad personalization at <a href="https://adssettings.google.com" target="_blank" rel="noreferrer" className="text-accent-blue hover:underline">adssettings.google.com</a>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-2">Third parties we use</h2>
              <p>Google Analytics, Google Tag Manager, and Google AdSense (analytics and advertising); Web3Forms (contact form delivery); WhatsApp Business (if you message us via the WhatsApp button). Each operates under its own privacy policy.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-2">What we don't do</h2>
              <p>We don't sell your personal data. We don't require an account or payment to use any free tool. We don't store the results of your free tool searches on our servers beyond your active session.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-2">Your choices</h2>
              <p>
                You can request a copy of, or deletion of, any personal data you've sent us (e.g. via the contact form) by
                emailing <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-blue hover:underline">{CONTACT_EMAIL}</a>.
                Most browsers let you block or delete cookies; doing so may affect analytics and ad personalization but not the free tools themselves.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-2">Changes to this policy</h2>
              <p>If this policy changes materially, we'll update the "Last updated" date above.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-2">Contact</h2>
              <p>Questions about this policy: <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-blue hover:underline">{CONTACT_EMAIL}</a>.</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
