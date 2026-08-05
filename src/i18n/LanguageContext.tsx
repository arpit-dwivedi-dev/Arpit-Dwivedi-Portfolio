import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import metadata from '../../metadata.json';
import { hiContent } from '../content/hi';
import type { SiteContent, Lang } from './types';

export type { SiteContent, Lang };

interface LanguageContextValue {
  lang: Lang;
  content: SiteContent;
  // Path (relative to the router basename) for the given language,
  // preserving the current page and hash — used by real <Link>s, never
  // an in-place content swap, so the browser announces a page change.
  toPath: (target: Lang) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const stripHiPrefix = (pathname: string) => {
  const stripped = pathname.replace(/^\/hi(?=\/|$)/, '');
  return stripped === '' ? '/' : stripped;
};

// Fixed production origin rather than window.location.origin — this file
// also runs during the build-time prerender pass (see scripts/prerender.mjs),
// where the page is served from http://localhost, and canonical/hreflang
// tags baked into the static HTML must point at the real domain regardless
// of where they were generated. Matches the domain hardcoded in index.html,
// public/sitemap.xml, and the JSON-LD graph.
const SITE_ORIGIN = 'https://101techlabs.com';

// Absolute URL for a given (lang, pathname) pair, honoring the base path
// GitHub Pages serves this app from — used for the hreflang link tags.
const absoluteUrl = (target: Lang, basePathname: string) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = target === 'hi' ? (basePathname === '/' ? '/hi' : `/hi${basePathname}`) : basePathname;
  return `${SITE_ORIGIN}${base}${path === '/' ? '/' : path}`;
};

const upsertAlternateLink = (hreflang: string, href: string) => {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = hreflang;
    document.head.appendChild(link);
  }
  link.href = href;
};

const upsertCanonical = (href: string) => {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
};

const upsertMetaByName = (name: string, content: string) => {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const upsertMetaByProperty = (property: string, content: string) => {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

// Per-route, per-language <title>/description/OG overrides. index.html's static
// tags cover the English homepage default for non-JS clients; this fills in
// every other route once JS runs.
type RouteKey =
  | 'home'
  | 'projects'
  | 'about'
  | 'services'
  | 'contact'
  | 'privacyPolicy'
  | 'terms'
  | 'editorialPolicy'
  | 'tools'
  | 'toolsLeadGeneration'
  | 'mapsScraper';

const ROUTE_META: Record<Lang, Record<RouteKey, { title: string; description: string }>> = {
  en: {
    home: {
      title: '101 Tech Labs — AI Automation & Custom Software Development, Noida',
      description:
        'Noida-based software studio building AI agents, RAG pipelines, and custom enterprise platforms — including HRMS systems — for businesses across India and remote clients worldwide. Get a fixed-scope quote.',
    },
    projects: {
      title: 'Case Studies & Client Work | 101 Tech Labs',
      description:
        'See how 101 Tech Labs built a donor and outreach platform for Rashtriya Swasthya Sangathan and a corporate site for ISO-certified manufacturer SA Ethics Biotech — real client engagements, not templates.',
    },
    about: {
      title: 'About Us | 101 Tech Labs',
      description: 'Who builds 101 Tech Labs — a Noida-based full-stack and AI engineering practice, remote-first, working with clients worldwide.',
    },
    services: {
      title: 'Services — Business Websites, Booking Systems, AI Automation | 101 Tech Labs',
      description: 'Business websites, online booking and ordering systems, workflow automation, local SEO, and AI/LLM engineering — under one roof.',
    },
    contact: {
      title: 'Contact Us | 101 Tech Labs',
      description: 'Get a fixed-scope quote or ask a question — email, WhatsApp, or the form below.',
    },
    privacyPolicy: {
      title: 'Privacy Policy | 101 Tech Labs',
      description: 'What data 101 Tech Labs collects when you visit this site, use a free tool, or contact us, and how it is used.',
    },
    terms: {
      title: 'Terms of Service | 101 Tech Labs',
      description: 'Terms for using 101techlabs.com, including our free tools.',
    },
    editorialPolicy: {
      title: 'Editorial Policy | 101 Tech Labs',
      description: 'How we write and fact-check articles and tool documentation on 101techlabs.com.',
    },
    tools: {
      title: 'Free Tools | 101 Tech Labs',
      description: 'Free browser tools from 101 Tech Labs — starting with a Google Maps business finder. No signup, no catch.',
    },
    toolsLeadGeneration: {
      title: 'Lead Generation Tools | 101 Tech Labs',
      description: 'Free tools for finding and exporting business and contact data — starting with a Google Maps business finder.',
    },
    mapsScraper: {
      title: 'Google Maps Business Finder (Free Tool) | 101 Tech Labs',
      description:
        'Find businesses on Google Maps and pull their name, address, phone, website, rating, and hours into a CSV. Built for quick lookups, not bulk scraping.',
    },
  },
  hi: {
    home: {
      title: '101 Tech Labs — नोएडा में AI ऑटोमेशन और कस्टम सॉफ़्टवेयर डेवलपमेंट',
      description:
        'नोएडा स्थित सॉफ़्टवेयर स्टूडियो — AI एजेंट, RAG पाइपलाइन, और कस्टम एंटरप्राइज़ प्लेटफ़ॉर्म (HRMS सिस्टम सहित) बनाते हैं, भारत भर के बिज़नेस और दुनिया भर के रिमोट क्लाइंट्स के लिए।',
    },
    projects: {
      title: 'केस स्टडीज़ और क्लाइंट वर्क | 101 Tech Labs',
      description:
        'देखें कैसे 101 Tech Labs ने राष्ट्रीय स्वास्थ्य संगठन के लिए डोनर और आउटरीच प्लेटफ़ॉर्म बनाया, और ISO-सर्टिफ़ाइड निर्माता SA Ethics Biotech के लिए कॉर्पोरेट साइट बनाई — असली क्लाइंट प्रोजेक्ट्स, टेम्पलेट नहीं।',
    },
    about: {
      title: 'हमारे बारे में | 101 Tech Labs',
      description: '101 Tech Labs को कौन बनाता है — नोएडा स्थित फुल-स्टैक और AI इंजीनियरिंग प्रैक्टिस, रिमोट-फर्स्ट, दुनिया भर के क्लाइंट्स के साथ काम करती है।',
    },
    services: {
      title: 'सेवाएं — बिज़नेस वेबसाइट, बुकिंग सिस्टम, AI ऑटोमेशन | 101 Tech Labs',
      description: 'बिज़नेस वेबसाइट, ऑनलाइन बुकिंग और ऑर्डरिंग सिस्टम, वर्कफ़्लो ऑटोमेशन, लोकल SEO, और AI/LLM इंजीनियरिंग — एक ही जगह।',
    },
    contact: {
      title: 'संपर्क करें | 101 Tech Labs',
      description: 'फिक्स्ड-स्कोप कोटेशन पाएं या सवाल पूछें — ईमेल, व्हाट्सएप, या नीचे दिए गए फ़ॉर्म से।',
    },
    privacyPolicy: {
      title: 'प्राइवेसी पॉलिसी | 101 Tech Labs',
      description: 'जब आप यह साइट देखते हैं, कोई फ्री टूल इस्तेमाल करते हैं, या हमसे संपर्क करते हैं, तो 101 Tech Labs कौन सा डेटा इकट्ठा करता है और उसका उपयोग कैसे होता है।',
    },
    terms: {
      title: 'सेवा की शर्तें | 101 Tech Labs',
      description: '101techlabs.com और इसके फ्री टूल्स के इस्तेमाल की शर्तें।',
    },
    editorialPolicy: {
      title: 'एडिटोरियल पॉलिसी | 101 Tech Labs',
      description: '101techlabs.com पर लेख और टूल डॉक्यूमेंटेशन कैसे लिखे और फ़ैक्ट-चेक किए जाते हैं।',
    },
    tools: {
      title: 'फ्री टूल्स | 101 Tech Labs',
      description: '101 Tech Labs के फ्री ब्राउज़र टूल्स — शुरुआत गूगल मैप्स बिज़नेस फ़ाइंडर से। कोई साइनअप नहीं, कोई शर्त नहीं।',
    },
    toolsLeadGeneration: {
      title: 'लीड जनरेशन टूल्स | 101 Tech Labs',
      description: 'बिज़नेस और कॉन्टैक्ट डेटा खोजने और एक्सपोर्ट करने के फ्री टूल्स — शुरुआत गूगल मैप्स बिज़नेस फ़ाइंडर से।',
    },
    mapsScraper: {
      title: 'गूगल मैप्स बिज़नेस फ़ाइंडर (फ्री टूल) | 101 Tech Labs',
      description:
        'गूगल मैप्स पर बिज़नेस खोजें और उनका नाम, पता, फ़ोन नंबर, वेबसाइट, रेटिंग और समय एक CSV में निकालें। छोटे लुकअप के लिए बना है, बल्क स्क्रैपिंग के लिए नहीं।',
    },
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const isHindi = location.pathname === '/hi' || location.pathname.startsWith('/hi/');
  const lang: Lang = isHindi ? 'hi' : 'en';

  const content = isHindi ? hiContent : metadata.content;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const basePathname = stripHiPrefix(location.pathname);
    upsertAlternateLink('en', absoluteUrl('en', basePathname));
    upsertAlternateLink('hi', absoluteUrl('hi', basePathname));
    upsertAlternateLink('x-default', absoluteUrl('en', basePathname));

    const ROUTE_KEY_BY_PATH: Record<string, RouteKey> = {
      '/projects': 'projects',
      '/about': 'about',
      '/services': 'services',
      '/contact': 'contact',
      '/privacy-policy': 'privacyPolicy',
      '/terms': 'terms',
      '/editorial-policy': 'editorialPolicy',
      '/tools': 'tools',
      '/tools/lead-generation': 'toolsLeadGeneration',
      '/tools/lead-generation/google-maps-business-finder': 'mapsScraper',
    };
    const routeKey: RouteKey = ROUTE_KEY_BY_PATH[basePathname] ?? 'home';
    const meta = ROUTE_META[lang][routeKey];
    const canonicalHref = absoluteUrl(lang, basePathname);

    document.title = meta.title;
    upsertCanonical(canonicalHref);
    upsertMetaByName('description', meta.description);
    upsertMetaByProperty('og:title', meta.title);
    upsertMetaByProperty('og:description', meta.description);
    upsertMetaByProperty('og:url', canonicalHref);
    upsertMetaByName('twitter:title', meta.title);
    upsertMetaByName('twitter:description', meta.description);
  }, [location.pathname, lang]);

  const toPath: LanguageContextValue['toPath'] = (target) => {
    const basePathname = stripHiPrefix(location.pathname);
    const path = target === 'hi' ? (basePathname === '/' ? '/hi' : `/hi${basePathname}`) : basePathname;
    return `${path}${location.hash}`;
  };

  return (
    <LanguageContext.Provider value={{ lang, content, toPath }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};
