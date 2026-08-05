import { MapPin, Receipt, type LucideIcon } from 'lucide-react';
import type { Lang } from '../i18n/types';

export interface ToolCategory {
  slug: string;
  title: string;
  description: string;
  titleHi: string;
  descriptionHi: string;
}

// The full taxonomy target (per the IA audit) — categories can exist here
// with zero tools in them; ToolsPage/CategoryPage just render an empty
// state rather than hiding the category.
export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    slug: 'lead-generation',
    title: 'Lead Generation Tools',
    description: 'Find and export business and contact data for outreach, prospecting, and market research.',
    titleHi: 'लीड जनरेशन टूल्स',
    descriptionHi: 'आउटरीच, प्रॉस्पेक्टिंग, और मार्केट रिसर्च के लिए बिज़नेस और कॉन्टैक्ट डेटा खोजें और एक्सपोर्ट करें।',
  },
  {
    slug: 'seo',
    title: 'SEO Tools',
    description: 'Check titles, meta tags, sitemaps, and other on-page and technical SEO fundamentals.',
    titleHi: 'SEO टूल्स',
    descriptionHi: 'टाइटल, मेटा टैग, साइटमैप, और अन्य ऑन-पेज व टेक्निकल SEO फंडामेंटल्स जांचें।',
  },
  {
    slug: 'developer',
    title: 'Developer Tools',
    description: 'Everyday utilities for formatting, testing, and debugging code.',
    titleHi: 'डेवलपर टूल्स',
    descriptionHi: 'कोड फॉर्मेटिंग, टेस्टिंग, और डिबगिंग के लिए रोज़मर्रा की यूटिलिटीज़।',
  },
  {
    slug: 'ai',
    title: 'AI Tools',
    description: 'Small AI-assisted utilities for prompts, structured output, and everyday automation.',
    titleHi: 'AI टूल्स',
    descriptionHi: 'प्रॉम्प्ट्स, स्ट्रक्चर्ड आउटपुट, और रोज़मर्रा के ऑटोमेशन के लिए छोटी AI-सहायित यूटिलिटीज़।',
  },
  {
    slug: 'converters',
    title: 'Converters',
    description: 'Convert between file formats, encodings, and units.',
    titleHi: 'कन्वर्टर्स',
    descriptionHi: 'फ़ाइल फ़ॉर्मेट, एन्कोडिंग, और यूनिट्स के बीच कन्वर्ट करें।',
  },
  {
    slug: 'generators',
    title: 'Generators',
    description: 'Generate QR codes, passwords, IDs, and other everyday assets.',
    titleHi: 'जनरेटर्स',
    descriptionHi: 'QR कोड, पासवर्ड, ID, और अन्य रोज़मर्रा के एसेट्स जनरेट करें।',
  },
  {
    slug: 'validators',
    title: 'Validators & Checkers',
    description: 'Validate emails, phone numbers, schema markup, and other data formats.',
    titleHi: 'वैलिडेटर्स और चेकर्स',
    descriptionHi: 'ईमेल, फ़ोन नंबर, स्कीमा मार्कअप, और अन्य डेटा फ़ॉर्मेट वैलिडेट करें।',
  },
  {
    slug: 'utilities',
    title: 'Utilities',
    description: 'Small tools that don’t fit anywhere else.',
    titleHi: 'यूटिलिटीज़',
    descriptionHi: 'छोटे टूल्स जो कहीं और फ़िट नहीं होते।',
  },
];

export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  titleHi: string;
  descriptionHi: string;
  icon: LucideIcon;
  /** Must match a TOOL_CATEGORIES slug. Route: /tools/[category]/[path] (or /hi/tools/...). */
  category: string;
  /** Route segment under /tools/[category]. */
  path: string;
  /** ISO date the tool went live. Unset until we have a real launch date — leave
   *  unset rather than guessing; "Newest Tools" sorting treats unset as oldest. */
  launchDate?: string;
  /** Curated cross-links, editorial (not algorithmic). Falls back to same-category tools when empty. */
  relatedToolIds?: string[];
  /** Manual "Popular Tools" flag — swap to real 30-day GA4 pageviews once that data exists. */
  featured?: boolean;
}

// Adding tool #2 is a new entry here — ToolCard, ToolsPage, and CategoryPage don't change.
export const TOOLS: ToolDefinition[] = [
  {
    id: 'google-maps-business-finder',
    title: 'Google Maps Business Finder',
    description: 'Find businesses on Google Maps and pull their name, address, phone, website, rating, and hours into a table you can export as CSV.',
    titleHi: 'गूगल मैप्स बिज़नेस फ़ाइंडर',
    descriptionHi: 'गूगल मैप्स पर बिज़नेस खोजें और उनका नाम, पता, फ़ोन, वेबसाइट, रेटिंग, और समय एक ऐसी टेबल में निकालें जिसे आप CSV के रूप में एक्सपोर्ट कर सकते हैं।',
    icon: MapPin,
    category: 'lead-generation',
    path: 'google-maps-business-finder',
    featured: true,
  },
  {
    id: 'invoice-generator',
    title: 'Invoice Generator',
    description: 'Create a professional invoice in your browser, download it as a PDF, and save it for later — no signup, no server, your data stays on your device.',
    titleHi: 'इनवॉइस जनरेटर',
    descriptionHi: 'अपने ब्राउज़र में एक प्रोफेशनल इनवॉइस बनाएं, उसे PDF के रूप में डाउनलोड करें, और बाद के लिए सेव करें — कोई साइनअप नहीं, कोई सर्वर नहीं, आपका डेटा आपकी डिवाइस पर ही रहता है।',
    icon: Receipt,
    category: 'generators',
    path: 'invoice-generator',
    featured: true,
  },
];

export const categoryTitle = (category: ToolCategory, lang: Lang) => (lang === 'hi' ? category.titleHi : category.title);
export const categoryDescription = (category: ToolCategory, lang: Lang) => (lang === 'hi' ? category.descriptionHi : category.description);
export const toolTitle = (tool: ToolDefinition, lang: Lang) => (lang === 'hi' ? tool.titleHi : tool.title);
export const toolDescription = (tool: ToolDefinition, lang: Lang) => (lang === 'hi' ? tool.descriptionHi : tool.description);

export const getToolCategory = (slug: string): ToolCategory | undefined =>
  TOOL_CATEGORIES.find((category) => category.slug === slug);

export const getToolsByCategory = (categorySlug: string): ToolDefinition[] =>
  TOOLS.filter((tool) => tool.category === categorySlug);

export const getRelatedTools = (tool: ToolDefinition, limit = 3): ToolDefinition[] => {
  const manual = (tool.relatedToolIds ?? [])
    .map((id) => TOOLS.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is ToolDefinition => Boolean(candidate));

  if (manual.length >= limit) return manual.slice(0, limit);

  const sameCategoryFallback = TOOLS.filter(
    (candidate) => candidate.category === tool.category && candidate.id !== tool.id && !manual.includes(candidate),
  );

  return [...manual, ...sameCategoryFallback].slice(0, limit);
};
