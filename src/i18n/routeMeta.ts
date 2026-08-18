import type { Lang } from './types';

// Per-route, per-language <title>/description/OG overrides. index.html's static
// tags cover the English homepage default for non-JS clients; LanguageContext
// fills in every other route once JS runs. Kept in its own module (rather than
// inline in LanguageContext.tsx) so this static data — and the route→key
// mapping below — can be unit tested without pulling in React or JSX.
export type RouteKey =
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
  | 'mapsScraper'
  | 'toolsGenerators'
  | 'invoiceGenerator'
  | 'qrCodeGenerator'
  | 'vcardQrCode'
  | 'menuQrCode'
  | 'wifiQrCode'
  | 'toolsDeveloper'
  | 'apiRequestBuilder'
  | 'dbmlDiagramBuilder'
  | 'guides'
  | 'blog';

export const ROUTE_META: Record<Lang, Record<RouteKey, { title: string; description: string }>> = {
  en: {
    home: {
      title: '101 Tech Labs — Full-Stack Web Applications, Noida',
      description:
        'Full-stack web applications with real backend and identity engineering, built in-house. AI added where it earns its place. Noida-based, remote-first, worldwide clients.',
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
    toolsGenerators: {
      title: 'Generators | 101 Tech Labs',
      description: 'Free generator tools from 101 Tech Labs — starting with a browser-based invoice generator. No signup, no catch.',
    },
    invoiceGenerator: {
      title: 'Invoice Generator (Free Tool) | 101 Tech Labs',
      description:
        'Create a professional invoice in your browser and download it as a PDF. No signup, no server — your invoices are saved to your device only.',
    },
    qrCodeGenerator: {
      title: 'QR Code Generator (Free Tool) | 101 Tech Labs',
      description:
        'Free QR code generator for links, contact cards, WiFi, and more. Customize the colors and download as PNG or SVG — no signup, no server, everything runs in your browser.',
    },
    vcardQrCode: {
      title: 'vCard QR Code Generator – Digital Business Card | 101 Tech Labs',
      description:
        "Create a QR code that saves your contact details to someone's phone. Add your name, phone, email, company, and address — free and no signup.",
    },
    menuQrCode: {
      title: 'Menu QR Code Generator – For Restaurants & Cafés | 101 Tech Labs',
      description:
        'Turn your PDF or webpage menu into a scannable QR code for tables, signs, or receipts. Free, no signup, and most phone cameras scan it without an app.',
    },
    wifiQrCode: {
      title: 'WiFi QR Code Generator – Free, No Signup | 101 Tech Labs',
      description:
        'Generate a QR code for your WiFi network so guests can connect without typing the password. Free, works in your browser, and downloads as PNG or SVG.',
    },
    toolsDeveloper: {
      title: 'Developer Tools | 101 Tech Labs',
      description:
        'Free browser-based developer tools from 101 Tech Labs — an API request builder for testing REST APIs, and a DBML diagram builder for database schemas. No signup, no catch.',
    },
    apiRequestBuilder: {
      title: 'Free API Request Builder & REST API Tester | 101 Tech Labs',
      description:
        'Test REST APIs free, right in your browser — GET, POST, PUT, DELETE, and more. Set headers, query params, auth, and request bodies, then inspect the response. No signup required.',
    },
    dbmlDiagramBuilder: {
      title: 'DBML Diagram Builder — Free Database Schema Tool | 101 Tech Labs',
      description:
        'Write DBML and see a live, interactive ER diagram — runs entirely in your browser. Import/export DBML, PNG, and SVG, with local save and shareable links. No signup, no server.',
    },
    guides: {
      title: 'Guides & Tutorials | 101 Tech Labs',
      description: 'Practical guides, tutorials, and explanations for 101 Tech Labs tools and workflows.',
    },
    blog: {
      title: 'Engineering Notes | 101 Tech Labs',
      description: 'Real technical writing on the decisions behind full-stack applications — backend, identity, and judgment calls.',
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
    toolsGenerators: {
      title: 'जनरेटर्स | 101 Tech Labs',
      description: '101 Tech Labs के फ्री जनरेटर टूल्स — शुरुआत ब्राउज़र-आधारित इनवॉइस जनरेटर से। कोई साइनअप नहीं, कोई शर्त नहीं।',
    },
    invoiceGenerator: {
      title: 'इनवॉइस जनरेटर (फ्री टूल) | 101 Tech Labs',
      description:
        'अपने ब्राउज़र में एक प्रोफेशनल इनवॉइस बनाएं और उसे PDF के रूप में डाउनलोड करें। कोई साइनअप नहीं, कोई सर्वर नहीं — आपके इनवॉइस केवल आपकी डिवाइस पर सेव होते हैं।',
    },
    qrCodeGenerator: {
      title: 'QR कोड जनरेटर (फ्री टूल) | 101 Tech Labs',
      description:
        'लिंक, कॉन्टैक्ट कार्ड, WiFi और अन्य के लिए फ्री QR कोड जनरेटर। रंग कस्टमाइज़ करें और PNG या SVG के रूप में डाउनलोड करें — कोई साइनअप नहीं, कोई सर्वर नहीं, सब कुछ आपके ब्राउज़र में ही होता है।',
    },
    toolsDeveloper: {
      title: 'डेवलपर टूल्स | 101 Tech Labs',
      description:
        '101 Tech Labs के फ्री ब्राउज़र-आधारित डेवलपर टूल्स — REST API टेस्ट करने के लिए एक API रिक्वेस्ट बिल्डर और डेटाबेस स्कीमा के लिए एक DBML डायग्राम बिल्डर। कोई साइनअप नहीं, कोई शर्त नहीं।',
    },
    apiRequestBuilder: {
      title: 'फ्री API रिक्वेस्ट बिल्डर और REST API टेस्टर | 101 Tech Labs',
      description:
        'REST API को फ्री में सीधे अपने ब्राउज़र में टेस्ट करें — GET, POST, PUT, DELETE, और अन्य। हेडर, क्वेरी पैरामीटर, ऑथ, और रिक्वेस्ट बॉडी सेट करें, फिर रिस्पॉन्स देखें। कोई साइनअप ज़रूरी नहीं।',
    },
    // No /hi/dbml-diagram-builder, /hi/vcard-qr-code, /hi/menu-qr-code,
    // /hi/wifi-qr-code, /hi/guides, or /hi/blog route exists yet (see
    // App.tsx) — kept here only so this Record<Lang, Record<RouteKey, ...>>
    // stays exhaustive under tsc.
    vcardQrCode: {
      title: 'vCard QR Code Generator – Digital Business Card | 101 Tech Labs',
      description:
        "Create a QR code that saves your contact details to someone's phone. Add your name, phone, email, company, and address — free and no signup.",
    },
    menuQrCode: {
      title: 'Menu QR Code Generator – For Restaurants & Cafés | 101 Tech Labs',
      description:
        'Turn your PDF or webpage menu into a scannable QR code for tables, signs, or receipts. Free, no signup, and most phone cameras scan it without an app.',
    },
    wifiQrCode: {
      title: 'WiFi QR Code Generator – Free, No Signup | 101 Tech Labs',
      description:
        'Generate a QR code for your WiFi network so guests can connect without typing the password. Free, works in your browser, and downloads as PNG or SVG.',
    },
    dbmlDiagramBuilder: {
      title: 'DBML Diagram Builder — Free Database Schema Tool | 101 Tech Labs',
      description:
        'Write DBML and see a live, interactive ER diagram — runs entirely in your browser. Import/export DBML, PNG, and SVG, with local save and shareable links. No signup, no server.',
    },
    guides: {
      title: 'Guides & Tutorials | 101 Tech Labs',
      description: 'Practical guides, tutorials, and explanations for 101 Tech Labs tools and workflows.',
    },
    blog: {
      title: 'Engineering Notes | 101 Tech Labs',
      description: 'Real technical writing on the decisions behind full-stack applications — backend, identity, and judgment calls.',
    },
  },
};

// Routes with no /hi/... counterpart in App.tsx's route table — single
// source of truth for both hreflang generation and language-switcher path
// resolution in LanguageContext.tsx, so neither can drift and point at a
// nonexistent Hindi URL. Split into exact single routes and prefix-matched
// route families (dynamic children like /guides/:category/:slug included).
const ENGLISH_ONLY_EXACT_PATHS: ReadonlySet<string> = new Set([
  '/vcard-qr-code',
  '/menu-qr-code',
  '/wifi-qr-code',
  '/tools/developer/dbml-diagram-builder',
]);

const ENGLISH_ONLY_PATH_PREFIXES = ['/guides', '/blog'];

// `basePathname` must already have any /hi prefix stripped (see
// stripHiPrefix in LanguageContext.tsx) — this checks the language-neutral
// path against the English-only route set above.
export const isEnglishOnlyPath = (basePathname: string): boolean =>
  ENGLISH_ONLY_EXACT_PATHS.has(basePathname) ||
  ENGLISH_ONLY_PATH_PREFIXES.some(
    (prefix) => basePathname === prefix || basePathname.startsWith(`${prefix}/`),
  );

// Pure Hindi-path resolution shared by LanguageContext's toPath — kept here
// (rather than inline in the component) so it's unit-testable without a
// DOM/React environment (see jest.config.cjs: testEnvironment 'node',
// .test.ts only). `basePathname` must already have any /hi prefix stripped.
export const resolveLanguagePath = (basePathname: string, target: Lang, hash: string): string => {
  if (target === 'hi' && isEnglishOnlyPath(basePathname)) {
    // No /hi/... route exists — stay on the current English page instead of
    // navigating to a dead route (the switcher hides this option entirely;
    // this is a defensive fallback for any other caller of toPath).
    return `${basePathname}${hash}`;
  }
  const path = target === 'hi' ? (basePathname === '/' ? '/hi' : `/hi${basePathname}`) : basePathname;
  return `${path}${hash}`;
};

// Static path→RouteKey resolution used by LanguageContext's per-route head
// injection. Anything not listed here (including dynamic /guides/:slug and
// /blog/:slug routes, resolved separately) falls back to 'home'.
export const ROUTE_KEY_BY_PATH: Record<string, RouteKey> = {
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
  '/tools/generators': 'toolsGenerators',
  '/tools/generators/invoice-generator': 'invoiceGenerator',
  '/tools/generators/qr-code-generator': 'qrCodeGenerator',
  '/vcard-qr-code': 'vcardQrCode',
  '/menu-qr-code': 'menuQrCode',
  '/wifi-qr-code': 'wifiQrCode',
  '/tools/developer': 'toolsDeveloper',
  '/tools/developer/api-request-builder': 'apiRequestBuilder',
  '/tools/developer/dbml-diagram-builder': 'dbmlDiagramBuilder',
  '/guides': 'guides',
  '/blog': 'blog',
};
