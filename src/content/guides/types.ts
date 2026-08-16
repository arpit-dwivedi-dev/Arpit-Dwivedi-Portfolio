import type { ApiExample } from '../../tools/apiRequestBuilder/example';

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  /** Interactive "Open in API Request Builder" examples for this section (see
   *  src/tools/apiRequestBuilder/example.ts and components/guides/ApiExampleCard.tsx).
   *  Optional and additive — a section with no examples renders exactly as before. */
  examples?: ApiExample[];
}

export interface GuideFaqItem {
  question: string;
  answer: string;
}

export interface Guide {
  slug: string;
  title: string;
  /** Meta description + card excerpt — kept under ~160 chars. */
  description: string;
  /** Must match a GUIDE_CATEGORIES slug (see ./categories). */
  category: string;
  /** Keeps the page live and linkable but excludes it from the sitemap and
   *  tells crawlers not to index it (see GuidePage's robots-meta effect) —
   *  for guides judged too thin/overlapping to serve as an indexable
   *  landing page without being merged or removed outright. */
  noindex?: boolean;
  readTimeMinutes: number;
  publishedDate: string;
  updatedDate: string;
  intro: string[];
  sections: GuideSection[];
  faq: GuideFaqItem[];
  relatedSlugs: string[];
  /** Overrides the guide-detail CTA copy/link/label, which otherwise
   *  defaults to the Invoice Generator — needed for guides about a
   *  different tool. */
  ctaText?: string;
  ctaToolHref?: string;
  ctaToolLabel?: string;
}
