import { useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/AchievementsContact';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { useLanguage } from '../../i18n/LanguageContext';

const CONTACT_EMAIL = '101techlabs@gmail.com';

const COPY = {
  en: {
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
  },
  hi: {
    pageTitle: 'एडिटोरियल पॉलिसी',
    breadcrumb: 'एडिटोरियल पॉलिसी',
    lastUpdated: 'आख़िरी बार अपडेट: अगस्त 2026',
    reviewedBy: 'रिव्यू किया गया: अर्पित द्विवेदी, फ़ाउंडर',
    sections: [
      {
        title: 'यह कौन लिखता है',
        body: '101techlabs.com पर लेख और टूल डॉक्यूमेंटेशन हमारी टीम द्वारा इन-हाउस लिखे और रिव्यू किए जाते हैं, सॉफ़्टवेयर बनाने, इस साइट के फ्री टूल्स चलाने, और असली क्लाइंट्स के साथ काम करने के प्रत्यक्ष अनुभव के आधार पर। हम स्पॉन्सर्ड पोस्ट प्रकाशित नहीं करते, और एडिटोरियल कवरेज के बदले पेमेंट स्वीकार नहीं करते।',
      },
      {
        title: 'सटीकता और सोर्सिंग',
        body: 'हम केवल वही बताने की कोशिश करते हैं जिसे हम वेरिफ़ाई कर सकते हैं: डॉक्यूमेंटेड Google Search Central गाइडेंस, हमारे अपने टूल्स का असली व्यवहार और सीमाएं, और हमारे शिप किए गए प्रोजेक्ट्स के नतीजे। हम आंकड़े नहीं बनाते, और जो कुछ भी हमें पूरी तरह यकीन नहीं है कि अभी भी सही है, उसे साफ़ तौर पर मार्क करते हैं।',
      },
      {
        title: 'करेक्शन',
        body: 'अगर आपको हमारे प्रकाशित किसी कंटेंट में कोई गलती दिखे, तो हमें बताएं और हम उसे ठीक करेंगे। जब हम टूल और पॉलिसी पेजों से आगे लेख प्रकाशित करना शुरू करेंगे, तो बड़े करेक्शन सीधे उस पेज पर, करेक्शन की तारीख के साथ, नोट किए जाएंगे।',
      },
      {
        title: 'हमारे अपने टूल्स और सेवाओं के लिंक',
        body: 'हमारा कंटेंट अक्सर हमारे अपने फ्री टूल्स या हमारे सर्विसेज़ पेज से लिंक करता है। हम इसे साफ़ तौर पर बताते हैं, छिपाते नहीं — किसी टूल के बारे में पेज उन्हीं लोगों ने लिखा है जिन्होंने उसे बनाया है।',
      },
      {
        title: 'संपर्क करें',
        body: 'कोई गलती बताएं या एडिटोरियल कंटेंट के बारे में पूछें: ',
        hasEmailLink: true,
      },
    ],
  },
};

export const EditorialPolicyPage = () => {
  const { lang, content } = useLanguage();
  const t = COPY[lang];

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
            items={[{ name: content.nav.breadcrumbHome, href: lang === 'hi' ? '/hi' : '/' }, { name: t.breadcrumb }]}
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
