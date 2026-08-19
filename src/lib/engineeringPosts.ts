import type { EngineeringPost } from '../content/blog/types';

// dev.to's public Articles API — no key required, CORS-enabled for GET, and
// the "opensource" tag is a direct match for "open-source engineering
// posts" rather than a curated/hardcoded feed. See
// https://developers.forem.com/api/v1#tag/articles.
const DEVTO_ARTICLES_URL = 'https://dev.to/api/articles';
const TAG = 'opensource';
export const POSTS_PER_PAGE = 15;

interface DevToArticle {
  id: number;
  title: string;
  description: string | null;
  url: string;
  cover_image: string | null;
  social_image: string | null;
  published_at: string;
  reading_time_minutes: number | null;
  tag_list: string[];
  user: { name: string } | null;
}

const normalize = (article: DevToArticle): EngineeringPost => ({
  id: `devto-${article.id}`,
  title: article.title,
  description: article.description ?? '',
  url: article.url,
  imageUrl: article.cover_image || article.social_image || null,
  source: 'dev.to',
  author: article.user?.name ?? 'dev.to',
  publishedAt: article.published_at,
  readTimeMinutes: article.reading_time_minutes ?? null,
  tags: article.tag_list ?? [],
});

/** Throws on network failure or a non-2xx response — callers own the error UI. */
export const fetchEngineeringPosts = async (page: number, signal?: AbortSignal): Promise<EngineeringPost[]> => {
  const url = `${DEVTO_ARTICLES_URL}?tag=${TAG}&page=${page}&per_page=${POSTS_PER_PAGE}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`dev.to API returned ${res.status}`);
  }
  const articles: DevToArticle[] = await res.json();
  return articles.filter((article) => article.title && article.url).map(normalize);
};
