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

// Absolute URL for a given (lang, pathname) pair, honoring the base path
// GitHub Pages serves this app from — used for the hreflang link tags.
const absoluteUrl = (target: Lang, basePathname: string) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = target === 'hi' ? (basePathname === '/' ? '/hi' : `/hi${basePathname}`) : basePathname;
  return `${window.location.origin}${base}${path === '/' ? '/' : path}`;
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
// tags cover the English homepage default for non-JS clients; this fills in the
// other 3 routes (/hi, /projects, /hi/projects) once JS runs.
const ROUTE_META: Record<Lang, Record<'home' | 'projects', { title: string; description: string }>> = {
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

    const routeKey = basePathname === '/projects' ? 'projects' : 'home';
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
