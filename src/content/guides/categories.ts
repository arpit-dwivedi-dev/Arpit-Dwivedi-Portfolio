import type { Guide } from './types';

export interface GuideCategory {
  slug: string;
  title: string;
  description: string;
}

// Guide categories track the site's free-tool families (see
// src/tools/registry.ts TOOL_CATEGORIES) rather than the finer editorial
// sub-topics the invoicing guides used to be split into (Getting Paid,
// Document Basics, Client Billing, Business Finance) — those four now all
// roll up into 'invoicing'. Array order is display order on GuidesPage.
// Add a category here only once guides actually exist for it.
export const GUIDE_CATEGORIES: GuideCategory[] = [
  {
    slug: 'invoicing',
    title: 'Invoicing',
    description: 'Practical guides for creating, sending, and managing invoices — getting paid, invoice basics, client billing, and business finance.',
  },
  {
    slug: 'qr-code',
    title: 'QR Codes',
    description: 'Guides on generating and using QR codes.',
  },
  {
    slug: 'developer-tools',
    title: 'Developer Tools',
    description: 'Guides for developer-focused tools like the API request builder.',
  },
];

export const getGuideCategory = (slug: string): GuideCategory | undefined =>
  GUIDE_CATEGORIES.find((category) => category.slug === slug);

export const guideCategoryTitle = (slug: string): string => getGuideCategory(slug)?.title ?? slug;

// The single canonical URL builder for a guide article — every article link
// (cards, related guides, tool-page CTAs, sitemap, JSON-LD, canonical tags)
// must go through this rather than hand-building `/guides/${slug}` or
// `/guides/${category}/${slug}` inline, so the URL shape only lives in one
// place. Also imported (via tsx, since this file is plain TS) by
// scripts/generate-sitemap.mjs.
export const guidePath = (guide: Pick<Guide, 'category' | 'slug'>): string =>
  `/guides/${guide.category}/${guide.slug}`;

export interface GuideCategoryWithCount extends GuideCategory {
  count: number;
}

// Categories with zero guides are dropped rather than shown with a "(0)" —
// both the /guides hub's category nav and each category page's cross-links
// to sibling categories share this so a future empty category never shows
// up as a dead end in either place.
export const getGuideCategoriesWithCounts = (guides: Guide[]): GuideCategoryWithCount[] => {
  const counts = new Map<string, number>();
  for (const guide of guides) counts.set(guide.category, (counts.get(guide.category) ?? 0) + 1);
  return GUIDE_CATEGORIES.filter((category) => counts.has(category.slug)).map((category) => ({
    ...category,
    count: counts.get(category.slug)!,
  }));
};
