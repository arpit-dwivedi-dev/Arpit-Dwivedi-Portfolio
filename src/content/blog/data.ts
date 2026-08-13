import type { BlogPost } from './types';

// Original technical writing — not sourced or adapted from any other blog
// or vendor doc. Broader-than-invoicing topics live here (see
// content-rewrite project notes on why /blog is separate from /guides).
// This first post closes part of the proof gap positioning.md flags: the
// stated backend/identity differentiator had no public writing behind it.
// It's a real technical explainer, not a case study — there's no client
// project to write about yet, and inventing one would violate the
// no-fabrication rule. Teaching the actual tradeoff correctly is the
// honest way to demonstrate the judgment until real project proof exists.
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'rs256-vs-hs256-jwt-multi-tenant',
    title: 'RS256 vs HS256: Choosing a JWT Signing Algorithm for Multi-Tenant Systems',
    description:
      'HS256 and RS256 solve the same problem differently — one shares a secret, one doesn’t. Here’s why that distinction matters more once more than one service needs to verify a token.',
    category: 'Backend & Identity',
    readTimeMinutes: 6,
    publishedDate: '2026-08-12',
    updatedDate: '2026-08-12',
    intro: [
      'Most JWT tutorials pick HS256 by default and move on — it’s one line of config, and for a single service talking to itself, it works fine. The choice starts to matter the moment a second service needs to verify a token it didn’t issue.',
      'This is a genuinely common fork in the road, not a security-theater detail: which algorithm you pick determines who has to hold your signing secret, and how much damage a single compromised service can do.',
    ],
    sections: [
      {
        heading: 'How HS256 works',
        paragraphs: [
          'HS256 (HMAC with SHA-256) is symmetric: the same secret both signs a new token and verifies an existing one. Whatever service issues tokens, and whatever service checks them, needs a copy of that exact secret.',
          'For a single monolith or a single API validating its own tokens, that’s not a problem — there’s only one place the secret needs to live. It’s fast, it’s simple, and it’s the default in most JWT libraries for exactly that reason.',
        ],
      },
      {
        heading: 'How RS256 works',
        paragraphs: [
          'RS256 (RSA with SHA-256) is asymmetric: a private key signs the token, and a separate public key verifies it. The private key stays with whatever issues tokens — an auth service, typically. Everything else only ever needs the public key.',
          'A public key can’t be used to forge a token, only to check one. That one property changes who you have to trust with what.',
        ],
      },
      {
        heading: 'Why multi-tenant and multi-service systems lean toward RS256',
        paragraphs: [
          'Once more than one service needs to verify tokens — a billing service, a reporting service, a partner-facing API — HS256 means distributing the actual signing secret to every one of them. Every service that can verify a token can also mint one, whether or not that’s the intent.',
          'RS256 breaks that coupling. The auth service keeps the private key; every consumer gets the public key, which is safe to publish (that’s exactly what a JWKS endpoint is for). A compromised reporting service leaks a public key, not the ability to impersonate any user in the system.',
          'In a multi-tenant system specifically, that isolation compounds: rotating a compromised secret under HS256 means redeploying every service that held it, in lockstep, before the old tokens fully expire. Rotating an RSA keypair under RS256 means publishing a new public key and letting verifiers pick it up — no synchronized redeploy required.',
        ],
      },
      {
        heading: 'When HS256 is still the right call',
        paragraphs: [
          'None of this makes HS256 wrong. A single service issuing and validating its own short-lived tokens, with no other service ever in the verification path, doesn’t gain much from the added complexity of key management — and RS256 does add complexity: key generation, rotation policy, a JWKS endpoint to serve the public key.',
          'The honest rule of thumb: pick HS256 when there’s exactly one verifier and it’s the same service that issued the token. Pick RS256 as soon as that stops being true.',
        ],
      },
      {
        heading: 'Where this fits',
        paragraphs: [
          'This is the kind of decision that’s easy to skip when a project is moving fast — HS256 works, ship it — and expensive to unwind once three more services depend on the old assumption. Treating identity and token verification as a first-class piece of the architecture, not an afterthought bolted on once auth becomes a problem, is part of how backend work gets approached here.',
        ],
      },
    ],
    comparisonTable: {
      columnA: 'HS256 (symmetric)',
      columnB: 'RS256 (asymmetric)',
      rows: [
        { label: 'Who holds the signing secret', a: 'Every service that verifies a token', b: 'Only the issuing service' },
        { label: 'Can a verifier forge a token?', a: 'Yes — same secret works both ways', b: 'No — public key only verifies' },
        { label: 'Key rotation', a: 'Requires a synchronized redeploy of every holder', b: 'Publish a new public key; old tokens expire naturally' },
        { label: 'Setup complexity', a: 'Lower — one shared secret', b: 'Higher — keypair, JWKS endpoint, rotation policy' },
        { label: 'Best fit', a: 'Single service, self-issued and self-verified tokens', b: 'Multiple services or tenants verifying tokens they didn’t issue' },
      ],
    },
    faq: [
      {
        question: 'Is RS256 always more secure than HS256?',
        answer:
          'Not automatically — a leaked HS256 secret and a leaked RS256 private key are both game over. The difference is exposure: RS256 keeps the thing that must stay secret in one place, so there are fewer places it can leak from.',
      },
      {
        question: 'Does RS256 cost meaningfully more in performance?',
        answer:
          'RSA signature verification is slower than HMAC, but verification (not signing) is the operation that happens on every request — and for typical token sizes and traffic, the difference is rarely the bottleneck in practice. It’s worth benchmarking your own case rather than assuming either way.',
      },
      {
        question: 'Can a system switch from HS256 to RS256 later without downtime?',
        answer:
          'Yes, with a transition period: issue new tokens with RS256 while still accepting HS256-signed tokens until the old ones expire, then drop HS256 verification once nothing old is left in circulation. It’s a migration, not a flag flip, so plan the token lifetime into the timeline.',
      },
    ],
    relatedSlugs: [],
  },
];

export const getBlogPostBySlug = (slug: string): BlogPost | undefined => BLOG_POSTS.find((post) => post.slug === slug);

export const getRelatedBlogPosts = (post: BlogPost, limit = 3): BlogPost[] =>
  post.relatedSlugs
    .map((slug) => getBlogPostBySlug(slug))
    .filter((candidate): candidate is BlogPost => Boolean(candidate))
    .slice(0, limit);
