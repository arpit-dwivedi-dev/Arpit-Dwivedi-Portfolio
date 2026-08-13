// Generates dist/rss.xml from the blog's own data file — single source of
// truth, so a new post can't ship without the feed picking it up (the same
// class of bug the QR Code Generator hit with sitemap.xml: a manually
// maintained duplicate of data that already exists elsewhere drifting out
// of sync). Run after the main build, in postbuild alongside prerender.mjs.
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SITE_ORIGIN = 'https://101techlabs.com';

const { BLOG_POSTS } = await import(path.join(ROOT, 'src/content/blog/data.ts'));

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const items = [...BLOG_POSTS]
  .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
  .map(
    (post) => `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${SITE_ORIGIN}/blog/${post.slug}</link>
    <guid isPermaLink="true">${SITE_ORIGIN}/blog/${post.slug}</guid>
    <description>${escapeXml(post.description)}</description>
    <pubDate>${new Date(post.publishedDate).toUTCString()}</pubDate>
  </item>`,
  )
  .join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>101 Tech Labs — Engineering Notes</title>
  <link>${SITE_ORIGIN}/blog</link>
  <description>Real technical writing on the decisions behind full-stack applications.</description>
  <language>en</language>
${items}
</channel>
</rss>
`;

await writeFile(path.join(ROOT, 'dist/rss.xml'), rss);
console.log(`rss.xml generated with ${BLOG_POSTS.length} post(s).`);
