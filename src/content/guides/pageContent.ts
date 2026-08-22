export interface GuidesIndexContent {
  breadcrumbLabel: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  /** Carries `{count}` — the total number of guides. */
  description: string;
  /** Carries `{count}`. Section rule above the ledger band. */
  allGuidesLabel: string;
  categoriesAriaLabel: string;
  otherCategoriesLabel: string;
  ctaText: string;
  ctaButton: string;
  readTimeSuffix: string;

  /** Carries `{count}` — the number of populated categories. */
  topicsRuleLabel: string;
  topicsTitle: string;
  /** Carries `{category}`. */
  browseCategoryLabel: string;
  /** Carries `{count}`; `guideCountOne` is the singular form. */
  guideCount: string;
  guideCountOne: string;
  ledgerTitle: string;
  ledgerDescription: string;
  readLabel: string;
  /** Carries `{category}` — the largest category, resolved at render time. */
  heroSecondaryCta: string;
  /** The guide the hero panel previews. Must be a real GUIDES slug; the panel
   *  renders nothing if it stops resolving. */
  heroFeaturedSlug: string;
  heroPanelTocLabel: string;
  heroPanelToolLabel: string;
  heroPanelNote: string;
  ctaEyebrow: string;
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
  eyebrow: 'Written while building the tools',
  title: 'No-fluff',
  titleAccent: 'guides',
  description:
    '{count} guides on invoicing, developer tools and QR codes — each one written because a tool on this site needed explaining, not because a keyword did.',
  allGuidesLabel: 'All guides · {count}',
  categoriesAriaLabel: 'Browse guides by category',
  otherCategoriesLabel: 'Other topics',
  ctaText: 'Ready to put this into practice?',
  ctaButton: 'Browse the free tools',
  readTimeSuffix: 'min read',

  topicsRuleLabel: '{count} topics',
  topicsTitle: "Pick the thing you're stuck on.",
  browseCategoryLabel: 'Browse {category}',
  guideCount: '{count} guides',
  guideCountOne: '{count} guide',
  ledgerTitle: 'The whole shelf, in one list.',
  ledgerDescription:
    "{count} guides is too many for a card grid, so they're a ledger: name, the one thing it answers, how long it takes.",
  readLabel: 'Read',
  heroSecondaryCta: 'Start with {category}',
  heroFeaturedSlug: 'invoice-payment-terms',
  heroPanelTocLabel: 'In this guide',
  heroPanelToolLabel: 'Do it in the tool',
  heroPanelNote: 'Every guide ends in a working tool.',
  ctaEyebrow: 'Reading is the easy part',
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
