import { useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/AchievementsContact';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { useLanguage } from '../../i18n/LanguageContext';

const CONTACT_EMAIL = '101techlabs@gmail.com';

const COPY = {
  en: {
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
          { label: 'Free tool inputs', text: 'search terms you enter into a tool (e.g. the Google Maps Business Finder) are used to run that search and are not stored on our servers after your session ends.' },
          { label: 'Analytics', text: 'we use Google Analytics and Google Tag Manager to understand aggregate site usage (pages viewed, approximate location, device type). This does not identify you personally.' },
          { label: 'Advertising', text: 'we use Google AdSense to show ads on our free tools pages. Google and its partners may use cookies to serve ads based on your visits to this and other sites.', adSettingsLinkText: 'You can manage ad personalization at' },
        ],
      },
      {
        title: 'Third parties we use',
        body: 'Google Analytics, Google Tag Manager, and Google AdSense (analytics and advertising); Web3Forms (contact form delivery); WhatsApp Business (if you message us via the WhatsApp button). Each operates under its own privacy policy.',
      },
      {
        title: "What we don't do",
        body: "We don't sell your personal data. We don't require an account or payment to use any free tool. We don't store the results of your free tool searches on our servers beyond your active session.",
      },
      {
        title: 'Your choices',
        body: 'You can request a copy of, or deletion of, any personal data you\'ve sent us (e.g. via the contact form) by emailing the address below. Most browsers let you block or delete cookies; doing so may affect analytics and ad personalization but not the free tools themselves.',
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
  },
  hi: {
    pageTitle: 'प्राइवेसी पॉलिसी',
    breadcrumb: 'प्राइवेसी पॉलिसी',
    lastUpdated: 'आख़िरी बार अपडेट: अगस्त 2026',
    reviewedBy: 'रिव्यू किया गया: अर्पित द्विवेदी, फ़ाउंडर',
    sections: [
      {
        title: 'यह पॉलिसी क्या कवर करती है',
        body: 'यह पॉलिसी बताती है कि जब आप 101techlabs.com पर आते हैं, हमारे किसी फ्री टूल का इस्तेमाल करते हैं, या हमसे संपर्क करते हैं, तो 101 Tech Labs ("हम") कौन सा डेटा इकट्ठा करता है — और उसका उपयोग कैसे होता है।',
      },
      {
        title: 'हम कौन सी जानकारी इकट्ठा करते हैं',
        list: [
          { label: 'कॉन्टैक्ट फ़ॉर्म सबमिशन', text: 'आपका नाम, ईमेल एड्रेस, और मैसेज — जिसका उपयोग सिर्फ़ आपकी पूछताछ का जवाब देने के लिए किया जाता है।' },
          { label: 'फ्री टूल इनपुट', text: 'किसी टूल में आपके द्वारा डाले गए सर्च टर्म (जैसे Google Maps Business Finder) उस सर्च को चलाने के लिए इस्तेमाल होते हैं और आपका सेशन खत्म होने के बाद हमारे सर्वर पर स्टोर नहीं होते।' },
          { label: 'एनालिटिक्स', text: 'हम Google Analytics और Google Tag Manager का उपयोग साइट के कुल इस्तेमाल (देखे गए पेज, अनुमानित लोकेशन, डिवाइस टाइप) को समझने के लिए करते हैं। इससे आपकी व्यक्तिगत पहचान नहीं होती।' },
          { label: 'विज्ञापन', text: 'हम अपने फ्री टूल पेजों पर विज्ञापन दिखाने के लिए Google AdSense का उपयोग करते हैं। Google और उसके पार्टनर्स इस और अन्य साइटों पर आपके विज़िट के आधार पर विज्ञापन दिखाने के लिए कुकीज़ का उपयोग कर सकते हैं।', adSettingsLinkText: 'आप विज्ञापन पर्सनलाइज़ेशन को यहां मैनेज कर सकते हैं:' },
        ],
      },
      {
        title: 'हम जिन थर्ड पार्टीज़ का उपयोग करते हैं',
        body: 'Google Analytics, Google Tag Manager, और Google AdSense (एनालिटिक्स और विज्ञापन); Web3Forms (कॉन्टैक्ट फ़ॉर्म डिलीवरी); WhatsApp Business (यदि आप WhatsApp बटन से मैसेज करते हैं)। हर एक अपनी खुद की प्राइवेसी पॉलिसी के तहत काम करता है।',
      },
      {
        title: 'हम क्या नहीं करते',
        body: 'हम आपका व्यक्तिगत डेटा नहीं बेचते। किसी भी फ्री टूल का उपयोग करने के लिए हमें अकाउंट या पेमेंट की ज़रूरत नहीं होती। हम आपके फ्री टूल सर्च के नतीजों को आपके एक्टिव सेशन से आगे अपने सर्वर पर स्टोर नहीं करते।',
      },
      {
        title: 'आपके विकल्प',
        body: 'आप हमें भेजे गए किसी भी व्यक्तिगत डेटा (जैसे कॉन्टैक्ट फ़ॉर्म के ज़रिए) की कॉपी या उसे डिलीट करने का अनुरोध नीचे दिए ईमेल पर मैसेज करके कर सकते हैं। ज़्यादातर ब्राउज़र आपको कुकीज़ ब्लॉक या डिलीट करने देते हैं; ऐसा करने से एनालिटिक्स और विज्ञापन पर्सनलाइज़ेशन प्रभावित हो सकते हैं, लेकिन फ्री टूल्स खुद प्रभावित नहीं होते।',
        hasEmailLink: true,
      },
      {
        title: 'ग्रीवांस अधिकारी',
        body: 'भारत के डिजिटल पर्सनल डेटा प्रोटेक्शन एक्ट के तहत, आपके डेटा को कैसे संभाला जाता है इस बारे में सवाल या शिकायतें हमारे ग्रीवांस अधिकारी, अर्पित द्विवेदी (फ़ाउंडर), को नीचे दिए ईमेल पर भेजी जा सकती हैं।',
        hasEmailLink: true,
      },
      {
        title: 'इस पॉलिसी में बदलाव',
        body: 'अगर इस पॉलिसी में कोई बड़ा बदलाव होता है, तो हम ऊपर दी गई "आख़िरी बार अपडेट" की तारीख को अपडेट कर देंगे।',
      },
      {
        title: 'संपर्क करें',
        body: 'इस पॉलिसी के बारे में सवाल: ',
        hasEmailLink: true,
      },
    ],
  },
};

export const PrivacyPolicyPage = () => {
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
                {section.list ? (
                  <ul className="list-disc list-inside space-y-1">
                    {section.list.map((item) => (
                      <li key={item.label}>
                        <strong className="text-ink">{item.label}</strong> — {item.text}
                        {item.adSettingsLinkText ? (
                          <>
                            {' '}
                            {item.adSettingsLinkText}{' '}
                            <a href="https://adssettings.google.com" target="_blank" rel="noreferrer" className="text-accent-blue hover:underline">
                              adssettings.google.com
                            </a>
                            .
                          </>
                        ) : null}
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
