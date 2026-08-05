import { useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/AchievementsContact';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { useLanguage } from '../../i18n/LanguageContext';

const CONTACT_EMAIL = '101techlabs@gmail.com';

export const TermsPage = () => {
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
            items={[{ name: 'Home', href: lang === 'hi' ? '/hi' : '/' }, { name: 'Terms of Service' }]}
          />

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-secondary-text text-sm mb-10">Last updated: August 2026</p>

          <div className="space-y-8 text-secondary-text leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-ink mb-2">Using this site</h2>
              <p>
                By using 101techlabs.com, including our free tools, you agree to these terms. If you don't agree,
                please don't use the site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-2">Free tools</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Our free tools (e.g. the Google Maps Business Finder) are provided "as is," without warranty of any kind, for personal and light professional use.</li>
                <li>Free-tier usage limits (results per search, searches per session) are enforced to keep the tools fast and available to everyone. Attempting to circumvent these limits through automated means is not permitted.</li>
                <li>Higher-volume or commercial use requires contacting us directly for a paid arrangement.</li>
                <li>We may change, limit, or discontinue a free tool at any time.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-2">Client and project work</h2>
              <p>
                Software development engagements are governed by the separate written proposal or contract agreed with each
                client, not by these general terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-2">Intellectual property</h2>
              <p>
                The 101 Tech Labs name, logo, and site content are our property unless otherwise noted. Data you export from a
                free tool (e.g. business listings) is yours to use, subject to the data source's own terms — our tools read
                publicly visible information and don't grant rights beyond what that source already makes public.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-2">Limitation of liability</h2>
              <p>
                We aren't liable for indirect, incidental, or consequential damages arising from your use of this site or our
                free tools, including inaccuracies in tool output pulled from third-party sources.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-2">Governing law</h2>
              <p>These terms are governed by the laws of India, without regard to conflict-of-law principles.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink mb-2">Contact</h2>
              <p>Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-blue hover:underline">{CONTACT_EMAIL}</a>.</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
