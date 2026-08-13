export interface BlogIndexContent {
  breadcrumbLabel: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  allPostsLabel: string;
  categoriesAriaLabel: string;
  readTimeSuffix: string;
}

export interface BlogDetailContent {
  breadcrumbLabel: string;
  updatedPrefix: string;
  readTimeSuffix: string;
  faqHeading: string;
  relatedHeading: string;
  ctaText: string;
  ctaButton: string;
}

// English-only, same pattern and reasoning as guides/pageContent.ts — no
// /hi/blog route exists (see App.tsx).
export const blogIndexContent: BlogIndexContent = {
  breadcrumbLabel: 'Blog',
  eyebrow: 'Engineering Notes',
  title: 'Backend, Identity,',
  titleAccent: 'and Judgment Calls',
  description: 'Real technical writing on the decisions behind full-stack applications — not lorem ipsum, not a fabricated case study.',
  allPostsLabel: 'All Posts',
  categoriesAriaLabel: 'Filter posts by category',
  readTimeSuffix: 'min read',
};

export const blogDetailContent: BlogDetailContent = {
  breadcrumbLabel: 'Blog',
  updatedPrefix: 'Updated',
  readTimeSuffix: 'min read',
  faqHeading: 'FAQ',
  relatedHeading: 'Related Posts',
  ctaText: 'Need this kind of thinking applied to your own project?',
  ctaButton: 'Get in touch',
};
