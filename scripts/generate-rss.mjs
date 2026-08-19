// Generates dist/rss.xml from the same live dev.to feed the /blog page
// renders client-side (src/lib/engineeringPosts.ts) — single source of
// truth, so this script has no post data of its own to drift out of sync.
// Each item links straight to its external source, matching how the /blog
// cards behave. Run after the main build, in postbuild alongside
// prerender.mjs.
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SITE_ORIGIN = 'https://101techlabs.com';
const FEED_ITEM_COUNT = 30;

const { fetchEngineeringPosts, POSTS_PER_PAGE } = await import(path.join(ROOT, 'src/lib/engineeringPosts.ts'));

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Best-effort: a dev.to outage or offline build environment shouldn't fail
// the whole postbuild pipeline over a feed file. Falls back to an empty
// (still valid) RSS document, refreshed on the next successful deploy.
const posts = [];
try {
  for (let page = 1; posts.length < FEED_ITEM_COUNT; page += 1) {
    const fetched = await fetchEngineeringPosts(page);
    posts.push(...fetched);
    if (fetched.length < POSTS_PER_PAGE) break;
  }
} catch (err) {
  console.warn(`[generate-rss] Failed to fetch posts, writing an empty feed: ${err.message}`);
}

const items = posts
  .slice(0, FEED_ITEM_COUNT)
  .map(
    (post) => `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${escapeXml(post.url)}</link>
    <guid isPermaLink="true">${escapeXml(post.url)}</guid>
    <description>${escapeXml(post.description)}</description>
    <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
  </item>`,
  )
  .join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>101 Tech Labs — Engineering Notes</title>
  <link>${SITE_ORIGIN}/blog</link>
  <description>A curated feed of open-source engineering writing.</description>
  <language>en</language>
${items}
</channel>
</rss>
`;

await writeFile(path.join(ROOT, 'dist/rss.xml'), rss);
console.log(`rss.xml generated with ${posts.length} post(s).`);
