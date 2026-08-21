import { useLanguage } from '../../i18n/LanguageContext';
import { JsonLd } from './JsonLd';

// Services + FAQPage are homepage-specific entities, so they're injected
// only here rather than living in index.html's static sitewide @graph
// (WebSite + Organization stay there — those genuinely apply to every
// route). Previously the sitewide graph shipped a generic Services+FAQPage
// block on every single page, including the tool page, which also injects
// its own distinct FAQPage — two FAQPage nodes on one rendered document.
export const HomeJsonLd = () => {
  const { content } = useLanguage();

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@graph': [
          ...content.services.map((service) => ({
            '@type': 'Service',
            name: service.title,
            description: service.description,
            provider: { '@id': 'https://101techlabs.com/#organization' },
            areaServed: ['Noida', 'Delhi NCR', 'India'],
            inLanguage: 'en',
          })),
          {
            '@type': 'FAQPage',
            inLanguage: 'en',
            mainEntity: content.faq.items.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
          },
        ],
      }}
    />
  );
};
