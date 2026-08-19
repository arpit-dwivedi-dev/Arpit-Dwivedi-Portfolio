export interface BlogIndexContent {
  breadcrumbLabel: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  readTimeSuffix: string;
  sourcePrefix: string;
  loadingLabel: string;
  loadMoreErrorLabel: string;
  initialErrorTitle: string;
  initialErrorDescription: string;
  retryLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  endOfResultsLabel: string;
}

// English-only, same pattern and reasoning as guides/pageContent.ts — no
// /hi/blog route exists (see App.tsx).
export const blogIndexContent: BlogIndexContent = {
  breadcrumbLabel: 'Blog',
  eyebrow: 'Engineering Notes',
  title: 'Explore. Learn.',
  titleAccent: 'Build Better.',
  description: 'A live feed of open-source engineering writing, pulled from dev.to. Click through to read the full post at its original source.',
  readTimeSuffix: 'min read',
  sourcePrefix: 'via',
  loadingLabel: 'Loading more posts…',
  loadMoreErrorLabel: 'Couldn’t load more posts.',
  initialErrorTitle: 'Couldn’t load the feed',
  initialErrorDescription: 'Something went wrong reaching the post source. Check your connection and try again.',
  retryLabel: 'Retry',
  emptyTitle: 'No posts right now',
  emptyDescription: 'The feed came back empty. Check back again soon.',
  endOfResultsLabel: 'You’re all caught up — that’s everything for now.',
};
