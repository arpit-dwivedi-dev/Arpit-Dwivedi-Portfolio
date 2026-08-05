import { MapPin, type LucideIcon } from 'lucide-react';

export interface ToolCategory {
  slug: string;
  title: string;
  description: string;
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
    description: 'Everyday utilities for formatting, testing, and debugging code.',
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
}

// Adding tool #2 is a new entry here — ToolCard, ToolsPage, and CategoryPage don't change.
export const TOOLS: ToolDefinition[] = [
  {
    id: 'google-maps-business-finder',
    title: 'Google Maps Business Finder',
    description: 'Find businesses on Google Maps and pull their name, address, phone, website, rating, and hours into a table you can export as CSV.',
    icon: MapPin,
    category: 'lead-generation',
    path: 'google-maps-business-finder',
    featured: true,
  },
];

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
