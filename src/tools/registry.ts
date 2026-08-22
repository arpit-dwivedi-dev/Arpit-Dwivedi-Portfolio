import { Database, QrCode, Receipt, Send, type LucideIcon } from 'lucide-react';

export interface ToolCategory {
  slug: string;
  title: string;
  description: string;
  /** GUIDE_CATEGORIES slug (src/content/guides/categories.ts) holding the
   *  how-to guides for this tool family — the category page links out to
   *  /guides/[slug] when set. Left unset for families with no guides yet, so
   *  the page never links to an empty hub. */
  guideCategorySlug?: string;
}

// The full taxonomy target (per the IA audit) — categories can exist here
// with zero tools in them; ToolsPage/CategoryPage just render an empty
// state rather than hiding the category.
export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    slug: 'lead-generation',
    title: 'Lead Generation Tools',
    description: 'Find and export business and contact data for outreach, prospecting, and market research.',
  },
  {
    slug: 'seo',
    title: 'SEO Tools',
    description: 'Check titles, meta tags, sitemaps, and other on-page and technical SEO fundamentals.',
  },
  {
    slug: 'developer',
    title: 'Developer Tools',
    description: 'Test REST APIs and diagram database schemas, right in your browser — no signup required.',
    guideCategorySlug: 'developer-tools',
  },
  {
    slug: 'ai',
    title: 'AI Tools',
    description: 'Small AI-assisted utilities for prompts, structured output, and everyday automation.',
  },
  {
    slug: 'converters',
    title: 'Converters',
    description: 'Convert between file formats, encodings, and units.',
  },
  {
    slug: 'generators',
    title: 'Generators',
    description: 'Generate QR codes, passwords, IDs, and other everyday assets.',
  },
  {
    slug: 'validators',
    title: 'Validators & Checkers',
    description: 'Validate emails, phone numbers, schema markup, and other data formats.',
  },
  {
    slug: 'utilities',
    title: 'Utilities',
    description: 'Small tools that don’t fit anywhere else.',
  },
];

export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
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
  /** Excluded from ToolsPage/CategoryPage listings, search, and related-tools
   *  suggestions — but the route and component stay live for anyone with a
   *  direct link. Use for tools pulled from discovery without deleting them. */
  hidden?: boolean;
  /** One real decision made while building this tool — surfaced per
   *  positioning.md ("make the thinking visible"). This is the long form, sized
   *  for a tool page's own section; listing rows use `note` instead. */
  judgment?: string;
  /** Short form of `description` for LISTING rows (ToolsPage, category pages).
   *  `description` is written for search results and runs to four or five lines
   *  in a row, which is what pushed every row to a different height. Falls back
   *  to `description` when unset. */
  lead?: string;
  /** Short form of `judgment` for the same listing rows — two lines at most, so
   *  the build note reads as a remark rather than a paragraph. Falls back to
   *  `judgment` when unset. */
  note?: string;
}

// Adding a tool is a new entry here — ToolRow, ToolsPage, and CategoryPage don't change.
export const TOOLS: ToolDefinition[] = [
  {
    id: 'invoice-generator',
    title: 'Invoice Generator',
    description: 'Create a professional invoice in your browser, download it as a PDF, and save it for later — no signup, no server, your data stays on your device.',
    lead: 'Create a professional invoice in your browser, download it as a PDF, and save it for later.',
    icon: Receipt,
    category: 'generators',
    path: 'invoice-generator',
    featured: true,
    judgment: "Invoice history is saved under a versioned key, on purpose — there's no backend to run a migration against, so a future data-shape change just starts a fresh history instead of crashing on old records.",
    note: 'Invoice history is saved under a versioned key, so a future data-shape change starts a fresh history instead of crashing on old records.',
  },
  {
    id: 'qr-code-generator',
    title: 'QR Code Generator',
    description: 'Create a QR code for a URL, contact card, text, SMS, email, phone number, or social link — customize the colors and download it as a PNG or SVG.',
    lead: 'Create a QR code for a URL, contact card, text, SMS, email, phone number, or social link.',
    icon: QrCode,
    category: 'generators',
    path: 'qr-code-generator',
    relatedToolIds: ['invoice-generator'],
    featured: true,
    judgment: 'Multi-URL and dual-platform QR codes encode all their routing data directly into the URL itself — no backend or database needed to resolve a scan.',
    note: 'Multi-URL and dual-platform codes encode their routing in the URL itself, so no backend has to resolve a scan.',
  },
  {
    id: 'api-request-builder',
    title: 'API Request Builder',
    description: 'Build, send, and inspect HTTP requests from your browser — params, headers, body, and auth, with environments, collections, cURL/OpenAPI/Postman import, and code generation. No signup, no account required.',
    lead: 'Build, send, and inspect HTTP requests from your browser: params, headers, body, and auth.',
    icon: Send,
    category: 'developer',
    path: 'api-request-builder',
    featured: true,
    relatedToolIds: ['dbml-diagram-builder'],
    judgment: 'By default, requests go straight from your browser to the target API over fetch() — a proxy only enters the picture if a direct request gets CORS-blocked and the automatic fallback kicks in, or you explicitly configure one, so the common case still has nothing in between.',
    note: 'Requests go straight from your browser over fetch(); a proxy only enters the picture if CORS blocks the direct call.',
  },
  {
    id: 'dbml-diagram-builder',
    title: 'DBML Diagram Builder',
    description: 'Write DBML and watch an interactive ER diagram build itself — drag tables, auto-layout relationships, and export as DBML, PNG, or SVG. No signup, no server.',
    lead: 'Write DBML and watch an interactive ER diagram build itself, then export it as DBML, PNG, or SVG.',
    icon: Database,
    category: 'developer',
    path: 'dbml-diagram-builder',
    featured: true,
    relatedToolIds: ['api-request-builder'],
    judgment: 'Node positions are keyed by table name and stored per-diagram — editing a column keeps every table exactly where you dragged it, and only a genuinely new table gets auto-placed.',
    note: 'Node positions are keyed by table name, so editing a column keeps every table exactly where you dragged it.',
  },
];

export const categoryTitle = (category: ToolCategory) => category.title;
export const categoryDescription = (category: ToolCategory) => category.description;
export const toolTitle = (tool: ToolDefinition) => tool.title;
export const toolDescription = (tool: ToolDefinition) => tool.description;
export const toolLead = (tool: ToolDefinition) => tool.lead ?? tool.description;
export const toolNote = (tool: ToolDefinition) => tool.note ?? tool.judgment;

export const getToolCategory = (slug: string): ToolCategory | undefined =>
  TOOL_CATEGORIES.find((category) => category.slug === slug);

export const getToolsByCategory = (categorySlug: string): ToolDefinition[] =>
  TOOLS.filter((tool) => tool.category === categorySlug && !tool.hidden);

export const getRelatedTools = (tool: ToolDefinition, limit = 3): ToolDefinition[] => {
  const manual = (tool.relatedToolIds ?? [])
    .map((id) => TOOLS.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is ToolDefinition => Boolean(candidate) && !candidate.hidden);

  if (manual.length >= limit) return manual.slice(0, limit);

  const sameCategoryFallback = TOOLS.filter(
    (candidate) => candidate.category === tool.category && candidate.id !== tool.id && !candidate.hidden && !manual.includes(candidate),
  );

  return [...manual, ...sameCategoryFallback].slice(0, limit);
};
