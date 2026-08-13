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
      columns: ['HS256 (symmetric)', 'RS256 (asymmetric)'],
      rows: [
        { label: 'Who holds the signing secret', values: ['Every service that verifies a token', 'Only the issuing service'] },
        { label: 'Can a verifier forge a token?', values: ['Yes — same secret works both ways', 'No — public key only verifies'] },
        { label: 'Key rotation', values: ['Requires a synchronized redeploy of every holder', 'Publish a new public key; old tokens expire naturally'] },
        { label: 'Setup complexity', values: ['Lower — one shared secret', 'Higher — keypair, JWKS endpoint, rotation policy'] },
        { label: 'Best fit', values: ['Single service, self-issued and self-verified tokens', 'Multiple services or tenants verifying tokens they didn’t issue'] },
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
    relatedSlugs: ['backend-identity-glossary', 'in-house-vs-outsourced-backend-engineering'],
  },
  {
    slug: 'backend-identity-glossary',
    title: 'A Backend & Identity Glossary: JWT, JWKS, Multi-Tenancy, and More',
    description:
      'Plain definitions for the terms that come up most when talking about authentication and multi-tenant backend architecture — not a complete course, a working reference.',
    category: 'Backend & Identity',
    readTimeMinutes: 5,
    publishedDate: '2026-08-12',
    updatedDate: '2026-08-12',
    intro: [
      'These terms come up constantly in backend and identity work, and get thrown around loosely enough that it’s worth having plain definitions in one place. This isn’t a complete course — it’s a working reference, and a few of these get their own dedicated post when the topic earns it.',
    ],
    sections: [
      {
        heading: 'JWT (JSON Web Token)',
        paragraphs: [
          'A compact, signed piece of data — usually containing a user ID and some claims about them — that a client presents to prove who it is, without the server needing to look up a session on every request. The signature is what makes it trustworthy: anyone can read a JWT’s contents, but only the holder of the signing key can produce a valid one.',
        ],
      },
      {
        heading: 'Multi-tenancy',
        paragraphs: [
          'An architecture where a single application instance serves multiple separate customers (“tenants”), with each tenant’s data kept isolated from the others. The isolation can happen at different levels — separate databases, separate schemas, or row-level filtering in a shared database — and which one you pick has real consequences for security and cost.',
        ],
      },
      {
        heading: 'JWKS (JSON Web Key Set)',
        paragraphs: [
          'A JSON document, served at a public URL, listing the public keys a service uses to verify signatures — most commonly for RS256-signed JWTs (see the RS256 vs HS256 post). Any service that needs to verify a token fetches this endpoint instead of being handed the key directly, which is what makes key rotation possible without a coordinated redeploy.',
        ],
      },
      {
        heading: 'Session vs. token authentication',
        paragraphs: [
          'Session auth keeps a record of who’s logged in on the server (usually in a database or an in-memory store) and gives the client an opaque ID that points to it. Token auth (like JWT) puts the actual claims in the token itself, so the server can verify it without a lookup. Sessions are easier to revoke instantly; tokens scale better across multiple services without a shared session store.',
        ],
      },
      {
        heading: 'argon2id',
        paragraphs: [
          'A password-hashing algorithm, and the current recommended default for storing passwords. It’s deliberately slow and memory-hungry, which is the point — it makes brute-forcing stolen password hashes expensive. Covered in full, alongside bcrypt and scrypt, in its own post.',
        ],
      },
      {
        heading: 'Authentication vs. authorization',
        paragraphs: [
          'Authentication answers “who is this?” — logging in, verifying identity. Authorization answers “what are they allowed to do?” — permissions, roles, access control. A system can authenticate someone correctly and still get authorization wrong, and vice versa; they’re solved by different code paths even though they’re often discussed together.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is this everything worth knowing about backend authentication?',
        answer:
          'No — this is a working glossary of terms that come up often, not a complete course. See the RS256 vs HS256 and argon2id posts for two topics covered in full depth.',
      },
      {
        question: 'Why does any of this matter for a small project?',
        answer:
          'It often doesn’t, until the project isn’t small anymore — a second service, a second customer with real data at stake, or a security review changes the calculus fast. Knowing the vocabulary early makes it possible to make the call deliberately instead of by default.',
      },
    ],
    relatedSlugs: ['rs256-vs-hs256-jwt-multi-tenant', 'argon2id-vs-bcrypt-vs-scrypt'],
  },
  {
    slug: 'argon2id-vs-bcrypt-vs-scrypt',
    title: 'argon2id vs bcrypt vs scrypt: Choosing a Password Hashing Algorithm',
    description:
      'Three real options for hashing passwords, what actually separates them, and why argon2id is the current default recommendation — not a trend, a specific set of tradeoffs.',
    category: 'Backend & Identity',
    readTimeMinutes: 7,
    publishedDate: '2026-08-12',
    updatedDate: '2026-08-12',
    intro: [
      'Storing a password wrong is one of the few backend mistakes that’s still catastrophic when everything else goes right. Hashing algorithm choice is a small decision with an outsized blast radius if it’s wrong, and “just use bcrypt” — while not bad advice — isn’t the whole story anymore.',
      'bcrypt, scrypt, and argon2id all solve the same problem (make a stolen password hash expensive to crack) with different assumptions about what an attacker has access to.',
    ],
    sections: [
      {
        heading: 'What makes a hashing algorithm “password-safe”',
        paragraphs: [
          'A general-purpose hash like SHA-256 is fast — that’s the whole point of a hash function normally, and it’s exactly the wrong property for passwords. Fast hashing means an attacker with a stolen hash database can try billions of guesses a second on cheap hardware. Password-hashing algorithms are deliberately slow, and — for the newer ones — deliberately memory-hungry, because memory is harder to parallelize cheaply than raw computation.',
        ],
      },
      {
        heading: 'bcrypt',
        paragraphs: [
          'The oldest of the three still in common use, and still a reasonable choice. It’s CPU-hard but not memory-hard, which means an attacker with specialized hardware (GPUs, and especially ASICs) can parallelize cracking attempts more cheaply than its 1990s designers anticipated. It also has a hard 72-byte input limit that trips people up if they don’t know it’s there.',
        ],
      },
      {
        heading: 'scrypt',
        paragraphs: [
          'Designed specifically to be memory-hard as well as CPU-hard, making GPU/ASIC parallelization meaningfully more expensive than against bcrypt. It’s a real improvement on that front, but it has more tunable parameters to get right (CPU cost, memory cost, parallelization), and getting them wrong is easier to do silently than with bcrypt’s simpler single work-factor.',
        ],
      },
      {
        heading: 'argon2id',
        paragraphs: [
          'The winner of the 2015 Password Hashing Competition, and the current default recommendation. It combines resistance to GPU-cracking (via memory-hardness, like scrypt) with resistance to side-channel and tradeoff attacks (via the “id” hybrid mode, which mixes the data-independent memory access of argon2i with the faster data-dependent access of argon2d). For a new project with no legacy constraint, it’s the default that needs the least second-guessing.',
        ],
      },
      {
        heading: 'When bcrypt or scrypt is still the right call',
        paragraphs: [
          'Working inside an existing system that already uses bcrypt correctly, with no compromise indicators, isn’t a strong enough reason on its own to force a re-hash migration — password hashes typically only get rehashed the next time a user logs in anyway, so a switch is usually gradual, not a hard cutover. scrypt earns its place in systems where key derivation more broadly (not just password storage) is the goal, since it was designed for that dual purpose from the start.',
        ],
      },
    ],
    comparisonTable: {
      columns: ['bcrypt', 'scrypt', 'argon2id'],
      rows: [
        { label: 'Memory-hard', values: ['No', 'Yes', 'Yes'] },
        { label: 'Resists GPU/ASIC parallelization', values: ['Weakest of the three', 'Strong', 'Strong'] },
        { label: 'Tunable parameters', values: ['One work factor — simple', 'Several — easy to misconfigure', 'Several, but sane defaults are common in libraries'] },
        { label: 'Track record', values: ['Longest in production use', 'Long, less common for passwords specifically', 'Newest, current default recommendation'] },
        { label: 'Known limitation', values: ['72-byte input cap', 'More configuration risk', 'Slightly less battle-tested at scale than bcrypt'] },
      ],
    },
    faq: [
      {
        question: 'Is bcrypt insecure now?',
        answer:
          'No — bcrypt hasn’t been broken, and it’s still a reasonable choice, especially inside an existing system already using it correctly. The case for argon2id is about resisting a more capable attacker more comfortably, not about bcrypt being unsafe today.',
      },
      {
        question: 'Do I need to pick memory-hard parameters myself?',
        answer:
          'Most argon2id libraries ship a sane default profile — start there rather than hand-tuning, unless a specific resource constraint or threat model gives a real reason to deviate. Guessing at parameters is worse than using an unremarkable default.',
      },
      {
        question: 'What about SHA-256 with a salt — isn’t that enough?',
        answer:
          'No. A salt stops precomputed rainbow-table attacks, but SHA-256 is still fast, so a targeted brute-force against one stolen hash is still cheap. Salting and slow hashing solve different problems — you need both properties, and general-purpose hashes only give you the first.',
      },
    ],
    relatedSlugs: ['rs256-vs-hs256-jwt-multi-tenant', 'backend-identity-glossary'],
  },
  {
    slug: 'in-house-vs-outsourced-backend-engineering',
    title: 'In-House vs. Outsourced Backend Engineering: What Actually Changes',
    description:
      'The tradeoff isn’t cost vs. quality — it’s who owns the decisions that are expensive to unwind later. What actually changes when backend work is subcontracted instead of owned.',
    category: 'Backend & Identity',
    readTimeMinutes: 6,
    publishedDate: '2026-08-12',
    updatedDate: '2026-08-12',
    intro: [
      'Most agencies build the frontend in-house and quietly subcontract or template the backend — auth, data modeling, the account layer — because that’s the part that doesn’t show up in a portfolio screenshot. It’s a reasonable business decision for them. It’s a real tradeoff for whoever’s hiring them.',
      'This isn’t an argument that outsourcing backend work is always wrong. It’s an honest look at what actually changes when it happens, so the decision gets made on purpose instead of by default.',
    ],
    sections: [
      {
        heading: '“The backend” usually means the parts that need the most judgment',
        paragraphs: [
          'In practice, subcontracting rarely means the whole backend — more often it’s the specific pieces that require the most context about the actual product: authentication and identity, data modeling, and the architecture decisions (like the ones covered in the RS256 vs HS256 post) that are cheap to get right early and expensive to unwind later.',
          'The parts that stay in-house tend to be the ones that are easiest to specify in a scope document — CRUD endpoints, UI-facing API routes — because they’re easier to review without deep context.',
        ],
      },
      {
        heading: 'The cost that doesn’t show up in the quote',
        paragraphs: [
          'A subcontracted backend piece usually comes back working. What’s harder to evaluate from outside is whether the decisions inside it — how sessions are handled, how tenants are isolated, how a schema will hold up once the product changes shape — were made with real context about where the product is going, or made generically because that’s what ships fastest for an unfamiliar client.',
          'The bill for a wrong call here doesn’t show up at delivery. It shows up eighteen months later, as a migration that has to happen under pressure instead of by choice.',
        ],
      },
      {
        heading: 'When outsourcing the backend is genuinely fine',
        paragraphs: [
          'A short-lived MVP meant to validate demand, not survive contact with real users. A well-scoped, narrow integration where the interface is the whole spec. A team that already has strong in-house backend judgment and is subcontracting execution capacity, not the decisions themselves — the client still owns the architecture calls, just not the typing.',
        ],
      },
      {
        heading: 'What changes when it’s owned in-house instead',
        paragraphs: [
          'The person making the call on auth architecture, data modeling, and API design is the same person who understands the product’s actual trajectory — not working from a scope document written before some of those decisions were even knowable. That doesn’t guarantee better decisions. It removes one layer of translation loss between what the product needs and what gets built.',
        ],
      },
    ],
    faq: [
      {
        question: 'Isn’t in-house always more expensive?',
        answer:
          'Not necessarily, and it’s the wrong first question. The real comparison is total cost including the cost of unwinding a wrong early decision later — genuinely hard to price upfront, and easy to underestimate.',
      },
      {
        question: 'How do I tell if an agency actually owns backend decisions or subcontracts them?',
        answer:
          'Ask directly, and ask who specifically will make the call on authentication and data modeling — a named person, not a department. A vague answer is itself an answer.',
      },
      {
        question: 'Does this apply to small projects too?',
        answer:
          'Less urgently — a five-page website with no accounts or user data doesn’t have much of a “backend” to worry about. This matters once there’s a login, a database with more than one kind of user, or a second service that needs to trust the first one.',
      },
    ],
    relatedSlugs: ['rs256-vs-hs256-jwt-multi-tenant'],
  },
];

export const getBlogPostBySlug = (slug: string): BlogPost | undefined => BLOG_POSTS.find((post) => post.slug === slug);

export const getRelatedBlogPosts = (post: BlogPost, limit = 3): BlogPost[] =>
  post.relatedSlugs
    .map((slug) => getBlogPostBySlug(slug))
    .filter((candidate): candidate is BlogPost => Boolean(candidate))
    .slice(0, limit);
