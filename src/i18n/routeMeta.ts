// Per-route <title>/description/OG overrides. index.html's static tags cover
// the homepage default for non-JS clients; LanguageContext fills in every
// other route once JS runs. Kept in its own module (rather than inline in
// LanguageContext.tsx) so this static data — and the route→key mapping
// below — can be unit tested without pulling in React or JSX.
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

export const ROUTE_META: Record<RouteKey, { title: string; description: string }> = {
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
    description: 'Free browser tools from 101 Tech Labs — starting with a browser-based invoice generator. No signup, no catch.',
  },
  toolsLeadGeneration: {
    title: 'Lead Generation Tools | 101 Tech Labs',
    description: 'Free tools for finding and exporting business and contact data.',
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
