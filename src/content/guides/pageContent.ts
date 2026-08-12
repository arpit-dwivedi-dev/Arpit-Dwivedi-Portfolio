export interface GuidesIndexContent {
  breadcrumbLabel: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  allGuidesLabel: string;
  categoriesAriaLabel: string;
  ctaText: string;
  ctaButton: string;
  readTimeSuffix: string;
}

export interface GuideDetailContent {
  breadcrumbLabel: string;
  updatedPrefix: string;
  readTimeSuffix: string;
  faqHeading: string;
  relatedHeading: string;
  ctaText: string;
  ctaButton: string;
}

// English-only, like guides/data.ts itself — /guides has no /hi route (see
// App.tsx), so this deliberately lives outside the SiteContent/useLanguage()
// system rather than metadata.json, which would force hi.ts to implement
// matching keys it can never render just to satisfy SiteContent's exhaustive
// typing.
export const guidesIndexContent: GuidesIndexContent = {
  breadcrumbLabel: 'Guides',
  eyebrow: 'Invoicing Guides',
  title: 'Learn',
  titleAccent: 'Invoicing',
  description: 'No-fluff invoicing guides for freelancers and small businesses — not accountants.',
  allGuidesLabel: 'All Guides',
  categoriesAriaLabel: 'Filter guides by category',
  ctaText: 'Ready to put this into practice?',
  ctaButton: 'Try the free Invoice Generator',
  readTimeSuffix: 'min read',
};

export const guideDetailContent: GuideDetailContent = {
  breadcrumbLabel: 'Guides',
  updatedPrefix: 'Updated',
  readTimeSuffix: 'min read',
  faqHeading: 'FAQ',
  relatedHeading: 'Related Guides',
  ctaText: 'Put this into practice with a real invoice.',
  ctaButton: 'Try the free Invoice Generator',
};
