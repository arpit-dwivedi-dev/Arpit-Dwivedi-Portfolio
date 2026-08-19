// A post pulled live from an external open-source/engineering content
// source (currently dev.to — see src/lib/engineeringPosts.ts) and rendered
// as a link-out card. There's no local body/detail content: `url` is the
// canonical article, and that's where the card sends the reader.
export interface EngineeringPost {
  /** Stable across pages/re-fetches — used for dedup, not just React keys. */
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  source: string;
  author: string;
  publishedAt: string;
  readTimeMinutes: number | null;
  tags: string[];
}
