import type { Guide } from './types';
import { createApiExample } from '../../tools/apiRequestBuilder/example';
import { generateCurlCommand } from '../../tools/apiRequestBuilder/curlGenerator';
import { generateFetchCode } from '../../tools/apiRequestBuilder/codeGenerators/fetch';
import { generatePythonCode } from '../../tools/apiRequestBuilder/codeGenerators/python';
import { generateAxiosCode } from '../../tools/apiRequestBuilder/codeGenerators/axios';
import { generateNodeCode } from '../../tools/apiRequestBuilder/codeGenerators/node';

// The live example embedded in the JSON POST request guide (see PART 5 of the
// content brief) — built once, from the same createApiExample() every other
// interactive example uses, and shared by both the ApiExampleCard and the
// generated-code sections below so the request, the "Open in API Request
// Builder" link, and the cURL/fetch/Python snippets can never drift out of
// sync with each other.
const JSON_POST_EXAMPLE = createApiExample({
  title: 'Send a JSON POST request',
  description: 'A POST request with a JSON body, sent to httpbin.org’s test endpoint — safe to open and actually send.',
  method: 'POST',
  url: 'https://httpbin.org/anything',
  headers: [{ key: 'Content-Type', value: 'application/json' }],
  json: { name: 'John Doe', email: 'john@example.com' },
});

// GuideSection has no code-block field (see ApiExampleCard.tsx and the DBML
// guide below) — literal code lines as `bullets` is the established fallback.
// Blank lines are dropped only because a bulleted list can't represent
// spacing anyway; every remaining line is the generator's real output,
// unedited, so these snippets can never disagree with what the tool itself
// produces from the "Copy as code" panel.
const codeLines = (code: string): string[] => code.split('\n').filter((line) => line.trim().length > 0);

const JSON_POST_CURL = codeLines(generateCurlCommand(JSON_POST_EXAMPLE.request));
const JSON_POST_FETCH = codeLines(generateFetchCode(JSON_POST_EXAMPLE.request));
const JSON_POST_PYTHON = codeLines(generatePythonCode(JSON_POST_EXAMPLE.request));

// The three interactive examples for the authentication guide. Token/key values are
// deliberately `{{template}}` placeholders rather than literal secrets — both because a
// public guide can never contain a real credential, and because sanitizeForShare (see
// shareRequest.ts) only carries a templated auth value through the "Open in API Request
// Builder" link; a literal one gets stripped before the link is even built. The Basic Auth
// example is the one exception: httpbin.org's sandbox endpoint requires the literal
// username/password "demo", so its password does NOT survive that same link (see the
// guide's own security section, which explains this rather than glossing over it).
const AUTH_BEARER_EXAMPLE = createApiExample({
  title: 'Send a request with a Bearer token',
  description: 'A GET request with a templated Bearer token — safe to open and send, since {{token}} is left unresolved rather than a real credential.',
  method: 'GET',
  url: 'https://httpbin.org/anything',
  auth: { type: 'bearer', bearerToken: '{{token}}' },
});

const AUTH_API_KEY_EXAMPLE = createApiExample({
  title: 'Send a request with an API key',
  description: 'A GET request with a templated API key sent as a header — safe to open and send.',
  method: 'GET',
  url: 'https://httpbin.org/anything',
  auth: { type: 'api-key', apiKeyName: 'X-Api-Key', apiKeyValue: '{{apiKey}}', apiKeyLocation: 'header' },
});

const AUTH_BASIC_EXAMPLE = createApiExample({
  title: 'Send a request with Basic Auth',
  description: 'A GET request to httpbin.org’s Basic Auth sandbox endpoint, which only accepts the public demo/demo username and password.',
  method: 'GET',
  url: 'https://httpbin.org/basic-auth/demo/demo',
  auth: { type: 'basic', basicUsername: 'demo', basicPassword: 'demo' },
});

// The two interactive examples for the form-data / file-upload guide. Both use the
// tool's existing 'multipart' body mode and carry no Content-Type header on purpose —
// resolveRequest deliberately leaves it off so the browser can generate the boundary
// itself, which is the guide's central teaching point.
//
// The file field is expressed the only way a public, static example safely can: a row
// flagged `isFile` with no filename and no path. It opens in the tool as an empty
// "Choose file…" picker (see FormFieldsEditor) that the reader attaches their own local
// file to — a real `File` can never be serialized into a share URL (sanitizeForShare
// drops it), so inventing a filename here would only render a row that looks attached
// but would silently send an empty text field instead.
const FORM_DATA_TEXT_EXAMPLE = createApiExample({
  title: 'Send a multipart form with text fields',
  description: 'A POST with two text form fields sent as multipart/form-data to httpbin.org’s test endpoint — safe to open and actually send.',
  method: 'POST',
  url: 'https://httpbin.org/anything',
  body: {
    mode: 'multipart',
    formFields: [
      { key: 'name', value: 'John Doe' },
      { key: 'email', value: 'john@example.com' },
    ],
  },
});

const FORM_DATA_FILE_EXAMPLE = createApiExample({
  title: 'Send a multipart form with a file',
  description: 'A POST with one text field and one file field. The file field opens empty — choose a local file yourself before sending, since a file can’t travel inside a link.',
  method: 'POST',
  url: 'https://httpbin.org/anything',
  body: {
    mode: 'multipart',
    formFields: [
      { key: 'name', value: 'profile' },
      { key: 'file', value: '', isFile: true },
    ],
  },
});

// Generated from the text-only example rather than the file one: a File field has no
// faithful representation in a copied snippet (curl would emit `-F 'file=@'` with
// nothing after the @), so the file line is shown as a single hand-written line in the
// guide instead of a misleading generated command.
const FORM_DATA_CURL = codeLines(generateCurlCommand(FORM_DATA_TEXT_EXAMPLE.request));
const FORM_DATA_FETCH = codeLines(generateFetchCode(FORM_DATA_TEXT_EXAMPLE.request));

// The single example the cURL-conversion guide is built around. Every code block in
// that guide — the original cURL command included — is generated from this one request
// by the tool's own generators, so the article can never document a conversion the
// tool wouldn't actually produce.
const CURL_CONVERT_EXAMPLE = createApiExample({
  title: 'The cURL command, as a request',
  description:
    'A POST with a JSON body and two headers, sent to httpbin.org’s test endpoint — the same request every cURL, Fetch, Axios, Node, and Python snippet on this page was generated from.',
  method: 'POST',
  url: 'https://httpbin.org/anything',
  headers: [
    { key: 'Content-Type', value: 'application/json' },
    { key: 'X-Client-Version', value: 'demo' },
  ],
  json: { name: 'John Doe', email: 'john@example.com' },
});

const CURL_CONVERT_CURL = codeLines(generateCurlCommand(CURL_CONVERT_EXAMPLE.request));
const CURL_CONVERT_FETCH = codeLines(generateFetchCode(CURL_CONVERT_EXAMPLE.request));
const CURL_CONVERT_AXIOS = codeLines(generateAxiosCode(CURL_CONVERT_EXAMPLE.request));
const CURL_CONVERT_NODE = codeLines(generateNodeCode(CURL_CONVERT_EXAMPLE.request));
const CURL_CONVERT_PYTHON = codeLines(generatePythonCode(CURL_CONVERT_EXAMPLE.request));

const AUTH_BEARER_CURL = codeLines(generateCurlCommand(AUTH_BEARER_EXAMPLE.request));
const AUTH_BEARER_FETCH = codeLines(generateFetchCode(AUTH_BEARER_EXAMPLE.request));
const AUTH_BEARER_PYTHON = codeLines(generatePythonCode(AUTH_BEARER_EXAMPLE.request));
const AUTH_BASIC_CURL = codeLines(generateCurlCommand(AUTH_BASIC_EXAMPLE.request));

// Original guides written in-house — not sourced or adapted from any
// competitor's help center or blog. Topics overlap with what any invoicing
// tool's documentation would cover (numbering, terms, late fees) because
// those are generic small-business practices, not anyone's proprietary
// content. Kept intentionally free of jurisdiction-specific legal claims
// (interest-rate caps, statute references) since those vary by country/state
// and go stale — guides point readers to check local law instead of stating
// numbers as universal fact.
export const GUIDES: Guide[] = [
  {
    slug: 'how-to-make-an-invoice',
    title: 'How to Make an Invoice: A Step-by-Step Guide',
    description:
      'What every invoice needs, how to format one, and how to send it so you get paid on time — with a plain checklist you can reuse for every client.',
    category: 'invoicing',
    readTimeMinutes: 8,
    publishedDate: '2026-08-05',
    updatedDate: '2026-08-05',
    intro: [
      'An invoice is a request for payment — but a badly made one is also the single most common reason payment gets delayed. Clients don’t pay late out of malice nearly as often as they pay late because the invoice was confusing, missing a detail their accounts team needed, or buried in an email thread with no clear amount or due date.',
      'None of that requires an accounting degree to fix. This guide walks through what to include, how to structure it, and how to send it so the invoice does its job on the first try.',
    ],
    sections: [
      {
        heading: 'What every invoice needs',
        paragraphs: [
          'Every invoice, regardless of industry or format, needs the same core information. Miss one of these and you’ll usually hear back with a question instead of a payment.',
        ],
        bullets: [
          'Your business name, address, and contact details',
          'The client’s name and billing address',
          'A unique invoice number',
          'The issue date and the payment due date',
          'An itemized list of what’s being billed — description, quantity, and rate for each line',
          'Subtotal, any tax, and the total amount due',
          'How you accept payment (bank transfer, card, UPI, cheque, etc.)',
        ],
      },
      {
        heading: 'Choosing a format',
        paragraphs: [
          'For most freelancers and small businesses, a browser-based invoice generator or a simple spreadsheet template is enough — you fill in the fields, it calculates totals, and you export a PDF. There’s no reason to adopt full accounting software just to send invoices, unless you’re already tracking books there.',
          'The exception is volume: once you’re issuing dozens of invoices a month, or need to track who’s paid and who hasn’t across many clients, a tool that keeps history and totals for you starts saving real time over rebuilding each invoice from scratch.',
        ],
      },
      {
        heading: 'Writing clear line items',
        paragraphs: [
          'A line item should tell the client what they’re paying for without needing to ask you. "Website work — 12 hours" invites a follow-up question; "Homepage redesign: layout, copy integration, mobile responsiveness (12 hrs @ $75/hr)" doesn’t.',
          'If a project had multiple phases or deliverables, break them into separate lines rather than one lump sum. It makes the invoice easier to approve internally on the client’s side, especially if someone other than your main contact has to sign off on it.',
        ],
      },
      {
        heading: 'Setting payment terms and due dates',
        paragraphs: [
          'Every invoice needs an explicit due date, not just a payment term like "Net 30" written somewhere — spell out the actual date. Clients are far more likely to miss a relative term than a concrete calendar date sitting next to the total.',
          'Decide your terms before the project starts, not when you send the first invoice. Put them in the contract or proposal so the invoice is just confirming something the client already agreed to, not introducing a new condition after the work is done.',
        ],
      },
      {
        heading: 'Sending and following up',
        paragraphs: [
          'Send the invoice as soon as the work (or the billing milestone) is complete — not at the end of the month "to batch things." Every day between finishing the work and sending the invoice is a day added to how long you’ll wait to get paid.',
          'Confirm receipt if you can, and plan a reminder a few days before the due date rather than only after it’s passed. A short, friendly nudge before the deadline prevents far more late payments than a firm email after it.',
        ],
      },
    ],
    faq: [
      {
        question: 'Do I need a registered business to send an invoice?',
        answer:
          'In most places, no — freelancers and sole proprietors can invoice under their own name using their personal or trading details. Requirements vary by country and by how you’re taxed, so check your local rules if you’re unsure, but a formal company registration usually isn’t a prerequisite for issuing an invoice.',
      },
      {
        question: 'What’s the difference between an invoice and a receipt?',
        answer:
          'An invoice requests payment for goods or services already provided or agreed to; a receipt confirms that payment has already been made. They’re often confused because both list similar details, but an invoice comes before payment and a receipt comes after it.',
      },
      {
        question: 'Can I invoice without a company name?',
        answer:
          'Yes — many freelancers invoice under their own personal name and address. What matters more than having a formal company name is that the client can clearly identify who they’re paying and how to contact you.',
      },
      {
        question: 'How soon after finishing work should I send the invoice?',
        answer:
          'Immediately, or within a day or two at most. Delaying invoicing doesn’t just delay payment on your end — it also means the work is less fresh in the client’s mind if a question comes up during their approval process.',
      },
    ],
    relatedSlugs: ['invoice-number-guide', 'invoice-payment-terms', 'quote-vs-invoice'],
  },
  {
    slug: 'invoice-payment-terms',
    title: 'Invoice Payment Terms Explained: Net 30, Net 15, and Due on Receipt',
    description:
      'What Net 30, Net 15, and Due on Receipt actually mean, how to pick the right terms for a client, and how to write them so there’s no ambiguity about when you get paid.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-05',
    updatedDate: '2026-08-05',
    intro: [
      'Payment terms are the single line on an invoice most likely to be misread — and the most likely to be blamed when payment is "late" but technically wasn’t. Getting them right is less about legal wording and more about picking terms your client will actually understand and meet.',
    ],
    sections: [
      {
        heading: 'What payment terms actually mean',
        paragraphs: [
          'A payment term states how long the client has to pay, counted from a fixed point — usually the invoice date. "Net 30" means payment is due 30 days after the invoice was issued, not 30 days after the client "gets around to it" or 30 days after the work finished.',
          'The ambiguity almost always comes from that starting point. If the invoice date and the completion date are different (common on longer projects), spell out which one the countdown starts from.',
        ],
      },
      {
        heading: 'Common payment terms, compared',
        paragraphs: ['A handful of terms cover most invoicing situations:'],
        bullets: [
          'Due on Receipt — payment is expected as soon as the invoice arrives. Common for small jobs, one-off work, or new clients without an established payment history.',
          'Net 15 / Net 30 / Net 60 — payment is due 15, 30, or 60 days after the invoice date. Net 30 is the most common default in B2B work; Net 60 is more typical for larger enterprise clients with slower internal approval processes.',
          'End of Month (EOM) — payment is due by the end of the calendar month the invoice was issued in, regardless of the exact issue date.',
          'Early-payment discount terms (e.g. "2/10 Net 30") — the client gets a small discount (2%) if they pay within 10 days, otherwise the full amount is due at 30 days.',
        ],
      },
      {
        heading: 'Choosing the right terms for your business',
        paragraphs: [
          'Shorter terms improve your cash flow but can be a harder sell to larger clients whose accounts payable process simply doesn’t move that fast — a Net 30 request to a company that only runs payment batches monthly may functionally become Net 45 no matter what the invoice says.',
          'A reasonable default for new or small clients is Due on Receipt or Net 15. For established clients or larger companies, Net 30 is usually the realistic middle ground. Reserve tighter terms for situations where you have leverage — rush work, deposits, or a client with a history of paying late.',
        ],
      },
      {
        heading: 'Communicating terms clearly',
        paragraphs: [
          'Put payment terms in the contract or proposal before work starts, not for the first time on the invoice. An invoice should confirm terms the client already agreed to, never introduce new ones.',
          'On the invoice itself, show both the term ("Net 30") and the actual due date as a calendar date. Relying on the client to do the math from the invoice date to figure out when payment is due is where most "we didn’t realize it was due" disputes come from.',
        ],
      },
      {
        heading: 'When to tighten your terms',
        paragraphs: [
          'If a client has paid late more than once, it’s reasonable to shorten their terms on future invoices, request a deposit upfront, or move them to Due on Receipt. This isn’t punitive — it’s adjusting to the actual payment behavior you’ve observed, the same way a bank adjusts credit terms based on repayment history.',
        ],
      },
    ],
    faq: [
      {
        question: 'What does "Net 30" mean exactly?',
        answer:
          'It means the full invoice amount is due 30 calendar days after the invoice date — not 30 business days, and not 30 days after the client received the goods or finished reviewing the work, unless you’ve specified otherwise.',
      },
      {
        question: 'Is Due on Receipt too aggressive for a new client?',
        answer:
          'Not inherently — it’s standard for smaller jobs and many freelance engagements. It can feel aggressive to a client used to Net 30 terms, so it’s worth setting the expectation in the proposal rather than surprising them with it on the first invoice.',
      },
      {
        question: 'Can I charge interest on a late payment?',
        answer:
          'Many businesses do include a late-payment clause in their contracts or invoice terms. Rules on what’s enforceable vary by country and by contract type, so check local regulations or a legal advisor before setting a specific rate — this guide intentionally doesn’t state one as a universal figure.',
      },
      {
        question: 'Should payment terms be different for different clients?',
        answer:
          'Yes, and this is normal practice. Terms can reasonably vary by client size, payment history, and deal size — a first-time client and a five-year repeat customer don’t need identical terms.',
      },
    ],
    relatedSlugs: ['how-to-get-paid-faster', 'invoice-late-fees', 'accept-online-payments'],
  },
  {
    slug: 'invoice-number-guide',
    title: 'How to Number Your Invoices (Without Losing Track)',
    description:
      'A simple, sustainable invoice numbering system — sequential, date-based, or client-based — plus how to fix a numbering system that’s already inconsistent.',
    category: 'invoicing',
    readTimeMinutes: 6,
    publishedDate: '2026-08-05',
    updatedDate: '2026-08-05',
    intro: [
      'Invoice numbers seem trivial until you’re trying to reconcile a year’s worth of payments, or a client asks "which invoice was that again?" and you have three files all named "invoice.pdf." A consistent numbering system fixes this permanently, and it takes about five minutes to set up.',
    ],
    sections: [
      {
        heading: 'Why it matters',
        paragraphs: [
          'An invoice number is a unique reference — for you, for the client, and for whoever handles your bookkeeping or taxes. Without one, matching a bank deposit back to a specific invoice becomes guesswork, especially once you have more than a handful of clients.',
          'It also signals professionalism. A client who receives invoice "#0001" from a business that’s clearly been operating for years notices the same way they’d notice a website with a broken link.',
        ],
      },
      {
        heading: 'Common numbering systems',
        paragraphs: ['Most systems fall into one of a few patterns:'],
        bullets: [
          'Simple sequential — 1001, 1002, 1003. Easiest to maintain, works fine for most freelancers and small businesses.',
          'Date-based — 2026-08-001, meaning the first invoice issued in August 2026. Useful if you want the period visible at a glance.',
          'Client-based — ACME-014, meaning the 14th invoice for client "Acme." Helpful if you invoice a small number of clients repeatedly and want per-client continuity.',
          'Hybrid — combining a date or client prefix with a sequential suffix, e.g. 2026-ACME-003.',
        ],
      },
      {
        heading: 'Rules that keep it from breaking',
        paragraphs: [
          'Pick one system and don’t mix it mid-year — switching formats halfway through makes it harder to sort invoices chronologically later. Never reuse a number, even for a voided or cancelled invoice; instead mark it void and move to the next number, so the sequence stays intact for anyone auditing it later.',
          'Pad numbers with leading zeros (0001 instead of 1) so they sort correctly as text, not just as numbers — this matters more than it sounds once you’re scanning a folder of PDF filenames.',
        ],
      },
      {
        heading: 'Fixing a system that’s already a mess',
        paragraphs: [
          'If your existing invoices have inconsistent or duplicate numbers, don’t try to renumber history — that creates more confusion with clients who’ve already filed the old numbers on their end. Instead, pick a clean starting point going forward (e.g. jump to the next round number, like 2000) and apply the new system from that point on.',
        ],
      },
      {
        heading: 'Switching tools',
        paragraphs: [
          'When you move to a new invoicing tool or generator, set its starting number to continue from your last real invoice number, not reset to 1. Most tools let you set a custom starting number for exactly this reason — use it once when you switch, and the system carries on automatically after that.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can I restart my invoice numbers every year?',
        answer:
          'Yes, many businesses do this using a year-prefixed format like 2026-001, which resets the sequential part each January. It keeps numbers shorter and makes the invoice year obvious at a glance — just make sure the prefix changes, not just the sequence.',
      },
      {
        question: 'What if I accidentally skip a number?',
        answer:
          'A small gap generally isn’t a problem — just continue the sequence from where you are. What you want to avoid is reusing a number or having two different invoices share the same one, since that’s what actually breaks reconciliation.',
      },
      {
        question: 'Do invoice numbers legally need to be sequential?',
        answer:
          'Requirements vary by country and business type, and some jurisdictions do require sequential, gap-free numbering for tax purposes. Check your local tax authority’s rules if this applies to you — when in doubt, sequential with no gaps is the safest default regardless of jurisdiction.',
      },
      {
        question: 'Should quotes and invoices share the same numbering sequence?',
        answer:
          'It’s clearer to keep them separate — for example prefixing quotes with "Q-" and invoices with "INV-." Sharing one sequence across both document types makes it harder to tell at a glance how many actual invoices you’ve issued.',
      },
    ],
    relatedSlugs: ['how-to-make-an-invoice', 'invoice-payment-terms', 'invoice-statuses'],
  },
  {
    slug: 'how-to-get-paid-faster',
    title: 'How to Get Paid Faster: Practical Ways to Speed Up Invoice Payments',
    description:
      'Concrete, low-effort changes to your invoicing process — clearer invoices, upfront deposits, and better timing — that shorten how long clients take to pay.',
    category: 'invoicing',
    readTimeMinutes: 9,
    publishedDate: '2026-08-05',
    updatedDate: '2026-08-16',
    intro: [
      'Most late payments aren’t caused by clients who don’t want to pay — they’re caused by friction: an unclear invoice, an inconvenient payment method, or simply no reminder before the due date slipped past. Fixing the friction usually does more for your cash flow than chasing harder after the fact.',
    ],
    sections: [
      {
        heading: 'Find out where the delay is actually happening',
        paragraphs: [
          'Before changing anything, look at your last few months of invoices and note where the slowdown happens: does the client open the invoice quickly but sit on it, or does it go unopened for days? Is it the same one or two clients every time, or spread across most of them?',
          'A pattern tied to specific clients usually points to a relationship or cash-flow issue on their end, which no invoicing change will fully fix. A pattern spread across most clients usually means the invoice itself, your terms, or your reminder process is the weak point — and that’s the part worth fixing first.',
        ],
      },
      {
        heading: 'Make it easy to say yes',
        paragraphs: [
          'Every extra step between "client opens the invoice" and "client pays it" is a chance for the payment to stall. A clear breakdown of what’s owed, a due date stated as an actual calendar date rather than just a term like "Net 30," and at least one payment method the client already uses regularly (bank transfer, card, UPI) removes most of that friction.',
          'If you only accept one narrow payment method, you’re relying on the client to go out of their way to use it. Offering a second option — even a simple one — measurably reduces how often payment gets pushed to "later, when I have time to figure this out."',
        ],
      },
      {
        heading: 'Ask for a deposit on larger jobs',
        paragraphs: [
          'For any project large enough that non-payment would actually hurt, an upfront deposit (commonly 25–50%) protects your cash flow and filters out clients who aren’t serious. It also means you’re only chasing the remaining balance, not the full amount, at the end.',
          'Deposits work best when they’re standard practice, stated in the proposal before the client commits — not introduced as a surprise once the project has already started.',
        ],
      },
      {
        heading: 'Send invoices immediately',
        paragraphs: [
          'Batching invoices to send at the end of the week or month feels efficient but directly extends how long you wait to get paid — every day of delay on your end pushes the due date back by the same amount. Send the invoice the moment the triggering work or milestone is complete.',
        ],
      },
      {
        heading: 'Use reminders — before the due date, not just after',
        paragraphs: [
          'A short reminder two or three days before the due date prevents far more late payments than a reminder after the date has already passed, because it catches invoices that simply got buried in someone’s inbox rather than actively ignored. Keep reminders short and neutral in tone — a reference to the invoice number, amount, and due date is usually enough.',
        ],
        bullets: [
          'A few days before due: a short heads-up with the amount and due date',
          'On the due date: a brief confirmation request',
          'A few days after: a direct reminder, in firmer language, that it’s now overdue',
        ],
      },
      {
        heading: 'Make non-payment slightly costly',
        paragraphs: [
          'A stated late fee, even a modest one, changes the calculus for a client deciding which vendor to pay first when cash is tight on their end. It doesn’t need to be aggressive to be effective — just present and clearly stated upfront.',
          'For repeat non-payment, pausing further work until the outstanding balance clears is a reasonable and common response — continuing to deliver work for an unpaid client rarely improves the odds of getting paid for what came before.',
        ],
      },
    ],
    faq: [
      {
        question: 'What’s the single biggest factor in getting paid faster?',
        answer:
          'Removing friction from the payment step itself — a clear invoice with an obvious total, due date, and a payment method the client already uses. It matters more than almost any reminder or late fee, because most delays start with the client not immediately knowing what to do with the invoice.',
      },
      {
        question: 'Do late fees actually work?',
        answer:
          'They help mainly as a deterrent stated upfront, more than as something you’ll frequently collect. Their presence on an invoice nudges a client to prioritize your payment over one without any stated consequence for lateness.',
      },
      {
        question: 'How many reminders is too many?',
        answer:
          'Generally, one reminder before the due date and one or two after, spaced several days apart, is enough. Beyond that, daily or repeated reminders tend to strain the relationship without meaningfully increasing how fast you get paid.',
      },
      {
        question: 'Should I stop working for a client who consistently pays late?',
        answer:
          'That’s a reasonable option once the pattern is established rather than a one-off. Requiring upfront deposits or moving to Due on Receipt terms for that client is often a softer first step before cutting them off entirely.',
      },
      {
        question: 'Should I use the same payment terms for every client?',
        answer:
          'No — it’s reasonable to offer better terms to reliable, long-term clients and tighter terms, or deposits, to new clients or ones with a history of paying late.',
      },
    ],
    relatedSlugs: ['invoice-payment-terms', 'invoice-late-fees', 'invoice-follow-up'],
  },
  {
    slug: 'invoice-late-fees',
    title: 'Invoice Late Fees: How to Charge Them the Right Way',
    description:
      'How to structure a late fee, add it to your invoices and contracts, and enforce it without damaging a client relationship you want to keep.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-05',
    updatedDate: '2026-08-05',
    intro: [
      'A late fee is less about the money you actually collect and more about giving a client a reason to prioritize your invoice over someone else’s when they’re deciding what to pay first. Used well, it rarely needs to be aggressive to be effective — and used carelessly, it can create a dispute that costs more time than the fee is worth.',
    ],
    sections: [
      {
        heading: 'Why bother with a late fee at all',
        paragraphs: [
          'Clients juggling multiple vendors often pay whoever complains loudest or charges a visible penalty for lateness — not necessarily whoever did the work first. A stated late fee puts you in that first category before a payment is even overdue.',
          'It also formalizes the cost of delay. Without one, there’s no real downside to a client paying you last among their obligations; with one, doing so has a small, explicit cost.',
        ],
      },
      {
        heading: 'Common late fee structures',
        paragraphs: ['Two structures cover most small-business invoicing:'],
        bullets: [
          'Flat fee — a fixed amount added once the invoice passes its due date (e.g. a flat charge added at 30 days late).',
          'Percentage-based — a percentage of the outstanding balance, either a one-time charge or accruing monthly until paid, often with a stated cap so it doesn’t grow indefinitely.',
        ],
        // no legal % examples — jurisdiction-dependent, deliberately omitted.
      },
      {
        heading: 'What the law actually allows',
        paragraphs: [
          'Whether — and how much — you can charge in late fees depends on your country, state or province, and sometimes the type of contract involved. Some jurisdictions cap interest or late-fee percentages by law; others leave it to what’s stated in the contract.',
          'Rather than guessing, check your local regulations (or a lawyer/accountant familiar with your jurisdiction) before setting a specific number, and make sure whatever you land on is written into the contract or terms the client agreed to — not introduced for the first time on an overdue invoice.',
        ],
      },
      {
        heading: 'Adding a late fee clause',
        paragraphs: [
          'State the late fee in the original contract or proposal, and repeat it on the invoice itself, ideally near the due date and payment terms — for example, "A late fee applies to balances unpaid after the due date; see contract for details." The invoice should reference an agreement the client already signed off on, not introduce a new term unilaterally.',
        ],
      },
      {
        heading: 'Enforcing — or waiving — it',
        paragraphs: [
          'For a client who’s a few days late for the first time, many businesses choose to waive the fee and send a friendly reminder instead — the goal of a late fee is behavior change, not maximizing revenue from penalties. Reserve actual enforcement for repeat lateness or invoices significantly overdue.',
          'If you do apply it, state the fee clearly on the follow-up invoice with the calculation shown, rather than just a larger total with no explanation — an unexplained increase is what turns a late-fee conversation into a dispute.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is there a legal maximum for late fees?',
        answer:
          'In many places, yes — but the specific limit depends entirely on your country or state and sometimes on the contract type, so there isn’t one universal number that applies everywhere. Check local regulations before setting a rate.',
      },
      {
        question: 'Do I need a signed contract to charge a late fee?',
        answer:
          'It’s strongly recommended. Charging a late fee that was never agreed to in writing is far more likely to be disputed — and in some jurisdictions may not be enforceable — compared to one stated clearly in a contract or proposal the client accepted upfront.',
      },
      {
        question: 'Can I apply a late fee retroactively to old invoices?',
        answer:
          'Generally no, not fairly — a late fee should only apply going forward from when it was clearly communicated to the client, not be added after the fact to invoices that didn’t originally include one.',
      },
      {
        question: 'What if a client simply refuses to pay the late fee?',
        answer:
          'For a first occurrence, many businesses waive it to preserve the relationship rather than escalate over a small amount. For repeated refusal, that’s a signal to revisit the terms of the relationship itself — tighter payment terms, deposits, or ending the engagement — rather than a hill to fight over one fee.',
      },
    ],
    relatedSlugs: ['invoice-payment-terms', 'how-to-get-paid-faster', 'bad-debt'],
  },
  {
    slug: 'accept-online-payments',
    title: 'How to Accept Online Payments on Your Invoices',
    description:
      'Compare ways to accept credit card, ACH, and other online payments on invoices — fees, setup effort, and how offering one cuts payment friction and gets you paid faster.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'Every payment method you don’t offer is a small excuse for a client to delay. Bank transfer alone works fine for clients who already have your details saved, but a new client or a smaller job often gets paid faster with a one-click card or online option sitting right on the invoice.',
    ],
    sections: [
      {
        heading: 'Why online payment options speed things up',
        paragraphs: [
          'Paying by card or a payment link usually takes under a minute, doesn’t require the client to open a separate banking app, and can be done from a phone. Bank transfer, by comparison, often means logging into online banking, manually entering account details, and double-checking a reference number — enough extra steps that it gets postponed to "later."',
        ],
      },
      {
        heading: 'Common options and how they compare',
        paragraphs: ['Most small businesses end up offering some mix of these:'],
        bullets: [
          'Card payments — fastest for the client, but usually carry the highest processing fee (commonly around 2–3% per transaction).',
          'Bank transfer / ACH — little to no fee, but slower to arrive and more manual for the client to initiate.',
          'Digital wallets and UPI-style transfers — fast and low-friction where they’re widely used, with fees that vary by provider and region.',
          'Payment links generated by invoicing tools — let the client pay by card or wallet from the invoice itself without you handling card details directly.',
        ],
      },
      {
        heading: 'Weighing the fees against getting paid faster',
        paragraphs: [
          'A 2–3% processing fee feels like a cost, but it’s worth comparing against what a late payment actually costs you — a week or two of delayed cash flow, or the time spent chasing a reminder. For most freelancers and small businesses, offering card payments on larger or time-sensitive invoices pays for itself in fewer overdue invoices.',
          'A common approach is to absorb the fee on smaller invoices where speed matters most, and stick to bank transfer for large invoices where the fee percentage adds up to a meaningful amount.',
        ],
      },
      {
        heading: 'Adding it to your invoice',
        paragraphs: [
          'Most invoicing tools and payment processors let you attach a "Pay Now" link or button directly to the invoice, so the client can pay without needing your bank details typed out manually. If you’re sending PDF invoices without a tool like this, a payment link pasted directly in the email works nearly as well.',
        ],
      },
      {
        heading: 'Basic security expectations',
        paragraphs: [
          'You should never need to see or store a client’s full card number yourself — a reputable payment processor handles that and only passes you a confirmation once payment clears. If a tool asks you to collect and store card details manually, that’s a sign to use a different one.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is it worth accepting card payments for a small freelance business?',
        answer:
          'Usually yes for at least some invoices — the processing fee is a small, predictable cost compared to the unpredictable cost of a payment that’s delayed by a week or more because bank transfer felt like too much effort.',
      },
      {
        question: 'Who pays the card processing fee — me or the client?',
        answer:
          'Either is common practice. Some businesses build the fee into their rates and absorb it; others pass it on explicitly as a surcharge on card payments. Whichever you choose, state it upfront rather than as a surprise on the invoice.',
      },
      {
        question: 'Do I need a merchant account to accept online payments?',
        answer:
          'Not necessarily — most invoicing tools and payment processors let you accept card payments without setting up a traditional merchant account separately; they handle that infrastructure for you in exchange for their processing fee.',
      },
      {
        question: 'Is bank transfer still worth offering if I add online payments?',
        answer:
          'Yes — some clients, especially larger companies with fixed accounts-payable processes, will only pay by bank transfer regardless of what else you offer. Keep it available alongside any online option rather than replacing it.',
      },
    ],
    relatedSlugs: ['how-to-get-paid-faster', 'invoice-payment-terms'],
  },
  {
    slug: 'invoice-follow-up',
    title: 'Invoice Follow-Up: How to Ask for Payment Without It Being Awkward',
    description:
      'A professional invoice follow-up process — timelines, sample wording, and escalation steps — that gets you paid faster without straining the client relationship.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'Following up on an invoice feels awkward mainly because it’s improvised — a one-off message sent in frustration once payment is already late. A planned follow-up sequence, decided in advance and applied consistently to every client, removes the awkwardness because it stops being personal and starts being routine.',
    ],
    sections: [
      {
        heading: 'Plan the sequence before you need it',
        paragraphs: [
          'Decide your follow-up timeline once, for every invoice, rather than figuring it out client by client under pressure. A simple, reliable sequence: a reminder before the due date, a neutral check-in on the due date, a direct follow-up a few days after, and a firmer message if it stretches further.',
        ],
      },
      {
        heading: 'Before the due date',
        paragraphs: [
          'A short heads-up a few days before the due date isn’t a follow-up in the chasing sense — it’s a courtesy that catches invoices that simply got buried in an inbox. Keep it brief: invoice number, amount, due date, nothing more.',
        ],
      },
      {
        heading: 'On and just after the due date',
        paragraphs: [
          'A message on the due date can be as light as confirming the invoice was received and asking if everything looks right. A few days past due, shift to a direct but still friendly tone — assume it was missed, not ignored, and make it easy to act on immediately by restating the amount and a payment link.',
        ],
      },
      {
        heading: 'When it stretches further',
        paragraphs: [
          'Past a week or two overdue, it’s reasonable to be more direct: reference the original due date explicitly, mention any late fee that applies, and ask for a specific response — a payment date, or a reason for the delay. A phone call at this stage often resolves things faster than another email, especially with a client you have an existing relationship with.',
        ],
      },
      {
        heading: 'Keep the tone proportional',
        paragraphs: [
          'Matching your tone to how overdue the invoice actually is protects the relationship. Sending a firm, formal message on day one after the due date reads as aggressive for what might just be a delay; staying friendly after a month of silence reads as if you don’t take your own invoice seriously. Escalate gradually, and let the client’s response — or lack of one — set the pace.',
        ],
      },
    ],
    faq: [
      {
        question: 'How soon after the due date should I follow up?',
        answer:
          'A few days is reasonable — it gives the client a short grace period without letting the invoice go quiet for too long. Waiting weeks to send the first follow-up makes the eventual message feel more confrontational than it needs to.',
      },
      {
        question: 'Is email or phone better for following up on an overdue invoice?',
        answer:
          'Email works well for the first one or two follow-ups since it’s low-pressure and gives a paper trail. A phone call is usually more effective once an invoice is significantly overdue, since it’s harder to leave a direct question unanswered on a call than in an inbox.',
      },
      {
        question: 'What if the client just stops responding?',
        answer:
          'Continue the planned sequence rather than escalating tone repeatedly — a final, clear message stating the amount, how overdue it is, and what happens next (a late fee, pausing further work, or formal collection) is usually the right last step before treating it as a collections issue.',
      },
      {
        question: 'Should I apologize for following up?',
        answer:
          'No — asking to be paid for completed work doesn’t need an apology. A neutral, matter-of-fact tone reads as more professional than an apologetic one, and it sets the expectation that following up is routine, not an imposition.',
      },
    ],
    relatedSlugs: ['invoice-reminder-templates', 'overdue-invoices'],
  },
  {
    slug: 'invoice-reminder-templates',
    title: 'Invoice Reminder Templates: What to Send and When',
    description:
      'Ready-to-use invoice reminder templates for every stage — before due, due today, and overdue — plus guidance on timing and tone to get invoices paid faster.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'Having a reminder template ready for each stage of the payment timeline means you send it the moment it’s needed instead of drafting one from scratch while already annoyed that the invoice is late. The wording below is meant as a starting point — adjust it to your own voice, but keep the structure: what’s owed, since when, and what to do next.',
    ],
    sections: [
      {
        heading: 'A few days before the due date',
        paragraphs: ['A light, courtesy heads-up — not a chase, just a nudge.'],
        bullets: [
          '"Hi [Name], just a quick heads-up that invoice #[number] for [amount] is due on [date]. Let me know if you have any questions before then — thanks!"',
        ],
      },
      {
        heading: 'On the due date',
        paragraphs: ['Neutral, brief, easy to act on immediately.'],
        bullets: [
          '"Hi [Name], invoice #[number] for [amount] is due today. Here’s the payment link again for convenience: [link]. Let me know if anything’s unclear."',
        ],
      },
      {
        heading: 'A few days overdue',
        paragraphs: ['Direct but still assumes good faith — it may just have been missed.'],
        bullets: [
          '"Hi [Name], following up on invoice #[number] for [amount], which was due on [date] and appears to still be outstanding. Could you let me know when I can expect payment? Happy to resend any details you need."',
        ],
      },
      {
        heading: 'Significantly overdue',
        paragraphs: ['Firmer, and specific about what happens next.'],
        bullets: [
          '"Hi [Name], invoice #[number] for [amount] is now [X] days overdue. Per our agreement, a late fee of [fee] applies to balances unpaid past [date]. Please let me know a payment date, or reach out if there’s an issue I should know about."',
        ],
      },
      {
        heading: 'Tips for using these effectively',
        paragraphs: [
          'Always restate the invoice number and amount — don’t make the client dig through old emails to find what you’re referring to. Include a direct payment link every time rather than assuming they’ve saved the original invoice, and keep each message shorter as it gets more overdue rather than longer; a long message reads as more emotional, not more persuasive.',
        ],
      },
    ],
    faq: [
      {
        question: 'How many reminders should I send before escalating?',
        answer:
          'Typically one before the due date and two or three after, spaced several days apart. Beyond that, repeated reminders with no response usually call for a phone call or a formal collection step rather than another email.',
      },
      {
        question: 'Should reminders be automated?',
        answer:
          'For the early, courtesy-stage reminders, yes — many invoicing tools support scheduled reminders, and automating them means they never get skipped because you were busy. Firmer, later-stage messages are usually worth writing personally.',
      },
      {
        question: 'Is it okay to reuse the same template for every client?',
        answer:
          'As a starting point, yes — but personalize the name and specifics each time. A template that clearly wasn’t customized (wrong name, wrong amount) undermines the professionalism it’s meant to convey.',
      },
      {
        question: 'What should I avoid putting in a reminder?',
        answer:
          'Avoid guilt-tripping language, vague accusations, or anything that assumes bad faith on the first reminder. Stick to facts — amount, due date, days overdue — and save firmer consequences for when the pattern actually justifies them.',
      },
    ],
    relatedSlugs: ['invoice-follow-up', 'collection-letter-templates'],
  },
  {
    slug: 'overdue-invoices',
    title: 'Overdue Invoices: A Step-by-Step Guide to Getting Paid',
    description:
      'A step-by-step guide to handling overdue invoices professionally — when to follow up, how to escalate, and how to protect the client relationship while you do it.',
    category: 'invoicing',
    readTimeMinutes: 9,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-16',
    intro: [
      'An invoice becomes overdue the moment the due date passes without payment — but how you handle the next few weeks matters far more than the fact that it happened. Most overdue invoices get paid; the ones that don’t are usually mishandled early, either ignored too long or escalated too fast.',
    ],
    sections: [
      {
        heading: 'Step 1: Confirm it’s actually overdue',
        paragraphs: [
          'Before reacting, check the invoice date, the agreed terms, and whether the client received it at all — a bounced email or a wrong contact address can make an invoice look ignored when it was never actually seen. A quick confirmation message ("just checking this reached you") costs nothing and avoids an awkward false start.',
        ],
      },
      {
        heading: 'Step 2: Send a friendly, direct reminder',
        paragraphs: [
          'For the first few days past due, assume it was missed rather than refused. Restate the invoice number, amount, and original due date, and include a payment link. This resolves the majority of overdue invoices without needing to go further.',
        ],
      },
      {
        heading: 'Step 3: Escalate the tone, not just the frequency',
        paragraphs: [
          'If the first reminder doesn’t get a response within a few days, send a firmer follow-up that references the late fee (if one applies) and asks for a specific payment date rather than a general "let me know." A phone call at this stage often works better than a third email, since it’s harder to leave a direct question unanswered.',
        ],
      },
      {
        heading: 'Step 4: Offer a payment plan if it makes sense',
        paragraphs: [
          'If a client explains they’re short on cash rather than refusing to pay, a structured payment plan — a portion now, the rest over a few installments — often gets you paid faster and more fully than continuing to demand the full amount at once. It also preserves the relationship better than an all-or-nothing standoff, and it’s worth offering before moving to a formal notice.',
        ],
      },
      {
        heading: 'Step 5: Put it in writing formally',
        paragraphs: [
          'Past two or three weeks overdue with no resolution, a more formal written notice — sometimes called a collection letter — signals that you’re treating this seriously. State the amount, the original due date, any late fee applied, and a clear deadline for response before further action.',
        ],
      },
      {
        heading: 'Step 6: Decide on further action',
        paragraphs: [
          'If a formal notice doesn’t resolve it, your realistic options are a collections agency, small claims court (for smaller amounts, depending on your jurisdiction’s threshold), invoice factoring for larger B2B invoices, or writing the invoice off as bad debt. Which makes sense depends on the amount owed, the cost and time of pursuing it, and whether preserving the relationship still matters.',
        ],
      },
    ],
    faq: [
      {
        question: 'How long is too long to wait before following up on an overdue invoice?',
        answer:
          'More than a week of silence with no reminder sent is generally too long — the longer an invoice sits untouched, the easier it is for the client to deprioritize it further, and the less fresh the work is in their mind.',
      },
      {
        question: 'Should I keep working for a client with an overdue invoice?',
        answer:
          'For ongoing work, many businesses pause further deliverables once an invoice is significantly overdue, particularly after a reminder has gone unanswered. Continuing to deliver work rarely improves the odds of getting paid for what’s already outstanding.',
      },
      {
        question: 'Is a formal collection letter necessary for every overdue invoice?',
        answer:
          'No — most overdue invoices resolve with a reminder or two. A formal letter is worth reserving for invoices that are significantly overdue and have already gone through a couple of unanswered follow-ups.',
      },
      {
        question: 'At what point should I consider the invoice unlikely to be paid?',
        answer:
          'There’s no fixed rule, but a common signal is prolonged silence despite multiple follow-ups through different channels (email and phone), combined with no explanation offered. At that point, it’s reasonable to weigh formal collection against writing it off.',
      },
      {
        question: 'Is small claims court worth it for a small invoice?',
        answer:
          'It depends on the amount and your jurisdiction’s process — small claims is generally designed to be accessible without a lawyer, but it still costs time and a filing fee, so weigh it against the invoice amount before pursuing it.',
      },
      {
        question: 'Should I offer a discount to get an overdue invoice settled faster?',
        answer:
          'It can make sense for a large, aging invoice, where a partial payment now is worth more to your cash flow than holding out for the full amount later — but it should be a deliberate decision, not a default response to every overdue invoice.',
      },
    ],
    relatedSlugs: ['invoice-late-fees', 'collection-letter-templates', 'bad-debt'],
  },
  {
    slug: 'collection-letter-templates',
    title: 'Collection Letter Templates for Unpaid Invoices',
    description:
      'Free collection letter templates for every stage of an unpaid invoice — from a first formal notice to a final demand — with professional wording that avoids damaging the relationship.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'A collection letter is a step up from a reminder email — it’s a formal, written notice that an invoice is significantly overdue and that you expect a resolution. It’s worth reserving for invoices that have already gone through a couple of friendly follow-ups without success, rather than sending it as a first response.',
    ],
    sections: [
      {
        heading: 'When a collection letter is the right move',
        paragraphs: [
          'Use one once an invoice is meaningfully overdue — commonly two to four weeks past the due date — and after at least one or two informal reminders have gone unanswered. Sending one too early, on a first-time small delay, tends to read as disproportionate and can strain a relationship that a simple reminder would have fixed.',
        ],
      },
      {
        heading: 'First notice',
        paragraphs: ['Formal but still measured — this is a documented request, not a threat.'],
        bullets: [
          '"This letter is a formal notice that invoice #[number], dated [date] for [amount], remains unpaid as of today, [X] days past its due date of [date]. Please remit payment by [new deadline] or contact us to discuss a payment arrangement. If this invoice has already been paid, please disregard this notice and let us know."',
        ],
      },
      {
        heading: 'Final notice',
        paragraphs: ['Sent only if the first notice goes unanswered — states consequences plainly.'],
        bullets: [
          '"Despite our notice dated [date], invoice #[number] for [amount] remains unpaid. This is a final request for payment. If payment or a satisfactory response is not received by [deadline], we will [pursue late fees per our agreement / refer this matter to a collections agency / pursue other available remedies]. We would prefer to resolve this directly and welcome your response."',
        ],
      },
      {
        heading: 'What to include no matter the stage',
        paragraphs: [
          'Every collection letter should state the invoice number, original amount, due date, days overdue, and a clear deadline for response. If a late fee applies per your contract, state the calculation rather than just a larger total — an unexplained number is what turns a collection letter into a dispute.',
        ],
      },
      {
        heading: 'Tone matters even at this stage',
        paragraphs: [
          'A collection letter should be firm and factual, not hostile. Avoid language that assumes bad intent — many overdue invoices at this stage are still the result of internal delays on the client’s side, not refusal to pay, and a measured tone keeps the door open for a straightforward resolution.',
        ],
      },
    ],
    faq: [
      {
        question: 'Does a collection letter have legal weight?',
        answer:
          'On its own, generally not — it’s a formal request, not a legal filing. Its value is in creating a documented record of your attempt to resolve the matter, which can matter later if you pursue small claims court or a collections agency.',
      },
      {
        question: 'Should a collection letter be sent by email or post?',
        answer:
          'Email is usually sufficient and faster for most small-business invoicing. For larger amounts or where you may need a stronger paper trail, a physical letter (sometimes sent alongside the email) adds weight.',
      },
      {
        question: 'How many collection letters should I send before escalating further?',
        answer:
          'Typically one or two, spaced a week or two apart, is enough before deciding between a collections agency, small claims court, or writing the debt off — sending several rounds of collection letters with no response rarely changes the outcome.',
      },
      {
        question: 'Can I add a collection letter fee to the invoice?',
        answer:
          'Only if a fee for this was stated in your original contract or terms — adding a new charge unilaterally at the collection stage is more likely to be disputed and, depending on jurisdiction, may not be enforceable.',
      },
    ],
    relatedSlugs: ['overdue-invoices', 'bad-debt'],
  },
  {
    slug: 'bad-debt',
    title: 'Bad Debt: What It Is and How to Reduce It',
    description:
      'What bad debt is, why invoices become uncollectible, how to spot the warning signs early, and practical ways to reduce bad debt and protect your cash flow.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'Bad debt is money you’re owed that you’ve concluded you’re not going to collect. It’s different from a simply overdue invoice — an overdue invoice is still expected to be paid; bad debt is one you’ve written off after reasonable collection efforts have failed.',
    ],
    sections: [
      {
        heading: 'What makes an invoice "bad debt" rather than just overdue',
        paragraphs: [
          'The line isn’t about how many days have passed — it’s about whether collection is still realistic. An invoice becomes bad debt when the client is unresponsive despite repeated attempts, has gone out of business, disputes the debt without resolution, or when further pursuit costs more (in time or money) than the invoice is worth.',
        ],
      },
      {
        heading: 'Warning signs before it gets there',
        paragraphs: ['A few patterns tend to show up before an invoice becomes genuinely uncollectible:'],
        bullets: [
          'A client who has started missing or delaying payments on prior invoices, not just this one',
          'Repeated excuses without a concrete payment date attached',
          'Reduced responsiveness compared to earlier in the relationship',
          'Public signals of financial trouble — layoffs, closures, other vendors reporting the same issue',
        ],
      },
      {
        heading: 'Reducing how much bad debt you accumulate',
        paragraphs: [
          'The most effective prevention happens before the invoice is even sent: requiring a deposit on larger jobs, running a basic credit or reputation check on new clients, and using shorter payment terms for anyone without an established payment history all reduce your exposure if a client can’t or won’t pay.',
          'For existing clients, tightening terms — smaller ongoing engagements, deposits, or Due on Receipt — after the first late payment prevents a pattern from turning into a total loss.',
        ],
      },
      {
        heading: 'Writing it off',
        paragraphs: [
          'Once you’ve reasonably concluded an invoice won’t be collected, writing it off clears it from your active accounts receivable and stops it from distorting your view of expected cash flow. Keep records of your collection attempts — they’re often needed for tax purposes and useful if the client’s situation changes later.',
        ],
      },
      {
        heading: 'The tax angle, briefly',
        paragraphs: [
          'In many places, bad debt from unpaid invoices can be deducted or accounted for in a way that reduces the tax impact of the loss, but the specific rules depend on your accounting method and jurisdiction. Check with a local accountant before assuming a specific treatment applies to your situation.',
        ],
      },
    ],
    faq: [
      {
        question: 'How long should I wait before calling an invoice bad debt?',
        answer:
          'There’s no universal timeframe — it depends on how much you’ve pursued it and how confident you are that further effort won’t help. Many businesses use a rough marker like 90–180 days of no resolution despite active follow-up, but a clear signal like the client closing down can justify writing it off sooner.',
      },
      {
        question: 'Can I still try to collect an invoice after writing it off as bad debt?',
        answer:
          'Yes — writing it off is an accounting and planning decision, not a legal waiver of the debt. If the client’s situation improves or you get a lead on payment later, you can still pursue it.',
      },
      {
        question: 'Does bad debt affect my taxes?',
        answer:
          'Often yes, in ways that vary by jurisdiction and accounting method (cash vs accrual) — check with a local accountant, since this guide intentionally doesn’t state universal tax rules that differ by country.',
      },
      {
        question: 'What’s the biggest single way to prevent bad debt?',
        answer:
          'Requiring a deposit on larger jobs. It caps your maximum loss on any single client to the unpaid remainder rather than the full project value, and it filters out clients who were never going to follow through.',
      },
    ],
    relatedSlugs: ['overdue-invoices', 'accounts-receivable'],
  },
  {
    slug: 'quote-vs-invoice',
    title: 'Quote vs Invoice: What’s the Difference?',
    description:
      'The difference between a quote and an invoice, when each becomes legally binding, and how both fit into your sales workflow — with plain examples.',
    category: 'invoicing',
    readTimeMinutes: 6,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'A quote and an invoice sit at opposite ends of the same transaction — one proposes a price before work starts, the other requests payment after it’s done (or due). Confusing the two is one of the more common small-business paperwork mistakes, and it can create real confusion about what a client actually agreed to.',
    ],
    sections: [
      {
        heading: 'What a quote is',
        paragraphs: [
          'A quote is a fixed price offer for specific work or goods, sent before anything begins. Once a client accepts it — in writing or by signing — it typically becomes a binding commitment to that price, which is why quotes are usually more precise than estimates and shouldn’t be sent until you’re confident in the scope.',
        ],
      },
      {
        heading: 'What an invoice is',
        paragraphs: [
          'An invoice is a request for payment, sent once work is complete (or at agreed milestones) and payment is now due. It restates what was delivered, references the agreed price, and states how and when to pay — it doesn’t propose a price, it bills for one already agreed to.',
        ],
      },
      {
        heading: 'The key differences',
        paragraphs: ['A quick way to keep them straight:'],
        bullets: [
          'Timing — a quote comes before work starts; an invoice comes after work is done or due.',
          'Purpose — a quote proposes a price; an invoice requests payment for a price already agreed.',
          'Binding nature — an accepted quote is a commitment to a price; an invoice enforces that commitment by billing for it.',
          'Numbering — most businesses keep separate sequences for each (e.g. "Q-" and "INV-") so they’re easy to tell apart at a glance.',
        ],
      },
      {
        heading: 'How they fit together',
        paragraphs: [
          'In a typical workflow: a client asks about a project, you send a quote, they accept it, you do the work, and you send an invoice referencing that same quote and price. Sending an invoice with a different amount than the accepted quote — without explaining why — is one of the fastest ways to trigger a client dispute.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can I turn a quote directly into an invoice?',
        answer:
          'Yes, and many invoicing tools let you convert an accepted quote into an invoice automatically, carrying over the line items and price so nothing has to be re-entered or risk not matching.',
      },
      {
        question: 'Is a quote legally binding?',
        answer:
          'Once accepted by the client, it generally functions as a binding agreement on price and scope, though the specifics depend on your jurisdiction and whether there’s a signature or written acceptance involved.',
      },
      {
        question: 'What if the final invoice needs to be different from the quote?',
        answer:
          'If the scope changed after the quote was accepted — extra work, different materials — explain the difference clearly on the invoice rather than just billing a higher total. A short note referencing the change avoids most disputes.',
      },
      {
        question: 'Do I need to send a quote for every job?',
        answer:
          'Not necessarily — for small or repeat jobs where the price is already understood, going straight to an invoice is common. Quotes matter most for new clients or larger jobs where scope and price need to be agreed upfront.',
      },
    ],
    relatedSlugs: ['estimate-vs-quote', 'how-to-make-an-invoice'],
  },
  {
    slug: 'estimate-vs-quote',
    title: 'Estimate vs Quote: What’s the Difference?',
    description:
      'What an estimate and a quote each mean, when to use one over the other, how they lead to an invoice, and which one to send your customer first.',
    category: 'invoicing',
    readTimeMinutes: 6,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'Estimate and quote get used interchangeably in casual conversation, but they carry different levels of commitment. Mixing them up can either overpromise a price you can’t hold to, or undersell a firm price as if it were negotiable.',
    ],
    sections: [
      {
        heading: 'What an estimate is',
        paragraphs: [
          'An estimate is an approximate price, given when the exact scope isn’t fully known yet — often before a site visit, detailed spec, or full understanding of the work involved. It’s meant to give a client a rough sense of cost, not a number you’re locked into.',
        ],
      },
      {
        heading: 'What a quote is',
        paragraphs: [
          'A quote is a fixed, specific price for defined work, given once you know exactly what’s involved. Unlike an estimate, a quote is generally treated as a firm commitment once the client accepts it.',
        ],
      },
      {
        heading: 'How to decide which to send',
        paragraphs: [
          'If you can’t fully scope the work yet — the details depend on something you haven’t assessed, like the condition of a property or the state of an existing codebase — send an estimate and be explicit that the number may change. Once you’ve nailed down the scope, follow up with a firm quote before work begins.',
        ],
      },
      {
        heading: 'The typical progression',
        paragraphs: ['Most transactions with any complexity move through some or all of these stages:'],
        bullets: [
          'Estimate — a rough number, given early, with a caveat that it may change',
          'Quote — a fixed number, given once scope is clear, that the client formally accepts',
          'Invoice — a request for payment, sent once the agreed work is done or due',
        ],
      },
    ],
    faq: [
      {
        question: 'Can an estimate turn into a quote later?',
        answer:
          'Yes, and it’s standard practice — once you’ve confirmed the scope, follow up with a firm quote that either matches or refines the original estimate, and explain any significant difference.',
      },
      {
        question: 'Is an estimate binding?',
        answer:
          'No, not in the way a quote is — an estimate is explicitly approximate, which is why it’s worth stating clearly on the document that the number may change once the full scope is known.',
      },
      {
        question: 'Why not just always send a quote to avoid confusion?',
        answer:
          'Because giving a firm price before you actually know the scope risks either underquoting (and eating the cost yourself) or overquoting (and losing the job to a competitor with a more accurate number). An estimate is the more honest option when real uncertainty exists.',
      },
      {
        question: 'Do estimates and quotes need different numbering?',
        answer:
          'It’s clearer if they do — separate prefixes (like "EST-" and "Q-") make it easy to tell which stage a document represents when a client refers back to "the number you gave me."',
      },
    ],
    relatedSlugs: ['quote-vs-invoice', 'how-to-make-an-invoice'],
  },
  {
    slug: 'invoice-vs-receipt',
    title: 'Invoice vs Receipt: What’s the Difference?',
    description:
      'Invoice vs receipt, explained simply: an invoice asks for payment, a receipt proves it. Learn when to use each, what to include, and how they fit together.',
    category: 'invoicing',
    readTimeMinutes: 6,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'An invoice and a receipt often list nearly identical information — client name, items, amount — which is exactly why they get confused. The difference isn’t in what they contain, it’s in when they’re issued and what they prove.',
    ],
    sections: [
      {
        heading: 'What an invoice proves',
        paragraphs: [
          'An invoice is a request for payment — it states what’s owed and asks the client to pay it. Sending one doesn’t mean payment has happened; it means payment is expected, by a stated due date.',
        ],
      },
      {
        heading: 'What a receipt proves',
        paragraphs: [
          'A receipt is confirmation that payment has already been made. It’s issued after the fact, as proof for the client’s own records — for expense tracking, reimbursement, warranty claims, or tax purposes.',
        ],
      },
      {
        heading: 'Do you need to send both?',
        paragraphs: [
          'For most invoiced work, yes — send the invoice to request payment, then a short receipt once it clears, especially for larger amounts or clients who need it for their own bookkeeping. For smaller point-of-sale transactions where payment happens immediately, a receipt alone is standard and an invoice usually isn’t needed.',
        ],
      },
      {
        heading: 'What each should include',
        paragraphs: ['Both share a similar core, with one key difference in what they confirm:'],
        bullets: [
          'Invoice — business and client details, itemized charges, total due, due date, payment instructions',
          'Receipt — the same core details, plus confirmation of the payment method and date payment was received, and typically no due date since it’s already settled',
        ],
      },
    ],
    faq: [
      {
        question: 'Can one document serve as both an invoice and a receipt?',
        answer:
          'Not cleanly — an invoice implies payment is still pending, and a receipt implies it’s already made. Some tools mark a paid invoice as "Paid" instead of issuing a separate receipt, which works for simple cases, but a formal receipt is clearer when the client needs one for their own records.',
      },
      {
        question: 'Is a receipt required by law?',
        answer:
          'In many places, yes, for certain transaction types or amounts, though requirements vary widely by country and business type. Check your local regulations if you’re unsure whether it applies to you.',
      },
      {
        question: 'What if a client asks for a receipt for an invoice they haven’t paid yet?',
        answer:
          'You can’t accurately issue one — a receipt confirms payment received, so issuing it before payment clears misrepresents the transaction. Politely clarify that a receipt will follow once payment is confirmed.',
      },
      {
        question: 'Do freelancers need to issue receipts?',
        answer:
          'It’s good practice even when not strictly required — it gives the client clean documentation for their own accounting and reduces "did I actually pay this?" questions later.',
      },
    ],
    relatedSlugs: ['receipt', 'how-to-make-an-invoice'],
  },
  {
    slug: 'invoice-statuses',
    title: 'Invoice Statuses Explained: Draft, Sent, Overdue, Paid, Void',
    description:
      'Draft, sent, overdue, paid, void — learn what every invoice status means and exactly what to do next at each stage of the invoice lifecycle.',
    category: 'invoicing',
    readTimeMinutes: 6,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'An invoice status is a quick label for where a payment stands, and keeping them accurate is what makes an accounts receivable list useful instead of just a pile of PDFs. Most invoicing systems use some version of the same handful of statuses.',
    ],
    sections: [
      {
        heading: 'Draft',
        paragraphs: [
          'The invoice exists but hasn’t been sent yet — you can still edit anything freely. Nothing about a draft is binding, and it shouldn’t be counted in your expected income until it actually goes out.',
        ],
      },
      {
        heading: 'Sent',
        paragraphs: [
          'The invoice has gone to the client and the payment clock — whatever your terms specify — has started. At this point, avoid changing line items or amounts without a clear conversation with the client, since it now represents an agreed request for payment.',
        ],
      },
      {
        heading: 'Overdue',
        paragraphs: [
          'The due date has passed with no payment recorded. This status is your trigger to start (or continue) your follow-up process — a reminder, then escalating steps if it stretches on.',
        ],
      },
      {
        heading: 'Partially paid',
        paragraphs: [
          'Some, but not all, of the invoice amount has been received — common with deposits, installment plans, or a client paying in parts. Track the remaining balance clearly so it doesn’t get mistaken for either fully paid or fully outstanding.',
        ],
      },
      {
        heading: 'Paid',
        paragraphs: [
          'Full payment has been received and confirmed. This closes the invoice out of your active accounts receivable — it’s worth issuing a receipt at this point if the client needs one.',
        ],
      },
      {
        heading: 'Void / cancelled',
        paragraphs: [
          'The invoice is no longer valid — issued in error, superseded by a corrected one, or cancelled by agreement. Don’t delete a voided invoice or reuse its number; mark it void and move on, so your numbering sequence and records stay intact for anyone auditing them later.',
        ],
      },
    ],
    faq: [
      {
        question: 'What’s the difference between "void" and "cancelled"?',
        answer:
          'Different tools use the terms slightly differently, but both generally mean the invoice is no longer active or expected to be paid. The key practice either way is the same: don’t delete it or reuse its number.',
      },
      {
        question: 'Should a partially paid invoice show as overdue if the remaining balance is late?',
        answer:
          'Ideally, yes — many systems track these as separate states, or show "partially paid, overdue balance," so it’s clear both that some payment came in and that the rest is still late.',
      },
      {
        question: 'Can I edit an invoice after marking it sent?',
        answer:
          'Technically often yes, but it’s bad practice unless you clearly communicate the change to the client — an invoice they already have a copy of shouldn’t silently change on your end.',
      },
      {
        question: 'How long should a paid invoice stay in my records?',
        answer:
          'Retention requirements vary by jurisdiction and business type, but many businesses keep records for several years for tax and audit purposes. Check your local requirements for a specific number.',
      },
    ],
    relatedSlugs: ['invoice-aging-report', 'invoice-number-guide'],
  },
  {
    slug: 'credit-notes',
    title: 'Credit Notes: What They Are and When to Issue One',
    description:
      'What a credit note is, when to issue one, and how it differs from an invoice, refund, and receipt — with examples and a step-by-step template.',
    category: 'invoicing',
    readTimeMinutes: 6,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-16',
    intro: [
      'A credit note is a document that reduces what a client owes — or records money owed back to them — without editing the original invoice. It’s the standard way to correct an invoice after it’s been sent, especially once it’s already been recorded in either party’s books.',
    ],
    sections: [
      {
        heading: 'Common reasons to issue one',
        paragraphs: ['A few situations call for a credit note rather than simply editing the original invoice:'],
        bullets: [
          'An invoice was overcharged or had a pricing error',
          'Goods were returned, or work was cancelled after invoicing',
          'A discount is being applied after the invoice was already sent',
          'The original invoice needs to be voided and reissued',
        ],
      },
      {
        heading: 'How it differs from a refund and a receipt',
        paragraphs: [
          'A credit note adjusts the amount owed — it doesn’t necessarily mean money changed hands. A refund is the actual return of money already paid. A receipt confirms payment was made. If a client already paid the full invoice and you owe them money back, you typically issue both a credit note (documenting the adjustment) and process the actual refund.',
        ],
      },
      {
        heading: 'What to include',
        paragraphs: ['A credit note should clearly reference what it’s correcting:'],
        bullets: [
          'A unique credit note number, separate from your invoice sequence',
          'The original invoice number it relates to',
          'The reason for the credit',
          'The amount being credited, itemized the same way the original invoice was',
        ],
      },
      {
        heading: 'Why not just edit the original invoice',
        paragraphs: [
          'Once an invoice has been sent — and especially once it’s been recorded in accounting systems on either side — editing it directly breaks the audit trail. A credit note keeps both the original record and the correction visible, which matters for bookkeeping, taxes, and simply avoiding confusion if anyone looks back at the history.',
        ],
      },
    ],
    faq: [
      {
        question: 'Does a credit note always mean a refund is due?',
        answer:
          'No — it depends on whether the client already paid. If they haven’t paid yet, a credit note simply reduces what they owe on the original invoice. If they already paid, it usually accompanies an actual refund or is applied as credit toward a future invoice.',
      },
      {
        question: 'Can a credit note be for more than the original invoice amount?',
        answer:
          'Generally no — a credit note should reference and reduce a specific, existing invoice, so it shouldn’t exceed what that invoice charged. A separate issue needs its own document.',
      },
      {
        question: 'Is a credit note the same as a credit memo?',
        answer:
          'Yes — they’re the same document under different regional naming conventions, more commonly "credit memo" in North America and "credit note" in the UK, Europe, and much of the rest of the world. Some accounting software picks one term and uses it regardless of region, which is often where the confusion starts.',
      },
      {
        question: 'Is a credit memo different from a debit memo?',
        answer:
          'Yes — a credit memo (or credit note) reduces what’s owed, while a debit memo increases it, for example to bill for an undercharge on a prior invoice. They serve opposite purposes despite the similar name.',
      },
      {
        question: 'Do credit notes need their own numbering sequence?',
        answer:
          'It’s clearer if they do — a separate sequence (like "CN-") makes it obvious at a glance which documents are corrections versus original invoices.',
      },
    ],
    relatedSlugs: ['invoice-disputes', 'invoice-vs-receipt'],
  },
  {
    slug: 'purchase-order',
    title: 'What Is a Purchase Order? A Plain-English Guide',
    description:
      'What a purchase order is, how POs work, what they include, and how they differ from quotes and invoices — with a real example.',
    category: 'invoicing',
    readTimeMinutes: 6,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'A purchase order (PO) is a document a buyer sends to a seller to formally authorize a purchase before it happens. It’s more common in B2B transactions and larger organizations than in typical freelance or small-business invoicing, but it’s worth understanding if you ever work with clients who use them.',
    ],
    sections: [
      {
        heading: 'What a purchase order includes',
        paragraphs: ['A PO typically covers the same core details as a quote, framed as an authorization rather than a proposal:'],
        bullets: [
          'A unique PO number',
          'What’s being purchased — items or services, quantities, and agreed price',
          'Delivery or completion terms',
          'The buyer’s billing and shipping details',
        ],
      },
      {
        heading: 'How POs work in practice',
        paragraphs: [
          'A buyer’s internal team issues a PO once a purchase is approved, often after receiving a quote from the seller. The seller then fulfills the order and references the PO number on their invoice, which the buyer’s accounts payable team matches against the original PO to confirm everything lines up before paying.',
        ],
      },
      {
        heading: 'When you actually need one',
        paragraphs: [
          'Most freelancers and small businesses never issue POs themselves — you’re more likely to receive one from a client, especially a larger company with a formal procurement process. If a client mentions a PO number, include it prominently on your invoice; without it, their accounts payable system may reject or delay the payment entirely.',
        ],
      },
      {
        heading: 'Why larger companies rely on them',
        paragraphs: [
          'POs give a company internal control over spending — approving the purchase before it happens, rather than discovering it after an invoice arrives. For a vendor, having a PO in hand also reduces payment disputes, since it’s documented proof the purchase was authorized in advance.',
        ],
      },
    ],
    faq: [
      {
        question: 'Do freelancers need to issue purchase orders?',
        answer:
          'Rarely — POs are mainly used by buyers with formal procurement processes, most often larger companies. As a freelancer or small business, you’re more likely to receive one than to issue one.',
      },
      {
        question: 'What happens if I invoice a company without referencing their PO number?',
        answer:
          'Many companies’ accounts payable systems will reject or hold the invoice until it references a valid, matching PO number — always check whether a client uses PO numbers before invoicing them for the first time.',
      },
      {
        question: 'Is a purchase order the same as a contract?',
        answer:
          'Not exactly, though it often functions similarly — a PO is generally considered a binding commitment to purchase once accepted, but it’s typically narrower and more transactional than a full contract.',
      },
      {
        question: 'Can a purchase order amount differ from the final invoice?',
        answer:
          'It shouldn’t without explanation — if the final invoice differs from the PO amount, it will likely get flagged during the buyer’s matching process, so any difference needs to be communicated and approved before invoicing.',
      },
    ],
    relatedSlugs: ['purchase-order-vs-invoice', 'quote-vs-invoice'],
  },
  {
    slug: 'purchase-order-vs-invoice',
    title: 'Purchase Order vs Invoice: What’s the Difference?',
    description:
      'Purchase order vs invoice explained simply: the buyer sends the PO to authorize a purchase, the seller sends the invoice to request payment.',
    category: 'invoicing',
    readTimeMinutes: 5,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'A purchase order and an invoice move in opposite directions between the same two parties — the buyer issues the PO, the seller issues the invoice — and understanding that flow clears up most of the confusion between them.',
    ],
    sections: [
      {
        heading: 'Who sends what',
        paragraphs: [
          'A purchase order is created and sent by the buyer, authorizing a purchase before it happens. An invoice is created and sent by the seller, requesting payment after the goods or services are delivered (or due). They document the same transaction from opposite sides of it.',
        ],
      },
      {
        heading: 'How they connect',
        paragraphs: [
          'In a PO-based workflow, the seller references the buyer’s PO number on the invoice, and the buyer’s accounts payable team checks that the invoice matches the original PO — same items, same price — before releasing payment. This "PO matching" is largely why invoices to companies using POs get rejected if the number is missing or the amounts don’t align.',
        ],
      },
      {
        heading: 'When a PO isn’t involved',
        paragraphs: [
          'Most small transactions — freelance work, small-business services, direct-to-consumer sales — skip the PO step entirely and go straight from quote (or no formal quote at all) to invoice. POs mainly show up with larger organizations that have a formal procurement process requiring pre-approval of spending.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can I send an invoice without a purchase order?',
        answer:
          'Yes, for most clients — a PO is only required if the buyer’s process specifically calls for one. Many small businesses and individual clients never use POs at all.',
      },
      {
        question: 'What if my invoice total doesn’t match the PO?',
        answer:
          'Flag and explain the difference before invoicing if possible — an unexplained mismatch is one of the most common reasons a corporate accounts payable team delays or rejects payment.',
      },
      {
        question: 'Does a purchase order guarantee I’ll get paid?',
        answer:
          'It significantly improves the odds, since it represents pre-approved spending, but payment still depends on you delivering as agreed and invoicing correctly against it — a PO isn’t itself a payment.',
      },
      {
        question: 'Do I need a new PO for every invoice?',
        answer:
          'Depends on the buyer’s process — some POs cover a single purchase, others (called blanket or standing POs) authorize multiple invoices over time up to a set limit. Check with the client which applies.',
      },
    ],
    relatedSlugs: ['purchase-order', 'quote-vs-invoice'],
  },
  {
    slug: 'receipt',
    title: 'What Is a Receipt? When to Issue One and What to Include',
    description:
      'What a receipt is, when to issue one, what to include, and how it differs from an invoice and a payment confirmation — with a sample receipt and template.',
    category: 'invoicing',
    readTimeMinutes: 6,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'A receipt is proof that a specific payment was made. It exists for the payer’s benefit as much as the seller’s — it’s what a client attaches to an expense report, uses for a warranty claim, or keeps for their own tax records.',
    ],
    sections: [
      {
        heading: 'When to issue one',
        paragraphs: [
          'Issue a receipt any time a payment is completed, whether that’s an in-person sale, an online payment, or the final payment on an invoice you sent earlier. For recurring or high-value clients, sending one automatically without being asked is a small professionalism signal that saves them from having to request it.',
        ],
      },
      {
        heading: 'What to include',
        paragraphs: ['A useful receipt covers enough detail for the payer to use it in their own records:'],
        bullets: [
          'Your business name and contact details',
          'The date payment was received',
          'What was paid for — itemized if it was for multiple things',
          'The amount paid and the payment method used',
          'A reference to the original invoice number, if there was one',
        ],
      },
      {
        heading: 'Receipt vs invoice vs payment confirmation',
        paragraphs: [
          'An invoice requests payment; a receipt confirms it happened. A "payment confirmation" — often an automated email from a payment processor — is similar to a receipt but usually thinner on detail and generated by the processor rather than by you, so it’s worth still sending your own receipt for anything that needs to look official on your letterhead.',
        ],
      },
      {
        heading: 'Digital vs paper',
        paragraphs: [
          'A digital receipt (PDF or email) is standard and sufficient for the vast majority of small-business transactions. Paper receipts are mostly relevant for in-person retail settings, and even there, digital options are increasingly common and preferred by many customers.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is a receipt legally required?',
        answer:
          'Requirements vary by country and transaction type — some jurisdictions mandate receipts above certain amounts or for specific industries. Check your local rules if you’re unsure whether it applies to your business.',
      },
      {
        question: 'Can a paid invoice double as a receipt?',
        answer:
          'Some tools mark an invoice as "Paid" and treat that as sufficient, which works for informal cases. A proper receipt — with the payment date and method explicitly confirmed — is clearer when the client needs formal documentation.',
      },
      {
        question: 'Do I need to issue a receipt for every payment method?',
        answer:
          'Yes — regardless of whether payment came by card, bank transfer, cash, or another method, the client benefits from the same confirmation for their own records.',
      },
      {
        question: 'What if a client loses their receipt and asks for another?',
        answer:
          'Resend it — since a receipt is a record of a completed transaction, there’s no issue with reissuing a copy as long as your own records confirm the original payment.',
      },
    ],
    relatedSlugs: ['invoice-vs-receipt', 'how-to-make-an-invoice'],
  },
  {
    slug: 'commercial-invoice',
    title: 'Commercial Invoice: What It Is and When You Need One',
    description:
      'What a commercial invoice is, when it’s required, and every field it must include — so your international shipments clear customs without delays.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'A commercial invoice is a specific type of invoice required for shipping goods internationally — customs authorities use it to determine duties, taxes, and whether the shipment is allowed through at all. It’s more detailed than a standard invoice because it has to satisfy a regulatory purpose, not just a payment one.',
    ],
    sections: [
      {
        heading: 'Why customs needs it',
        paragraphs: [
          'Customs authorities can’t assess duties or verify what’s crossing the border without a clear, standardized description of the goods, their value, and their origin. A commercial invoice is the primary document they use to make that assessment, alongside any other required shipping paperwork.',
        ],
      },
      {
        heading: 'What it must include',
        paragraphs: ['Beyond the basics of a regular invoice, a commercial invoice generally needs:'],
        bullets: [
          'A detailed description of each item, including material and intended use where relevant',
          'The country of origin for the goods',
          'The Harmonized System (HS) code, if you use one, for tariff classification',
          'The declared value of each item, in the agreed currency',
          'Shipping terms (Incoterms) such as FOB or CIF',
          'Total weight and number of packages',
        ],
      },
      {
        heading: 'How it differs from a regular invoice',
        paragraphs: [
          'A regular invoice is meant for the buyer, focused on price and payment. A commercial invoice is meant for customs as much as the buyer, which is why it needs origin, classification, and shipping-term details that a domestic invoice never has to include.',
        ],
      },
      {
        heading: 'Common mistakes that delay customs',
        paragraphs: [
          'Vague item descriptions ("goods," "samples") without specifics are one of the most common causes of a shipment getting held for review. Missing HS codes, an undeclared or understated value, or a mismatch between the invoice and the packing list are the other frequent culprits — double-check all three before shipping.',
        ],
      },
    ],
    faq: [
      {
        question: 'Do I need a commercial invoice for every international shipment?',
        answer:
          'For most commercial (non-personal) international shipments, yes. Personal gifts or samples below certain value thresholds sometimes have simplified requirements, which vary by destination country.',
      },
      {
        question: 'Is a commercial invoice the same as a pro forma invoice?',
        answer:
          'No — a pro forma invoice is typically sent before shipment as an estimate for the buyer (and sometimes for advance customs clearance), while the commercial invoice is the final, accurate document that actually accompanies the shipment.',
      },
      {
        question: 'What happens if the declared value on a commercial invoice is wrong?',
        answer:
          'It can lead to incorrect duty assessment, shipment delays, fines, or the shipment being held entirely — customs authorities take declared value seriously, and understating it to reduce duties is a compliance risk, not a savings strategy.',
      },
      {
        question: 'Who fills out the commercial invoice — the buyer or the seller?',
        answer:
          'The seller (exporter) prepares it, since they have the details about what’s being shipped, its value, and its origin. It typically travels with the shipment and is presented to customs on the receiving end.',
      },
    ],
    relatedSlugs: ['pro-forma-invoice', 'how-to-make-an-invoice'],
  },
  {
    slug: 'pro-forma-invoice',
    title: 'Pro Forma Invoice: What It Is and When to Use One',
    description:
      'A pro forma invoice communicates expected costs before payment is due. Learn what it is, when to use one, what to include, and how it differs from an invoice.',
    category: 'invoicing',
    readTimeMinutes: 6,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'A pro forma invoice looks like a regular invoice but isn’t a request for payment — it’s a preliminary statement of expected costs, sent before a final invoice is due. Think of it as a formalized quote that’s laid out in invoice format for situations where that format is expected or required.',
    ],
    sections: [
      {
        heading: 'Common uses',
        paragraphs: ['A pro forma invoice shows up in a few recurring situations:'],
        bullets: [
          'Before an international shipment, so the buyer can arrange financing or advance customs paperwork before the goods actually ship',
          'For a new client who wants a formal cost breakdown before committing, similar to a detailed quote',
          'Internally, so a buyer’s finance team can pre-approve an expense before the real invoice arrives',
        ],
      },
      {
        heading: 'How it differs from a regular invoice',
        paragraphs: [
          'A pro forma invoice isn’t a legally binding demand for payment and typically isn’t recorded as a receivable in accounting — it’s explicitly a preview. It should be clearly labeled "Pro Forma Invoice" so it isn’t mistaken for the real thing, since the actual amount due can still change before the final invoice is issued.',
        ],
      },
      {
        heading: 'How it differs from a quote',
        paragraphs: [
          'A quote is typically a simpler, less formal document focused purely on price. A pro forma invoice mirrors the structure of a full invoice — itemized charges, taxes, totals, sometimes shipping details — which makes it more useful when the buyer’s process specifically requires an invoice-shaped document before the real one exists.',
        ],
      },
      {
        heading: 'Converting it to a final invoice',
        paragraphs: [
          'Once the transaction is confirmed — the shipment goes out, the client accepts, the order is fulfilled — issue a standard invoice referencing the pro forma, with the same numbering pattern making the connection obvious (e.g. "PF-014" becoming "INV-014"). Update any details that changed between the two.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is a pro forma invoice legally binding?',
        answer:
          'Generally no — it’s meant as a preliminary estimate, not an enforceable demand for payment, which is part of why it should always be clearly labeled as "pro forma" to avoid confusion.',
      },
      {
        question: 'Can the final invoice amount differ from the pro forma?',
        answer:
          'Yes, and this is expected — a pro forma invoice is a good-faith estimate, and figures like final shipping costs, taxes, or exchange rates can shift by the time the real invoice is issued.',
      },
      {
        question: 'Should a pro forma invoice be recorded in my accounting as a receivable?',
        answer:
          'No — since it’s not a binding request for payment, it typically shouldn’t be recorded as income or an outstanding receivable. Only the final invoice should hit your books that way.',
      },
      {
        question: 'Do I need a pro forma invoice for domestic transactions?',
        answer:
          'Less commonly — it’s most useful for international shipping (for customs or financing purposes) or for clients who specifically request a formal cost breakdown before agreeing to proceed.',
      },
    ],
    relatedSlugs: ['commercial-invoice', 'quote-vs-invoice'],
  },
  {
    slug: 'recurring-invoices',
    title: 'Recurring Invoices: How to Automate Billing for Repeat Clients',
    description:
      'What recurring invoices are, when to use them, and how to automate billing to get paid on time. A practical guide for freelancers and small businesses.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'A recurring invoice is one that goes out automatically on a set schedule — weekly, monthly, quarterly — without you having to rebuild it from scratch each time. It’s the right tool any time you charge the same client the same (or a predictable) amount on a repeating basis.',
    ],
    sections: [
      {
        heading: 'When recurring invoices make sense',
        paragraphs: [
          'Retainers, subscriptions, ongoing maintenance contracts, and any fixed-fee monthly engagement are natural fits. If the amount and timing are predictable — even if it varies slightly month to month — automating the invoice removes a small but recurring task from your plate and prevents the "oh, I forgot to invoice them" gap that quietly delays your own cash flow.',
        ],
      },
      {
        heading: 'What to set up once',
        paragraphs: ['A recurring invoice template needs a few things decided upfront:'],
        bullets: [
          'The billing frequency and the exact day it goes out',
          'The line items and amount — fixed, or a default that you adjust when needed',
          'Payment terms and due date offset (e.g. due 15 days after each issue date)',
          'Whether it sends automatically or generates as a draft for you to review first',
        ],
      },
      {
        heading: 'Auto-send vs review-first',
        paragraphs: [
          'Auto-send is fine for genuinely fixed amounts, like a flat monthly retainer. For anything with variable line items — hours worked, usage-based charges — a review step before sending catches errors before the client sees them, at the cost of a small manual step each cycle.',
        ],
      },
      {
        heading: 'Handling changes mid-cycle',
        paragraphs: [
          'When a client’s scope or rate changes, update the recurring template going forward rather than trying to retroactively adjust past invoices. If a change happens mid-period, it’s usually cleanest to prorate that one cycle manually and let the template resume as normal afterward.',
        ],
      },
      {
        heading: 'Keeping clients informed',
        paragraphs: [
          'Even automated invoices benefit from a heads-up before the first one goes out, and a note whenever the amount changes — clients are far less likely to dispute or delay a recurring charge they were expecting than one that appears to shift unexpectedly.',
        ],
      },
    ],
    faq: [
      {
        question: 'What’s the difference between a recurring invoice and a subscription?',
        answer:
          'They overlap heavily — a subscription usually implies automatic payment collection as well as automatic invoicing, while a recurring invoice may still require the client to actively pay each time. Many tools support both, or let you add auto-charge on top of a recurring invoice.',
      },
      {
        question: 'Should I automate sending, or just automate creating the invoice?',
        answer:
          'For fixed amounts with a reliable client, full automation works well. For variable amounts, having the invoice generated as a draft that you review and send manually is safer — it adds a checkpoint before an error goes out.',
      },
      {
        question: 'How do I handle a client who wants to pause a recurring invoice temporarily?',
        answer:
          'Pause the recurring schedule rather than deleting and recreating it later — most invoicing tools let you suspend a recurring series and resume it on the original template when the client is ready again.',
      },
      {
        question: 'What happens if a recurring invoice fails to send?',
        answer:
          'Check it periodically rather than assuming automation is infallible — a bounced email address or an expired payment link can cause a cycle to silently fail, and depending on your tool, you may not get notified unless you check.',
      },
    ],
    relatedSlugs: ['retainer-agreements', 'customer-statements'],
  },
  {
    slug: 'customer-statements',
    title: 'Customer Statements: What They Are and When to Send Them',
    description:
      'What a customer statement is, how it differs from an invoice, what to include, and when to send one so you get paid faster on outstanding balances.',
    category: 'invoicing',
    readTimeMinutes: 6,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'A customer statement is a summary of all the activity on a client’s account over a period — every invoice issued, every payment received, and the running balance — rather than a single transaction. It’s most useful for clients you bill repeatedly, where a single invoice doesn’t give the full picture of what’s owed.',
    ],
    sections: [
      {
        heading: 'How it differs from an invoice',
        paragraphs: [
          'An invoice requests payment for one transaction or billing period. A statement summarizes an account across multiple invoices and payments over time, showing what’s still outstanding in total rather than line-item detail for a single job. Think of an invoice as one entry and a statement as the ledger.',
        ],
      },
      {
        heading: 'What to include',
        paragraphs: ['A useful statement covers the full picture for the period, not just the current balance:'],
        bullets: [
          'Every invoice issued in the period, with date and amount',
          'Every payment received, with date and amount applied',
          'The running and closing balance',
          'Any invoices that are now overdue, flagged clearly',
        ],
      },
      {
        heading: 'When to send one',
        paragraphs: [
          'Monthly is the most common cadence for clients with regular, ongoing billing. Statements are also useful reactively — when a client asks "what do I currently owe you across everything," a statement answers that in one document instead of them piecing it together from several invoices.',
        ],
      },
      {
        heading: 'Why they help with collections',
        paragraphs: [
          'A statement showing a growing, unresolved balance across multiple overdue invoices tends to prompt action faster than any single reminder — it makes the total impact visible in a way that one invoice at a time doesn’t. It’s a useful escalation step for clients who are quietly falling behind across several invoices rather than missing just one.',
        ],
      },
    ],
    faq: [
      {
        question: 'Do I need to send statements to every client?',
        answer:
          'No — they’re most valuable for clients you invoice repeatedly and who might lose track of the running total. A client you bill once for a single project doesn’t need a statement; the invoice itself is enough.',
      },
      {
        question: 'Can a statement replace individual invoices?',
        answer:
          'No — a statement summarizes invoices that were already issued; it doesn’t replace the need to invoice for the underlying work. Statements and invoices serve different purposes and are typically both used together.',
      },
      {
        question: 'What if a client disputes a balance shown on a statement?',
        answer:
          'Point them back to the specific invoice(s) in question — since a statement is a summary, resolving a dispute usually requires looking at the underlying invoice detail rather than the statement itself.',
      },
      {
        question: 'Should statements show paid invoices too, or only what’s outstanding?',
        answer:
          'Showing both gives a more complete picture and reduces confusion — a statement with only outstanding items can look inflated if a client doesn’t realize some invoices from the period were already settled.',
      },
    ],
    relatedSlugs: ['recurring-invoices', 'invoice-aging-report'],
  },
  {
    slug: 'invoice-deposits',
    title: 'Invoice Deposits: How to Request Upfront Payment the Right Way',
    description:
      'When and how to request invoice deposits and partial payments, how much to ask for, and sample wording to get paid upfront without losing clients.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'A deposit is a portion of the total project cost paid upfront, before work begins. It protects your cash flow, filters out clients who aren’t serious, and means that even in a worst-case non-payment scenario, you’re not out the full value of the work.',
    ],
    sections: [
      {
        heading: 'When to ask for one',
        paragraphs: [
          'Deposits make the most sense for larger projects, new clients without an established payment history, custom work that can’t easily be resold if the client backs out, or any job where non-payment on the full amount would genuinely hurt your cash flow. Smaller, quick jobs for repeat clients usually don’t need one.',
        ],
      },
      {
        heading: 'How much to ask for',
        paragraphs: [
          'A common range is 25–50% of the total project cost, though it varies by industry and project size. Larger or longer projects sometimes use a three-part split — deposit, milestone payment, final payment — rather than just deposit and balance.',
        ],
      },
      {
        heading: 'How to introduce it without friction',
        paragraphs: [
          'State the deposit requirement in your proposal, before the client has committed — not as a surprise once they’ve already said yes. Framing it as standard practice ("I require a 30% deposit to begin work on all new projects") reads as normal business process, not as distrust of that specific client.',
        ],
      },
      {
        heading: 'Sample wording',
        paragraphs: [
          '"To begin work, I require a deposit of [amount/percentage], due before the project start date. The remaining balance of [amount] is due upon completion, per the terms outlined above." Keep it short and matter-of-fact — over-explaining a deposit request can make it feel more negotiable than it’s meant to be.',
        ],
      },
      {
        heading: 'What happens if a client refuses',
        paragraphs: [
          'A client who pushes back hard on a standard, upfront-stated deposit policy is sometimes signaling other issues down the line — cash-flow problems of their own, or a general resistance to clear terms. It’s reasonable to hold your policy for larger or riskier projects rather than waiving it to close the deal.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is a deposit refundable if the client cancels?',
        answer:
          'That depends entirely on what you state in your contract — many businesses make deposits non-refundable (or partially refundable) specifically to compensate for time already committed and turned away from other work. State this explicitly upfront.',
      },
      {
        question: 'What percentage deposit is standard?',
        answer:
          'There’s no universal number — 25–50% is common across many service industries, but it varies by field, project size, and how much risk you’re trying to offset. Larger, longer-timeline projects sometimes use a lower percentage split across more milestones instead.',
      },
      {
        question: 'Should I start work before the deposit clears?',
        answer:
          'Generally no — the point of a deposit is to have funds secured before committing your own time. Starting early undermines the protection it’s meant to provide.',
      },
      {
        question: 'How do I invoice for a deposit versus the final balance?',
        answer:
          'Issue two separate invoices (or one invoice with clearly split milestones) — a deposit invoice due before work starts, and a final invoice for the remaining balance due on completion or per your agreed terms.',
      },
    ],
    relatedSlugs: ['progress-invoicing', 'payment-plans'],
  },
  {
    slug: 'progress-invoicing',
    title: 'Progress Invoicing: How to Bill Large Projects in Stages',
    description:
      'Progress invoicing lets you bill large projects in stages as work is completed — how it works, methods, a worked example, and how it differs from deposits.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'Progress invoicing means billing a project in stages as work is completed, rather than waiting until the entire project is finished to invoice for the full amount. It’s common in construction, large creative or development projects, and any engagement long enough that waiting until the end would strain your cash flow.',
    ],
    sections: [
      {
        heading: 'Why bill in stages',
        paragraphs: [
          'Long projects tie up your time for weeks or months — invoicing only at the end means carrying that cost the entire time with no return until completion. Progress invoicing spreads payment across the project timeline, keeping your cash flow closer to your actual work output.',
        ],
      },
      {
        heading: 'Common methods',
        paragraphs: ['Two structures cover most progress-invoicing setups:'],
        bullets: [
          'Milestone-based — invoice a set amount when specific deliverables or phases are completed (e.g. design phase, development phase, launch).',
          'Percentage-of-completion — invoice a percentage of the total contract value based on how much of the project is estimated to be done, common in construction and larger contracts.',
        ],
      },
      {
        heading: 'A worked example',
        paragraphs: [
          'A $12,000 website project split into three milestones might invoice $4,000 at project kickoff, $4,000 once the design is approved, and the final $4,000 at launch. Each invoice references the same original contract or quote, so the client can see how the payments map to the total.',
        ],
      },
      {
        heading: 'How it differs from a simple deposit',
        paragraphs: [
          'A deposit is a single upfront payment before work starts, with the rest due at the end. Progress invoicing spreads payment across multiple points throughout the project — the two aren’t mutually exclusive; many projects use a deposit to start and then progress invoices tied to milestones after that.',
        ],
      },
      {
        heading: 'Setting it up cleanly',
        paragraphs: [
          'Define the milestones and their associated amounts in the contract or proposal before work starts, not partway through the project. This avoids disputes about when a "phase" is actually complete, since both sides agreed on the definition upfront.',
        ],
      },
    ],
    faq: [
      {
        question: 'What projects are a good fit for progress invoicing?',
        answer:
          'Any project long enough or large enough that waiting until completion to invoice would meaningfully strain your cash flow — typically multi-week or multi-month engagements with clearly definable phases.',
      },
      {
        question: 'What if a milestone is delayed — can I still invoice for it?',
        answer:
          'Only invoice for milestones actually completed, unless your contract specifies a time-based schedule instead of a completion-based one. Invoicing ahead of actual progress risks disputes and undermines the trust the arrangement depends on.',
      },
      {
        question: 'Is progress invoicing only for large companies?',
        answer:
          'No — freelancers and small businesses use it regularly for any sufficiently large project. It’s about project size and duration relative to your cash-flow needs, not the size of your business.',
      },
      {
        question: 'How many milestones is too many?',
        answer:
          'There’s no fixed rule, but too many small milestones create administrative overhead for both sides. Three to five clearly defined milestones is typical for most mid-sized projects.',
      },
    ],
    relatedSlugs: ['invoice-deposits', 'retainer-agreements'],
  },
  {
    slug: 'payment-plans',
    title: 'Payment Plans: How to Offer Installments Without Hurting Cash Flow',
    description:
      'How to offer customer payment plans that improve collections and protect relationships — when to use them, how to structure installments, and sample wording.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'A payment plan splits a total amount owed into scheduled installments rather than one lump sum. Offered proactively, it can make a larger job more affordable for a client and win the business; offered reactively, on an invoice a client can’t pay in full, it can rescue a stalled collection without writing anything off.',
    ],
    sections: [
      {
        heading: 'When to offer one proactively',
        paragraphs: [
          'For large purchases or projects, offering an installment option upfront can be the difference between a client committing now versus delaying indefinitely because the full amount feels like too much at once. This works especially well for high-ticket one-time services or products.',
        ],
      },
      {
        heading: 'When to offer one reactively',
        paragraphs: [
          'If a client is struggling to pay an existing invoice in full, a structured payment plan often recovers more of what you’re owed, faster, than continuing to demand the full amount at once. It also preserves the relationship better than an all-or-nothing standoff that risks ending in no payment at all.',
        ],
      },
      {
        heading: 'Structuring the installments',
        paragraphs: [
          'Keep it simple: a clear number of payments, a fixed amount for each, and specific due dates rather than vague terms like "pay when you can." Getting the first installment upfront, before continuing to extend credit further, reduces your risk if the plan later falls through.',
        ],
      },
      {
        heading: 'Sample wording',
        paragraphs: [
          '"The outstanding balance of [amount] will be paid in [number] installments of [amount] each, due on [dates]. If a scheduled payment is missed, the remaining balance becomes due in full immediately." Putting this in writing — even briefly — protects both sides if there’s a dispute later.',
        ],
      },
      {
        heading: 'What to do if a plan gets missed',
        paragraphs: [
          'Follow up on a missed installment the same way you would a normal overdue invoice — promptly, and without assuming bad faith on the first miss. If it happens repeatedly, it’s reasonable to enforce the "full balance due" clause rather than continuing to extend the same plan indefinitely.',
        ],
      },
    ],
    faq: [
      {
        question: 'Should I charge interest on a payment plan?',
        answer:
          'Some businesses do, especially for larger amounts spread over a longer period, but rules on what’s enforceable vary by jurisdiction. If you do add interest, state it clearly in the written agreement upfront.',
      },
      {
        question: 'How is a payment plan different from Net 30 terms?',
        answer:
          'Net 30 is a single payment due 30 days after the invoice date. A payment plan splits the total across multiple payments over an agreed schedule — it’s a structural difference in how many payments are expected, not just when.',
      },
      {
        question: 'Should I keep delivering work while a client is on a payment plan?',
        answer:
          'For ongoing engagements, it’s reasonable to continue as long as installments are being paid on schedule, and to pause if a payment is missed — treat the plan as the new terms of the relationship, with the same consequences for lateness as any other invoice.',
      },
      {
        question: 'Is it risky to offer a payment plan to a new client?',
        answer:
          'More so than to an established one — for new clients, it’s reasonable to require a larger first installment upfront, or to reserve payment plans for existing clients with a track record, rather than offering them by default to anyone.',
      },
    ],
    relatedSlugs: ['invoice-deposits', 'overdue-invoices'],
  },
  {
    slug: 'retainer-agreements',
    title: 'Retainer Agreements: How They Work and How to Invoice Them',
    description:
      'How retainer agreements work, the main types, how to invoice a retainer, and how they differ from recurring invoices, deposits, and progress invoicing.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'A retainer is an ongoing arrangement where a client pays a set amount, usually monthly, to secure your availability or a defined scope of work over time — rather than paying per individual project or task. It’s common for consultants, agencies, and freelancers with long-term client relationships.',
    ],
    sections: [
      {
        heading: 'Main types of retainers',
        paragraphs: ['Retainers generally take one of a few forms:'],
        bullets: [
          'Retainer for availability — the client pays for guaranteed access to your time, whether or not they use all of it that period (common for consultants and legal/professional services).',
          'Retainer for a defined scope — a fixed monthly fee for a specific, recurring set of deliverables (e.g. a set number of blog posts or hours of support per month).',
          'Retainer against hours — a prepaid bucket of hours that gets drawn down as work happens, sometimes rolling over unused hours, sometimes not.',
        ],
      },
      {
        heading: 'How to invoice a retainer',
        paragraphs: [
          'Most retainers are invoiced the same way each period — same amount, same day, ideally set up as a recurring invoice so it doesn’t need to be manually recreated. If the retainer is hours-based, it’s worth including a brief usage summary alongside the invoice so the client can see what was delivered against the fee.',
        ],
      },
      {
        heading: 'Setting the terms clearly upfront',
        paragraphs: [
          'A retainer agreement should specify what’s included, what happens to unused time or scope (does it roll over, expire, or convert to a credit), and how overages beyond the retainer are billed. Ambiguity here is the most common source of retainer disputes — a client who assumed unused hours would roll over, when your policy says otherwise, is an avoidable conflict.',
        ],
      },
      {
        heading: 'How retainers differ from other billing structures',
        paragraphs: [
          'A recurring invoice is just the mechanism of billing repeatedly — a retainer is the underlying agreement about what that recurring payment covers. Compared to progress invoicing (billing stages of a single project) or a deposit (a one-time upfront payment), a retainer is ongoing by design, without an end date tied to project completion.',
        ],
      },
    ],
    faq: [
      {
        question: 'Do unused retainer hours roll over automatically?',
        answer:
          'Only if your agreement says so — this varies widely by business, and it’s one of the most important terms to state explicitly rather than leaving to assumption on either side.',
      },
      {
        question: 'What happens if a client goes over their retainer scope?',
        answer:
          'State an overage rate or process in the original agreement — a common approach is billing additional hours or deliverables at a standard rate once the retainer’s included scope is exceeded for that period.',
      },
      {
        question: 'Can a retainer be cancelled at any time?',
        answer:
          'Depends on the terms you set — many retainer agreements include a notice period (e.g. 30 days) before either side can end the arrangement, which gives both parties time to plan around the change.',
      },
      {
        question: 'Is a retainer the same as a subscription?',
        answer:
          'They’re similar in billing rhythm but different in nature — a subscription is typically for a product or standardized service tier, while a retainer usually covers a more personalized or negotiated scope of professional work.',
      },
    ],
    relatedSlugs: ['recurring-invoices', 'progress-invoicing'],
  },
  {
    slug: 'cash-flow',
    title: 'Cash Flow: A Plain-English Guide for Small Businesses',
    description:
      'A plain-English guide to small business cash flow — what it is, why it beats profit as a health signal, 10 ways to improve it, and how to forecast it.',
    category: 'invoicing',
    readTimeMinutes: 8,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'Cash flow is the actual money moving in and out of your business, when it moves — not what your invoices say you’ve earned. A business can be profitable on paper and still run out of cash, because profit counts money you’re owed, while cash flow only counts money you actually have.',
    ],
    sections: [
      {
        heading: 'Cash flow vs profit',
        paragraphs: [
          'Profit is revenue minus expenses over a period, regardless of whether that revenue has actually been collected. Cash flow is what’s physically in your account, factoring in the timing of when invoices get paid and bills get paid. A business with $50,000 in unpaid invoices can be "profitable" and still unable to make payroll.',
        ],
      },
      {
        heading: 'Positive vs negative cash flow',
        paragraphs: [
          'Positive cash flow means more money came in than went out over the period — you can cover expenses and have room to reinvest or save. Negative cash flow means the reverse, and while it’s not automatically a crisis (a big upfront expense for a new project is normal), sustained negative cash flow without a clear reason is the earliest warning sign of real trouble.',
        ],
      },
      {
        heading: 'Ten practical ways to improve it',
        paragraphs: ['Most improvements come from either speeding up money coming in or slowing money going out:'],
        bullets: [
          'Invoice immediately when work is done, not in a batch at month-end',
          'Shorten payment terms for new or unreliable clients',
          'Require deposits on larger projects',
          'Send reminders before the due date, not just after',
          'Offer at least one fast, low-friction payment method',
          'Negotiate longer payment terms with your own vendors where possible',
          'Reduce or renegotiate recurring expenses that aren’t earning their cost',
          'Keep a cash buffer for slow months rather than spending every surplus',
          'Chase overdue invoices promptly instead of letting them age',
          'Forecast a few months ahead so a shortfall isn’t a surprise',
        ],
      },
      {
        heading: 'Forecasting cash flow simply',
        paragraphs: [
          'A basic forecast doesn’t need special software: list expected cash in (payments due from current invoices, upcoming work) and expected cash out (bills, payroll, recurring costs) by week or month, and track the running balance. Even a rough forecast gives enough warning to act — delay a purchase, chase an invoice harder, or arrange short-term financing — before a shortfall actually hits.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can a profitable business still fail from poor cash flow?',
        answer:
          'Yes, and it’s a common cause of small-business failure — if money owed to you arrives too slowly relative to when your own bills are due, you can run out of usable cash even while technically profitable on paper.',
      },
      {
        question: 'What’s the single biggest lever for improving cash flow?',
        answer:
          'For most service businesses, it’s getting paid faster on work already done — tighter invoicing habits and reminders usually move the needle more than cutting costs, since the money is already earned, just not yet collected.',
      },
      {
        question: 'How much cash buffer should a small business keep?',
        answer:
          'A commonly cited rule of thumb is three to six months of operating expenses, though the right amount depends on how predictable your revenue is — a business with lumpy, unpredictable income needs a bigger buffer than one with steady recurring revenue.',
      },
      {
        question: 'Is negative cash flow always a bad sign?',
        answer:
          'Not necessarily in a single period — a large one-time investment or seasonal dip can cause temporary negative cash flow that’s expected and planned for. Sustained negative cash flow over multiple periods without a clear cause is the more concerning pattern.',
      },
    ],
    relatedSlugs: ['accounts-receivable', 'working-capital'],
  },
  {
    slug: 'gross-profit-vs-net-profit',
    title: 'Gross Profit vs Net Profit: What’s the Difference?',
    description:
      'Gross profit shows if your work is profitable; net profit shows if your business is. Learn the difference, how to calculate each, and what the margins mean.',
    category: 'invoicing',
    noindex: true,
    readTimeMinutes: 6,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'Gross profit and net profit both answer "did we make money," but at different levels — gross profit looks at whether the work itself was profitable, and net profit looks at whether the whole business was, after everything else is accounted for.',
    ],
    sections: [
      {
        heading: 'Gross profit',
        paragraphs: [
          'Gross profit is revenue minus the direct cost of delivering the work or product — materials, subcontractors, direct labor tied to the job. The formula is simple: Revenue − Cost of Goods Sold (COGS) = Gross Profit. It tells you whether the core work itself is priced profitably, before overhead is factored in.',
        ],
      },
      {
        heading: 'Net profit',
        paragraphs: [
          'Net profit takes gross profit and subtracts everything else — rent, software subscriptions, admin time, marketing, taxes, and every other operating cost. The formula: Gross Profit − Operating Expenses − Taxes = Net Profit. It’s the real bottom line: what’s actually left after running the entire business, not just delivering one job.',
        ],
      },
      {
        heading: 'A worked example',
        paragraphs: [
          'A freelancer bills $10,000 for a project, spending $2,000 on a subcontractor to help deliver it. Gross profit is $8,000 ($10,000 − $2,000), a healthy 80% gross margin. But after $3,000 in monthly overhead (software, a portion of rent, admin time) allocated to that period, net profit drops to $5,000 — still solid, but a very different number from the gross figure.',
        ],
      },
      {
        heading: 'Why the difference matters',
        paragraphs: [
          'A high gross margin with a low net margin usually means overhead is eating your profitability — worth investigating what’s driving fixed costs. A low gross margin means the core pricing or delivery cost of the work itself is the problem, and no amount of cutting overhead will fully fix it; the pricing needs to change.',
        ],
      },
    ],
    faq: [
      {
        question: 'What’s a good gross margin for a service business?',
        answer:
          'It varies widely by industry, but many service businesses with light direct costs (little to no materials or subcontracting) run gross margins of 70% or higher. Businesses with significant subcontractor or material costs run lower.',
      },
      {
        question: 'Can gross profit be positive while net profit is negative?',
        answer:
          'Yes, and it’s a common warning sign — it means individual jobs are profitable on their own, but overhead costs are large enough to erase that profit at the business level. It usually points to cutting fixed costs rather than repricing individual jobs.',
      },
      {
        question: 'Which number should I use to decide if a project was worth taking?',
        answer:
          'Gross profit is the more direct answer for a single project, since it isolates the cost of delivering that specific work. Net profit matters more for evaluating the health of the business as a whole over a period.',
      },
      {
        question: 'Do freelancers need to track gross profit separately from net profit?',
        answer:
          'It’s useful even at a small scale — tracking gross profit per project shows you which types of work are genuinely most profitable, which can get hidden if you only ever look at overall net profit.',
      },
    ],
    relatedSlugs: ['cash-flow', 'how-to-price-your-services'],
  },
  {
    slug: 'how-to-read-financial-statements',
    title: 'How to Read Financial Statements: A Beginner’s Guide',
    description:
      'Learn how to read the income statement, balance sheet, and cash flow statement in plain English — and use them to make smarter business decisions.',
    category: 'invoicing',
    noindex: true,
    readTimeMinutes: 9,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'Financial statements look intimidating mostly because of the terminology, not the underlying ideas. Once you know what each of the three core statements is answering, reading them becomes a lot less like decoding a spreadsheet and more like checking a dashboard.',
    ],
    sections: [
      {
        heading: 'The income statement — "did we make money?"',
        paragraphs: [
          'The income statement (also called a profit and loss statement, or P&L) shows revenue, expenses, and the resulting profit or loss over a period — a month, a quarter, a year. It answers whether the business was profitable during that specific window, moving from total revenue down through costs to a final net profit figure.',
        ],
      },
      {
        heading: 'The balance sheet — "what do we own and owe?"',
        paragraphs: [
          'The balance sheet is a snapshot at a single point in time, not a period — it lists assets (what the business owns, including cash and money owed to it), liabilities (what it owes), and equity (what’s left over for the owner). Assets always equal liabilities plus equity, which is why it’s called a "balance" sheet.',
        ],
      },
      {
        heading: 'The cash flow statement — "where did the cash actually go?"',
        paragraphs: [
          'The cash flow statement tracks actual cash moving in and out, split into operating, investing, and financing activities. It’s the statement that catches the gap between "profitable" (income statement) and "has cash in the bank" (this one), since it strips out non-cash items and timing differences the income statement doesn’t show.',
        ],
      },
      {
        heading: 'How the three connect',
        paragraphs: [
          'Net profit from the income statement flows into equity on the balance sheet. Cash movements from the cash flow statement explain how the cash balance on the balance sheet changed between two points in time. Read together, they answer three different questions that no single statement can answer alone: were we profitable, what do we own and owe, and did we actually have the cash to show for it.',
        ],
      },
      {
        heading: 'Using them to make decisions',
        paragraphs: [
          'A consistently profitable income statement with a shrinking cash balance is a signal to look at accounts receivable — money is being earned but not collected. A healthy cash balance with declining profit margins signals a pricing or cost problem worth addressing before the cash cushion runs out. Checking all three together, even briefly and even for a small business, catches problems earlier than looking at your bank balance alone.',
        ],
      },
    ],
    faq: [
      {
        question: 'Do small businesses and freelancers need all three statements?',
        answer:
          'A full formal set is more relevant once a business has some complexity — inventory, loans, multiple revenue streams. A freelancer or very small business can often get most of the value from a simple income statement and a running cash balance, and add the others as things grow.',
      },
      {
        question: 'What’s the single most useful statement for a small business?',
        answer:
          'The cash flow statement (or even a simplified version of it) tends to be the most immediately actionable, since cash shortfalls are what actually shut a business down — not a bad quarter on paper.',
      },
      {
        question: 'How often should I review my financial statements?',
        answer:
          'Monthly is a common rhythm for small businesses — frequent enough to catch problems early, infrequent enough not to become a burden. Cash flow specifically is often worth checking weekly if things are tight.',
      },
      {
        question: 'Can I generate these statements myself, or do I need an accountant?',
        answer:
          'Most accounting software can generate all three automatically from your recorded transactions. An accountant adds the most value in interpreting them and handling tax implications, rather than in producing the raw statements themselves.',
      },
    ],
    relatedSlugs: ['gross-profit-vs-net-profit', 'cash-flow'],
  },
  {
    slug: 'how-to-price-your-services',
    title: 'How to Price Your Services: A Practical Guide',
    description:
      'How to price your services with confidence — pricing models compared, a step-by-step rate formula, worked examples, and how to raise prices.',
    category: 'invoicing',
    readTimeMinutes: 9,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'Pricing feels like guesswork mostly because it’s treated as one decision instead of two: what model to charge under, and what number to put on it. Get the model right for the type of work, and the number becomes a calculation rather than a gut call.',
    ],
    sections: [
      {
        heading: 'Pricing models compared',
        paragraphs: ['Most service pricing falls into one of these:'],
        bullets: [
          'Hourly — simple and transparent, but penalizes efficiency and caps your income at the hours you can bill.',
          'Project-based (fixed fee) — one price for defined scope, rewarding efficiency but requiring accurate scoping to avoid working for less than your effective rate.',
          'Value-based — priced according to the value delivered to the client rather than time or effort spent, common in high-impact consulting but harder to justify without a track record.',
          'Retainer — a recurring fee for ongoing availability or scope, giving predictable income for both sides.',
        ],
      },
      {
        heading: 'A step-by-step rate formula',
        paragraphs: [
          'Start with your target annual income, add the cost of taxes and benefits you’d otherwise get as an employee, add business overhead (software, insurance, admin time), then divide by your realistic billable hours per year — not total hours, since time spent on admin, sales, and non-billable work doesn’t generate revenue directly.',
        ],
        bullets: [
          'Target income + overhead + taxes = required annual revenue',
          'Realistic billable hours per year (often 1,000–1,400 for full-time freelancers once non-billable time is subtracted)',
          'Required annual revenue ÷ billable hours = your minimum hourly rate',
        ],
      },
      {
        heading: 'A worked example',
        paragraphs: [
          'Targeting $80,000 income, with $15,000 in overhead and taxes, means $95,000 in required revenue. At 1,200 realistic billable hours a year, that’s a minimum rate of about $79/hour — before any markup for market positioning, experience, or demand.',
        ],
      },
      {
        heading: 'Raising prices without losing clients',
        paragraphs: [
          'Give existing clients advance notice — 30 to 60 days is common — and apply new rates to new work or new engagement periods rather than retroactively. Framing it plainly ("rates are increasing to [X], effective [date]") reads as normal business practice; over-justifying it can invite more pushback than a brief, confident notice.',
        ],
      },
      {
        heading: 'Common pricing mistakes',
        paragraphs: [
          'Pricing purely against competitors without knowing your own costs leads to unprofitable rates that look competitive on paper. Underestimating non-billable time (admin, proposals, revisions) when calculating an hourly rate is another frequent error — it quietly erodes what looked like a reasonable number.',
        ],
      },
    ],
    faq: [
      {
        question: 'Should I price by the hour or by the project?',
        answer:
          'Project-based pricing tends to reward efficiency and is easier for clients to budget against, but it requires confidence in scoping the work accurately. Hourly is simpler and lower-risk for unpredictable or open-ended work where scope isn’t fully known upfront.',
      },
      {
        question: 'How often should I revisit my pricing?',
        answer:
          'At least annually, or whenever your costs, demand, or experience level change meaningfully. Letting rates stagnate for years while costs and skill both increase is a common way businesses quietly become underpaid.',
      },
      {
        question: 'Is it okay to charge different clients different rates?',
        answer:
          'Yes, within reason — rates can reasonably vary by project complexity, urgency, client size, and relationship history. What matters is that each individual client’s rate is consistent and justifiable, not that every client pays identically.',
      },
      {
        question: 'How do I know if my prices are too low?',
        answer:
          'Common signs include being consistently fully booked with no room to raise rates, feeling resentful about the work-to-pay ratio, or routinely winning every bid you submit — winning everything usually means you’re underpriced relative to the market.',
      },
    ],
    relatedSlugs: ['gross-profit-vs-net-profit', 'retainer-agreements'],
  },
  {
    slug: 'accounts-receivable',
    title: 'Accounts Receivable: A Plain-English Guide for Small Businesses',
    description:
      'A plain-English guide to accounts receivable for small businesses. Learn the AR process, key metrics, common mistakes, and how to get paid faster.',
    category: 'invoicing',
    readTimeMinutes: 8,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'Accounts receivable (AR) is simply the money owed to you by clients for work already delivered or invoiced — it’s an asset on your books, but an unusual one, since it only becomes real cash once it’s actually collected. Managing AR well is largely about shrinking the gap between "invoiced" and "collected."',
    ],
    sections: [
      {
        heading: 'The basic AR process',
        paragraphs: [
          'The cycle runs: deliver work, issue an invoice, track it as outstanding, follow up as needed, and record payment once received. Every invoice sits in AR from the moment it’s sent until it’s marked paid — the goal is to move it through that cycle as quickly and reliably as possible.',
        ],
      },
      {
        heading: 'Key metrics that describe your AR health',
        paragraphs: ['A few numbers give a fast read on how well your AR is performing:'],
        bullets: [
          'Days Sales Outstanding (DSO) — the average number of days it takes to collect payment after invoicing',
          'AR aging — outstanding invoices grouped by how overdue they are (current, 30, 60, 90+ days)',
          'AR turnover ratio — how many times per period you collect your average AR balance, a measure of collection efficiency',
        ],
      },
      {
        heading: 'Common AR mistakes',
        paragraphs: [
          'The most common failure is simply not reviewing AR regularly — invoices quietly aging past due without anyone noticing until cash gets tight. Others include unclear payment terms, no consistent reminder process, and treating every overdue invoice the same way regardless of how overdue or how large it is.',
        ],
      },
      {
        heading: 'Keeping AR healthy',
        paragraphs: [
          'Review your outstanding invoices on a set schedule — weekly for active freelancers, at least monthly for anyone with a smaller client list. Combine that with clear terms upfront, prompt invoicing, and a reminder sequence, and most AR problems are prevented rather than needing to be fixed after the fact.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is accounts receivable the same as revenue?',
        answer:
          'No — revenue is money earned, whether or not it’s been collected. Accounts receivable is specifically the portion of that revenue still outstanding and not yet paid.',
      },
      {
        question: 'What’s a healthy amount of accounts receivable to carry?',
        answer:
          'There’s no fixed target, but a useful check is whether your AR is aging appropriately for your terms — if most of it sits well past your standard payment terms, that’s the signal to address, more than the raw dollar amount.',
      },
      {
        question: 'How does accounts receivable affect cash flow?',
        answer:
          'Directly — money sitting in AR is money you’ve earned but can’t yet spend. A growing AR balance that isn’t being collected promptly is one of the most common causes of a cash crunch in an otherwise profitable business.',
      },
      {
        question: 'Do I need accounting software to manage accounts receivable?',
        answer:
          'Not necessarily at a small scale — a simple spreadsheet tracking invoice dates, amounts, and status works for a handful of clients. It becomes worth automating once you’re managing enough invoices that manual tracking starts missing things.',
      },
    ],
    relatedSlugs: ['invoice-aging-report', 'days-sales-outstanding'],
  },
  {
    slug: 'invoice-aging-report',
    title: 'Invoice Aging Report: What It Is and How to Use One',
    description:
      'Learn what an invoice aging report is, how to read the aging buckets, and how to use it to prioritize collections and get paid faster — with a sample report.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'An invoice aging report groups your outstanding invoices by how overdue they are, giving you a single view of where collection risk is concentrated instead of scanning through invoices one at a time. It’s one of the simplest tools for keeping accounts receivable from quietly getting out of hand.',
    ],
    sections: [
      {
        heading: 'How the aging buckets work',
        paragraphs: ['Most aging reports use a standard set of buckets based on days past due:'],
        bullets: [
          'Current — not yet due',
          '1–30 days overdue',
          '31–60 days overdue',
          '61–90 days overdue',
          '90+ days overdue',
        ],
      },
      {
        heading: 'Reading the report',
        paragraphs: [
          'A healthy AR position has most of its balance in "current" and "1–30," with little or nothing in the older buckets. A meaningful chunk sitting in "61–90" or "90+" is a clear signal — those invoices need active follow-up or escalation, since the odds of collecting drop the longer an invoice ages.',
        ],
      },
      {
        heading: 'Using it to prioritize collections',
        paragraphs: [
          'Rather than following up on every overdue invoice with the same effort, an aging report lets you focus first on the oldest and largest balances, where the risk of the debt becoming genuinely uncollectible is highest. Smaller, recently overdue invoices are usually lower-effort to resolve with a simple reminder.',
        ],
      },
      {
        heading: 'A simple report structure',
        paragraphs: [
          'For each client, list the total outstanding amount split across the aging buckets, with a grand total at the bottom for each bucket across all clients. Even a basic spreadsheet version — client name, invoice number, amount, and days overdue, sorted by age — delivers most of the value without needing dedicated software.',
        ],
      },
    ],
    faq: [
      {
        question: 'How often should I run an aging report?',
        answer:
          'Weekly is common for businesses with several active clients; monthly is a reasonable minimum for smaller operations. The point is catching invoices as they cross into an older bucket, not reviewing them long after the fact.',
      },
      {
        question: 'What percentage of AR in the 90+ bucket is concerning?',
        answer:
          'There’s no universal threshold, but a bucket that’s growing over time, or holding a disproportionate share of your total AR relative to how much revenue that period represents, is worth investigating regardless of the exact percentage.',
      },
      {
        question: 'Does an aging report include paid invoices?',
        answer:
          'No — it’s specifically a view of outstanding, unpaid invoices. Paid invoices are excluded since they no longer represent collection risk.',
      },
      {
        question: 'Can I build an aging report without accounting software?',
        answer:
          'Yes — a spreadsheet with invoice date, due date, amount, and a formula calculating days overdue can replicate the core function for a small number of clients.',
      },
    ],
    relatedSlugs: ['accounts-receivable', 'days-sales-outstanding'],
  },
  {
    slug: 'days-sales-outstanding',
    title: 'Days Sales Outstanding (DSO): What It Is and How to Reduce It',
    description:
      'What Days Sales Outstanding is, the DSO formula, a worked example, what counts as a good DSO, and practical ways to reduce it and get paid faster.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'Days Sales Outstanding (DSO) measures, on average, how many days it takes you to collect payment after issuing an invoice. It’s one of the clearest single numbers for tracking whether your collections process is getting better or worse over time.',
    ],
    sections: [
      {
        heading: 'The formula',
        paragraphs: [
          'DSO = (Accounts Receivable ÷ Total Credit Sales) × Number of Days in the Period. In plain terms: take what’s currently owed to you, divide by how much you invoiced over the period, and multiply by the number of days in that period.',
        ],
      },
      {
        heading: 'A worked example',
        paragraphs: [
          'If you invoiced $60,000 over a 90-day quarter and currently have $12,000 in outstanding accounts receivable, DSO = ($12,000 ÷ $60,000) × 90 = 18 days. On average, it’s taking about 18 days from invoice to payment.',
        ],
      },
      {
        heading: 'What counts as a good DSO',
        paragraphs: [
          'A useful benchmark isn’t a fixed number — it’s your DSO relative to your stated payment terms. If your standard terms are Net 30 and your DSO is sitting around 25–35, collections are working roughly as intended. A DSO significantly higher than your terms (say, 55 on Net 30 terms) signals a real collections gap worth addressing.',
        ],
      },
      {
        heading: 'How to reduce it',
        paragraphs: ['Most improvements to DSO come from the same levers that speed up any collection:'],
        bullets: [
          'Invoice immediately, not in a batch',
          'Send reminders before the due date, not just after',
          'Offer faster, lower-friction payment methods',
          'Tighten terms for clients with a history of paying slowly',
          'Follow up consistently on invoices as soon as they cross into overdue',
        ],
      },
      {
        heading: 'DSO vs an aging report',
        paragraphs: [
          'DSO gives you one number summarizing overall collection speed — useful for tracking a trend over time. An aging report shows the detail behind that number, breaking outstanding invoices down by client and by how overdue each one is. Use DSO to spot that something’s off, and an aging report to find exactly where.',
        ],
      },
    ],
    faq: [
      {
        question: 'What’s considered a bad DSO?',
        answer:
          'It depends entirely on your payment terms, but a DSO that runs well beyond your stated terms — for example, 60+ days on Net 30 terms — generally indicates a real collections problem rather than normal variation.',
      },
      {
        question: 'Can DSO be too low?',
        answer:
          'Not typically in a way that’s a problem — a very low DSO usually just means clients pay quickly relative to your terms, which is a good outcome, not a warning sign.',
      },
      {
        question: 'How often should I calculate DSO?',
        answer:
          'Monthly or quarterly is common — frequent enough to catch a worsening trend early, without over-reacting to short-term noise from one large invoice or one slow client.',
      },
      {
        question: 'Does DSO account for invoices that will never be paid?',
        answer:
          'Only if they’re still sitting in accounts receivable — once an invoice is written off as bad debt, it should be removed from AR, which will also correct the DSO calculation going forward.',
      },
    ],
    relatedSlugs: ['accounts-receivable-turnover', 'invoice-aging-report'],
  },
  {
    slug: 'accounts-receivable-turnover',
    title: 'Accounts Receivable Turnover Ratio: What It Is and How to Calculate It',
    description:
      'What the accounts receivable turnover ratio is, how to calculate it with a worked example, what counts as a good ratio, and how to improve collections.',
    category: 'invoicing',
    readTimeMinutes: 6,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'The accounts receivable turnover ratio measures how many times, on average, you collect your outstanding receivables over a given period. A higher ratio means you’re converting invoices into cash quickly and repeatedly; a lower ratio means money is sitting uncollected for longer stretches.',
    ],
    sections: [
      {
        heading: 'The formula',
        paragraphs: [
          'AR Turnover = Net Credit Sales ÷ Average Accounts Receivable. Average AR is typically calculated as (starting AR + ending AR) ÷ 2 for the period being measured.',
        ],
      },
      {
        heading: 'A worked example',
        paragraphs: [
          'If your net credit sales for the year were $240,000, and your average accounts receivable over that year was $30,000, your AR turnover ratio is $240,000 ÷ $30,000 = 8. That means you effectively collected your average outstanding balance about 8 times over the year — roughly every 45 days.',
        ],
      },
      {
        heading: 'What counts as a good ratio',
        paragraphs: [
          'A higher ratio is generally better, but "good" depends heavily on your industry and typical payment terms — a business on Net 60 terms will naturally have a lower turnover than one on Due on Receipt, without either being worse at collections. The more useful comparison is your own ratio over time, or against similar businesses with similar terms.',
        ],
      },
      {
        heading: 'How it relates to DSO',
        paragraphs: [
          'AR turnover and Days Sales Outstanding measure the same underlying thing from opposite directions — turnover tells you how many collection cycles happen per period, while DSO tells you the average length of one cycle in days. You can convert between them: roughly, 365 ÷ AR Turnover ≈ DSO.',
        ],
      },
      {
        heading: 'Improving your turnover ratio',
        paragraphs: [
          'The same practices that reduce DSO also raise turnover — faster invoicing, consistent reminders, tighter terms for slow-paying clients, and lower-friction payment options. Improving turnover is really about shrinking the average time each invoice spends outstanding.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is a higher AR turnover ratio always better?',
        answer:
          'Generally yes, up to a point — very high turnover combined with a shrinking client base could mean you’re being overly aggressive with terms and losing business, so it’s worth reading alongside revenue trends, not in isolation.',
      },
      {
        question: 'How is AR turnover different from cash flow?',
        answer:
          'AR turnover specifically measures collection efficiency — how fast you convert receivables into cash. Cash flow is the broader picture of all cash moving in and out of the business, including expenses that turnover doesn’t account for at all.',
      },
      {
        question: 'Should freelancers bother calculating this ratio?',
        answer:
          'It’s more commonly used by larger businesses, but the underlying idea — tracking whether collections are speeding up or slowing down — is useful at any scale, even if you track it informally rather than as a formal ratio.',
      },
      {
        question: 'What causes a declining AR turnover ratio?',
        answer:
          'Usually either looser payment terms, weaker follow-up on overdue invoices, or a growing share of slow-paying clients. Comparing turnover period over period helps catch the decline before it becomes a cash-flow problem.',
      },
    ],
    relatedSlugs: ['days-sales-outstanding', 'accounts-receivable'],
  },
  {
    slug: 'cash-application',
    title: 'Cash Application: How to Match Payments to Invoices',
    description:
      'Cash application is how you match customer payments to the right invoices. Learn how it works, why it matters, and best practices to keep balances accurate.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'Cash application is the process of matching an incoming payment to the specific invoice (or invoices) it’s meant to settle. It sounds obvious until a payment arrives without a clear reference, covers part of one invoice and part of another, or comes in as a lump sum against several open invoices at once.',
    ],
    sections: [
      {
        heading: 'Why it’s not always straightforward',
        paragraphs: [
          'A payment that clearly references an invoice number is easy to apply. Problems show up when a client pays a round number that doesn’t match any single invoice, pays multiple invoices in one transfer, or sends payment with no reference at all — leaving you to guess, or ask, what it’s actually for.',
        ],
      },
      {
        heading: 'Common challenges',
        paragraphs: ['A few situations account for most cash application difficulty:'],
        bullets: [
          'Partial payments that don’t fully close any single invoice',
          'Batch payments covering several invoices in one transfer',
          'Missing or incorrect remittance information (no invoice number referenced)',
          'Small discrepancies from bank fees or currency conversion that make an amount not quite match',
        ],
      },
      {
        heading: 'How to make it easier on yourself',
        paragraphs: [
          'Ask clients to reference the invoice number in the payment description whenever possible, and encourage one payment per invoice for clients where you have any influence over their process. For clients who reliably pay in batches, keep a running statement so you can match a lump sum against the right combination of open invoices.',
        ],
      },
      {
        heading: 'Cash application vs reconciliation',
        paragraphs: [
          'Cash application is specifically about assigning a payment to the correct invoice. Payment reconciliation is the broader process of confirming that your records match your bank statement overall. Cash application is one input into reconciliation — get it wrong, and your reconciliation will surface a mismatch you then have to trace back.',
        ],
      },
    ],
    faq: [
      {
        question: 'What happens if a payment can’t be matched to any invoice?',
        answer:
          'It sits as an unapplied payment until you resolve it — worth following up with the client to confirm what it was for rather than guessing, since misapplying it to the wrong invoice creates its own downstream confusion.',
      },
      {
        question: 'Can cash application be automated?',
        answer:
          'Many accounting and invoicing tools can auto-match payments that reference an invoice number or exactly match an invoice amount. Payments without clear references or that don’t match an exact amount usually still need manual review.',
      },
      {
        question: 'What if a client pays slightly less than the invoice total?',
        answer:
          'Confirm whether it’s intentional (a discount, a bank fee deducted in transit) or a partial payment before closing the invoice — recording it as fully paid when it wasn’t creates a discrepancy that surfaces later during reconciliation.',
      },
      {
        question: 'Does cash application matter for a small freelance business?',
        answer:
          'Yes, even with just a handful of clients — misapplied or unmatched payments are one of the most common sources of "wait, did they actually pay this one?" confusion when reviewing accounts receivable.',
      },
    ],
    relatedSlugs: ['payment-reconciliation', 'customer-statements'],
  },
  {
    slug: 'payment-reconciliation',
    title: 'Payment Reconciliation: A Step-by-Step Guide',
    description:
      'Payment reconciliation in plain English: what it is, why it matters, and a step-by-step process to match every payment to its invoice and bank deposit.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'Payment reconciliation is the process of confirming that your invoicing records, your accounting records, and your actual bank statement all agree. It’s the checkpoint that catches missed payments, duplicate entries, and errors before they distort your view of what’s actually been collected.',
    ],
    sections: [
      {
        heading: 'Why it matters',
        paragraphs: [
          'Without regular reconciliation, small errors compound quietly — a payment recorded twice, a payment that never got logged, a bank fee that wasn’t accounted for. Individually minor, but over months they can leave your books meaningfully out of sync with reality, which becomes a real problem at tax time or when trying to trust your own cash flow numbers.',
        ],
      },
      {
        heading: 'The step-by-step process',
        paragraphs: ['A basic reconciliation follows the same core steps regardless of scale:'],
        bullets: [
          'Pull your bank statement for the period',
          'Pull your invoicing/accounting records for the same period',
          'Match each recorded payment to a corresponding bank transaction',
          'Flag anything that doesn’t have a match on either side',
          'Investigate and resolve each flagged item — a missing entry, a duplicate, a timing difference',
          'Confirm the final balances agree once everything is matched',
        ],
      },
      {
        heading: 'Common discrepancies and what causes them',
        paragraphs: [
          'Timing differences are the most common and least concerning — a payment sent on the last day of the month may not appear in the bank statement until the next period. Genuine discrepancies to watch for include bank fees silently reducing a deposit below the invoiced amount, duplicate manual entries, and payments applied to the wrong invoice during cash application.',
        ],
      },
      {
        heading: 'How often to reconcile',
        paragraphs: [
          'Monthly is the standard minimum for most small businesses — frequent enough to catch errors before they pile up, without becoming a constant task. Businesses with high transaction volume or tight cash flow often reconcile weekly instead.',
        ],
      },
    ],
    faq: [
      {
        question: 'What’s the difference between reconciliation and cash application?',
        answer:
          'Cash application matches a payment to the right invoice. Reconciliation is the broader check that your overall records match your bank statement — it relies on cash application having been done correctly as one of its inputs.',
      },
      {
        question: 'Can reconciliation be automated?',
        answer:
          'Many accounting tools offer bank feed integration that auto-matches transactions where amounts and dates align closely, which handles the straightforward majority. Discrepancies and edge cases usually still need a manual look.',
      },
      {
        question: 'What should I do if I find a discrepancy I can’t explain?',
        answer:
          'Don’t force the numbers to match by adjusting one side without understanding why — trace it back to its source (a missed invoice, a bank error, a duplicate) so the fix is accurate rather than just cosmetic.',
      },
      {
        question: 'Is reconciliation only necessary for businesses with an accountant?',
        answer:
          'No — it’s valuable at any size, including a solo freelancer with a handful of clients. It’s less about complexity and more about catching errors before they accumulate.',
      },
    ],
    relatedSlugs: ['cash-application', 'accounts-receivable'],
  },
  {
    slug: 'invoice-disputes',
    title: 'Invoice Disputes: How to Resolve Them Without Damaging the Relationship',
    description:
      'A practical guide to resolving invoice disputes without damaging client relationships. Step-by-step responses, sample wording, and prevention tips.',
    category: 'invoicing',
    readTimeMinutes: 8,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'An invoice dispute is any case where a client questions or refuses part or all of an invoice — a pricing disagreement, a claim the work wasn’t completed as described, or a simple misunderstanding about scope. Handled calmly and quickly, most disputes resolve without lasting damage to the relationship.',
    ],
    sections: [
      {
        heading: 'Common causes',
        paragraphs: ['Most invoice disputes trace back to one of a few root causes:'],
        bullets: [
          'A mismatch between what was agreed (verbally or in a proposal) and what the invoice actually bills',
          'Scope that expanded during the project without a clear, documented agreement on the added cost',
          'A quality disagreement — the client feels the work doesn’t match what they paid for',
          'A simple clerical error — wrong amount, duplicate line item, wrong client billed',
        ],
      },
      {
        heading: 'Step-by-step resolution',
        paragraphs: [
          'Start by listening to the specific objection rather than defending the invoice immediately — most disputes resolve faster once you understand exactly which part the client is questioning. Pull up the original agreement or proposal and compare it directly against the invoice; often the disagreement is really about what was previously agreed, not the invoice itself.',
        ],
      },
      {
        heading: 'Sample response wording',
        paragraphs: [
          '"Thanks for flagging this — I want to make sure we’re looking at the same thing. Based on the proposal from [date], the invoice reflects [specific breakdown]. Let me know which part doesn’t match what you were expecting and we’ll sort it out." This keeps the conversation focused on facts rather than becoming defensive.',
        ],
      },
      {
        heading: 'When the client has a valid point',
        paragraphs: [
          'If the dispute is legitimate — a genuine error, or scope that wasn’t clearly agreed — issue a credit note for the amount in question rather than arguing the client into paying the original figure. Resolving a valid dispute quickly and without friction tends to preserve the relationship better than winning the argument.',
        ],
      },
      {
        heading: 'Preventing disputes before they happen',
        paragraphs: [
          'Most disputes are preventable with clearer upfront documentation: a written proposal or contract before work starts, written confirmation of any scope changes as they happen, and itemized invoices that map clearly back to what was agreed. The clearer the paper trail, the less room there is for a genuine disagreement about what was owed.',
        ],
      },
    ],
    faq: [
      {
        question: 'What should I do if a client disputes an invoice but has already paid it?',
        answer:
          'Review the same way you would a pre-payment dispute — if the objection is valid, issue a credit note and process a refund or apply the credit to a future invoice; if it isn’t, explain your reasoning clearly with reference to the original agreement.',
      },
      {
        question: 'How quickly should I respond to a disputed invoice?',
        answer:
          'As promptly as possible — a delayed response reads as either avoidance or low priority, and disputes tend to get more entrenched (and harder to resolve amicably) the longer they sit unaddressed.',
      },
      {
        question: 'Should I involve a lawyer for an invoice dispute?',
        answer:
          'Only for larger amounts or disputes that clearly aren’t resolving through direct conversation — most small-business invoice disputes are resolved without needing to escalate that far, since the underlying issue is usually a misunderstanding rather than a genuine legal disagreement.',
      },
      {
        question: 'How do I prevent the same dispute from happening with future clients?',
        answer:
          'Tighten whatever documentation gap caused it — if scope changes were the issue, start getting written confirmation before doing extra work; if pricing was the issue, make sure your proposals spell out the full cost breakdown before work begins.',
      },
    ],
    relatedSlugs: ['credit-notes', 'overdue-invoices'],
  },
  {
    slug: 'working-capital',
    title: 'Working Capital: What It Is and How to Calculate It',
    description:
      'Working capital is the cash your business can use right now. Learn what it is, how to calculate it with the formula, and how to improve it — with examples.',
    category: 'invoicing',
    readTimeMinutes: 7,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'Working capital is the money your business has available to cover its short-term obligations — a measure of financial cushion, not overall wealth. A business can own significant long-term assets and still have poor working capital if too much of what it owns isn’t easily converted to cash when bills come due.',
    ],
    sections: [
      {
        heading: 'The formula',
        paragraphs: [
          'Working Capital = Current Assets − Current Liabilities. Current assets are what you own that can reasonably be turned into cash within a year — cash itself, accounts receivable, short-term investments. Current liabilities are what you owe within that same timeframe — bills, short-term loans, upcoming tax payments.',
        ],
      },
      {
        heading: 'A worked example',
        paragraphs: [
          'A business with $40,000 in cash and receivables, and $25,000 in bills and short-term obligations due within the year, has working capital of $15,000 ($40,000 − $25,000). That’s the cushion available if short-term obligations all came due at once.',
        ],
      },
      {
        heading: 'Positive vs negative working capital',
        paragraphs: [
          'Positive working capital means you have more short-term resources than short-term obligations — a healthy sign of liquidity. Negative working capital means the reverse, and while some business models function with structurally negative working capital (a well-run subscription business collecting cash upfront, for instance), for most small businesses it’s a warning sign worth addressing.',
        ],
      },
      {
        heading: 'How to improve it',
        paragraphs: [
          'The two levers are increasing current assets or reducing current liabilities. In practice, that means collecting accounts receivable faster (the biggest lever for most service businesses), keeping a healthy cash reserve, and negotiating longer payment terms with your own vendors so fewer obligations are due imminently.',
        ],
      },
      {
        heading: 'Working capital vs cash flow',
        paragraphs: [
          'Working capital is a snapshot at a point in time — what you could cover right now if needed. Cash flow tracks movement over a period — money actually coming in and going out. A business can have positive working capital and still experience a rough month of negative cash flow, or vice versa; the two measures complement each other rather than replacing one another.',
        ],
      },
    ],
    faq: [
      {
        question: 'What’s a good working capital ratio?',
        answer:
          'A commonly cited target is a current ratio (current assets ÷ current liabilities) between 1.5 and 2 — enough cushion to cover short-term obligations comfortably without an excessive amount of cash sitting idle. The right number varies by industry.',
      },
      {
        question: 'Is negative working capital always bad?',
        answer:
          'Not universally — some business models (particularly ones that collect payment upfront and pay suppliers later) operate with negative working capital by design and remain healthy. For most invoicing-based service businesses, though, it’s a signal worth investigating.',
      },
      {
        question: 'How does slow-paying accounts receivable affect working capital?',
        answer:
          'Directly — accounts receivable counts as a current asset, but only in name until it’s actually collected. A large receivable balance that’s aging slowly overstates how much real short-term cushion you actually have.',
      },
      {
        question: 'Can a profitable business have poor working capital?',
        answer:
          'Yes — profitability measures earnings over a period; working capital measures what’s available right now. A profitable business with most of its assets tied up in slow-paying receivables can still have a thin working-capital cushion.',
      },
    ],
    relatedSlugs: ['cash-flow', 'accounts-receivable'],
  },
  {
    slug: 'revenue-forecasting',
    title: 'Revenue Forecasting: Simple Methods for Small Businesses',
    description:
      'Learn simple revenue forecasting methods for small businesses and freelancers — historical trend, pipeline-based, and run-rate approaches, with a worked example.',
    category: 'invoicing',
    readTimeMinutes: 8,
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-10',
    intro: [
      'Revenue forecasting is estimating how much money you expect to bring in over an upcoming period, based on what you already know — past performance, current pipeline, or a mix of both. It doesn’t need to be sophisticated to be useful; even a rough forecast beats no forecast at all when it comes to planning expenses or spotting a shortfall early.',
    ],
    sections: [
      {
        heading: 'Why forecast at all',
        paragraphs: [
          'A forecast turns "I hope this month goes okay" into a specific, checkable number you can plan around — deciding whether to take on new expenses, whether to chase collections harder, or whether it’s a good month to invest in the business. Without one, cash-flow problems tend to arrive as a surprise rather than something you saw coming weeks in advance.',
        ],
      },
      {
        heading: 'Historical trend method',
        paragraphs: [
          'The simplest approach: look at revenue over the past several months (or the same period last year, if your business is seasonal) and project forward based on that trend. It works best for stable, recurring-revenue businesses where the near future tends to resemble the recent past.',
        ],
      },
      {
        heading: 'Pipeline-based method',
        paragraphs: [
          'For project- or proposal-based work, forecast using your current pipeline: list active proposals, estimate a realistic probability each one closes, and sum the probability-weighted values alongside already-confirmed work. This gives a more responsive forecast for businesses whose revenue depends heavily on winning new deals rather than steady recurring billing.',
        ],
      },
      {
        heading: 'Run-rate method',
        paragraphs: [
          'Take your revenue for a recent, representative period (often the last month or quarter) and annualize it — multiply a monthly figure by 12, for instance — to get a rough sense of where you’re trending if nothing changes. It’s a fast, if blunt, way to sanity-check whether you’re on pace for a target.',
        ],
      },
      {
        heading: 'A worked example',
        paragraphs: [
          'A freelancer with $8,000 in confirmed recurring retainer income, plus two active proposals worth $5,000 and $3,000 with estimated 50% and 25% odds of closing, would forecast: $8,000 + ($5,000 × 0.5) + ($3,000 × 0.25) = $11,250 for the period — a more realistic number than assuming either $8,000 (too conservative) or $16,000 (assuming everything closes).',
        ],
      },
      {
        heading: 'Using AR data to sharpen the forecast',
        paragraphs: [
          'Your accounts receivable and DSO give a useful reality check on a revenue forecast — if collections are consistently slow, "expected revenue" and "expected cash in hand" aren’t the same number, and it’s worth forecasting both separately if cash flow (not just revenue) is what you’re actually planning around.',
        ],
      },
    ],
    faq: [
      {
        question: 'How far ahead should a small business forecast?',
        answer:
          'One to three months out is a practical, actionable horizon for most small businesses — far enough to plan around, not so far that the estimate becomes mostly guesswork.',
      },
      {
        question: 'Which forecasting method is most accurate?',
        answer:
          'It depends on your revenue model — historical trend works best for stable recurring revenue, pipeline-based works best for proposal-driven or project work, and many businesses blend both for a more complete picture.',
      },
      {
        question: 'Should a forecast include revenue or actual expected cash?',
        answer:
          'Ideally both are tracked, since they can diverge significantly if collections are slow. A revenue forecast tells you what you expect to earn; a cash forecast (informed by your typical DSO) tells you when you’ll actually have it.',
      },
      {
        question: 'How do I forecast revenue with very little historical data?',
        answer:
          'Lean more heavily on the pipeline-based method — list what you realistically expect to close and apply conservative probabilities, rather than trying to extrapolate a trend from only a few months of data.',
      },
    ],
    relatedSlugs: ['cash-flow', 'accounts-receivable'],
  },
  {
    slug: 'how-to-make-a-qr-code',
    title: 'How to Make a QR Code: A Step-by-Step Guide',
    description:
      'How to pick the right QR code type, keep it scannable after printing, and understand the difference between static and smart-redirect codes — with a practical checklist.',
    category: 'qr-code',
    readTimeMinutes: 7,
    publishedDate: '2026-08-13',
    updatedDate: '2026-08-13',
    intro: [
      'A QR code is only as useful as what happens after the scan. Most of the QR codes that fail in the wild aren’t broken technically — they’re the wrong type for the job, printed too small, or built from a link that changed after the flyer already went to press.',
      'This guide covers how to choose the right QR code type, keep it reliably scannable once it leaves your screen, and avoid the handful of mistakes that account for almost every "why won’t this scan" problem.',
    ],
    sections: [
      {
        heading: 'Picking the right QR code type',
        paragraphs: [
          'What a QR code actually does when someone scans it depends entirely on the type of data encoded into it — the pattern itself just carries information, so choosing the right encoding matters more than any styling choice.',
        ],
        bullets: [
          'URL — opens any web page directly; the simplest and most reliable option for menus, portfolios, or landing pages.',
          'PDF — points at a hosted PDF link (menu, brochure, resume) so it opens straight in the phone’s browser.',
          'Multi-URL — splits scans across two or more links at random, useful for A/B testing which of several landing pages performs better.',
          'Contact card — encodes a vCard, so scanning saves a name, phone, email, and address straight into the recipient’s contacts app with no typing.',
          'Plain text — shows raw text on screen; good for short instructions or notes without opening any app.',
          'App download — combines an iOS and an Android store link into one code that sends each visitor to the correct store automatically.',
          'SMS / Email / Phone — pre-fills a text message, email draft, or dial screen so the recipient only has to hit send or call.',
          'Social profile — links straight to a Facebook, Instagram, LinkedIn, WhatsApp, YouTube, Spotify, Telegram, or Discord profile.',
        ],
      },
      {
        heading: 'Static codes vs. smart-redirect codes',
        paragraphs: [
          'Most of the types above encode your data directly into the black-and-white pattern — the phone’s camera decodes the URL, text, or contact card right there, with no server involved. That’s a static QR code: it works forever, even offline, and nothing you scan is ever sent anywhere else.',
          'Multi-URL and combined App codes work differently, because a single pattern can’t literally point at two destinations. Those two route through a small page first, which reads the destinations out of the code itself and immediately forwards the visitor — picking one link at random for Multi-URL, or checking whether the phone is iOS or Android for App links. No account or database is involved; the logic runs entirely in the visitor’s own browser off data baked into the link. The trade-off is that these two types need an internet connection to resolve, unlike a plain static code.',
        ],
      },
      {
        heading: 'Colors, contrast, and error correction',
        paragraphs: [
          'A QR code scans by contrast, not by color — the pattern needs to stand out clearly from its background. Dark modules on a light background scan reliably; light-on-dark or two similarly-bright colors often don’t, even if they look fine on a screen.',
          'Error correction controls how much of the code can be damaged, dirty, or partially obscured and still scan. Higher levels are worth choosing if the code will be printed small, laminated, or handled roughly, but they also make the pattern denser — for a clean digital screen, a lower level keeps the code simpler without adding real risk.',
        ],
      },
      {
        heading: 'Sizing and placement for print',
        paragraphs: [
          'As a rule of thumb, a QR code needs to be roughly one-tenth of its scanning distance across — a code meant to be scanned from arm’s length (about 30 cm) should be at least 3 cm square; one on a poster read from 2 metres away needs to be closer to 20 cm.',
          'Leave a clear quiet zone — blank space — around the whole code, at least as wide as one of its own modules. Cropping it tight against text, images, or the edge of a card is the single most common reason a code that looks fine on screen fails to scan in person.',
        ],
      },
      {
        heading: 'Test before you publish or print',
        paragraphs: [
          'Scan the code yourself with at least two different phones and camera apps before it goes anywhere permanent — some default camera apps read QR codes more strictly than others, and a code that works on one may not on another.',
          'For Multi-URL and App codes specifically, test from both an iOS and an Android device to confirm each one lands on the destination you actually intended.',
          'Because a static code bakes its destination in permanently, printing one for a link you don’t fully control yet — a "coming soon" page, an early beta URL — is a common way to end up with a stack of flyers pointing nowhere. Confirm the destination is final before it goes to print.',
        ],
      },
    ],
    faq: [
      {
        question: 'Do QR codes expire?',
        answer:
          'No — a QR code itself doesn’t expire; it’s just a pattern encoding whatever data you gave it. What can go stale is the destination: a URL, a hosted PDF, or a phone number can change or get taken down, at which point the still-valid code just leads nowhere useful.',
      },
      {
        question: 'Can I change what a QR code points to after it’s printed?',
        answer:
          'Not for a static code — the destination is baked into the pattern itself, so changing it means printing a new code. If you expect the destination to change later, point the code at a URL you control rather than the final page, so you can update where that URL leads without reprinting.',
      },
      {
        question: 'What’s the difference between a static and a dynamic QR code?',
        answer:
          'A static code encodes its final destination directly and never needs a server to resolve — reliable, and it works forever, but fixed once printed. A dynamic code encodes a short link to a service that looks up and redirects to the real destination, which can be changed after printing, at the cost of depending on that service staying online.',
      },
      {
        question: 'Why won’t my QR code scan?',
        answer:
          'Usually one of four things: not enough contrast between the code and its background, the code is too small or blurry for the scanning distance, there’s no clear blank margin around it, or — for URL and PDF codes — the underlying link itself is broken. Test-scan with more than one phone before ruling out the code itself.',
      },
    ],
    relatedSlugs: [],
    ctaText: 'Put this into practice with a real QR code.',
    ctaToolHref: '/tools/generators/qr-code-generator',
    ctaToolLabel: 'Try the free QR Code Generator',
  },
  {
    slug: 'how-to-test-an-api',
    title: 'How to Test an API: A Beginner’s Guide to HTTP Requests',
    description:
      'What "testing an API" actually means — HTTP methods, headers, query params, request bodies, and auth — with a practical walkthrough of building and reading a request.',
    category: 'developer-tools',
    readTimeMinutes: 10,
    publishedDate: '2026-08-15',
    updatedDate: '2026-08-15',
    intro: [
      'Testing an API just means sending it a request by hand and looking at what comes back — no different in principle from what your app’s code does every time it calls that same endpoint. The difference is you get to see every part of the exchange: the exact URL, the headers, the body, the status code, the response — instead of it happening invisibly inside application code.',
      'This guide walks through the pieces of an HTTP request one at a time, then how to read what the API sends back, using the same structure a browser-based request builder gives you.',
    ],
    sections: [
      {
        heading: 'HTTP methods: what each one is for',
        paragraphs: [
          'The method tells the server what kind of operation you’re asking for. Using the right one matters — some APIs reject the wrong method outright, and using GET for something that changes data is a common source of confusing bugs (browsers and proxies are allowed to cache or re-run GET requests, which is unsafe if a GET is secretly deleting something).',
        ],
        bullets: [
          'GET — fetch data, no side effects. Should be safe to repeat.',
          'POST — create something new, or trigger an action that isn’t a simple update.',
          'PUT — replace a resource entirely with what you send.',
          'PATCH — update part of a resource, leaving the rest as-is.',
          'DELETE — remove a resource.',
          'HEAD — same as GET but returns only headers, no body; useful for checking if something exists without downloading it.',
          'OPTIONS — asks the server what methods/headers are allowed; browsers send this automatically as a CORS "preflight" before certain cross-origin requests.',
        ],
      },
      {
        heading: 'Query parameters vs. headers vs. body',
        paragraphs: [
          'These three carry different kinds of information, and mixing them up is one of the most common reasons a request that "looks right" still fails.',
          'Query parameters (the ?key=value part of a URL) are for filtering, pagination, or options that identify what you want — page=2, sort=name, format=json. They’re visible in logs and browser history, so avoid putting secrets there.',
          'Headers carry metadata about the request itself: what format you’re sending (Content-Type), what you’ll accept back (Accept), and authentication (Authorization). They describe the request, not the data being acted on.',
          'The body carries the actual data for POST, PUT, and PATCH — the new record, the updated fields, the file being uploaded. GET and HEAD requests conventionally don’t have one; sending a body with GET works in a browser-based tool, but many servers and proxies will ignore or reject it.',
        ],
      },
      {
        heading: 'Request body formats',
        paragraphs: [
          'What you set as the body needs to match what the API expects, signaled by the Content-Type header.',
        ],
        bullets: [
          'JSON (application/json) — the most common format for modern APIs; a plain JSON object or array as the body.',
          'Form URL Encoded (application/x-www-form-urlencoded) — key=value pairs joined with &, the same format a plain HTML form submits.',
          'Multipart Form Data (multipart/form-data) — required when uploading files alongside other fields; each part of the body is a separate named field.',
          'Plain text — anything that isn’t structured data: a raw string, XML, CSV, or another custom format the API expects verbatim.',
        ],
      },
      {
        heading: 'Authentication',
        paragraphs: [
          'Most non-public APIs require proving who you are on every request, since HTTP itself has no memory between requests.',
        ],
        bullets: [
          'Bearer token — an Authorization: Bearer <token> header; the most common scheme for modern APIs (OAuth access tokens, API tokens, JWTs).',
          'Basic auth — a username and password combined and base64-encoded into the Authorization header; older but still common for internal tools and simple APIs.',
          'API key — a token sent either as a custom header (X-API-Key is a common name) or as a query parameter, depending on what the provider expects.',
        ],
      },
      {
        heading: 'Reading the response',
        paragraphs: [
          'The status code is the first thing to check — it tells you the outcome before you even look at the body. 2xx means success, 3xx means redirect, 4xx means the request itself was the problem (bad input, missing auth, not found), and 5xx means the server failed while handling an otherwise-valid request.',
          'Response headers often carry information the body doesn’t: Content-Type tells you how to parse the body, rate-limit headers tell you how many requests you have left, and caching headers tell you how long the response is valid for.',
          'The body is the actual data (or error message) the API sends back — usually JSON for modern APIs, which is worth viewing pretty-printed rather than as one unbroken line once responses get any size to them.',
        ],
      },
      {
        heading: 'Working efficiently: history, saved requests, and cURL',
        paragraphs: [
          'Once you’re testing the same endpoint repeatedly — tweaking a header, retrying after a fix — rebuilding the request from scratch each time wastes the exact minutes a request builder is meant to save. Saving a request with a name (like "Login" or "Create User") turns it into a one-click resend instead.',
          'Local history serves a different purpose: a running log of exactly what you sent and got back, useful for comparing "what changed" between a working attempt and a broken one.',
          'cURL import/export matters most when a request needs to travel outside the tool — a curl command from a teammate’s Slack message, an API provider’s documentation example, or a request you want to paste into a bug report or script. Pasting one in should reconstruct the whole request; exporting one should reproduce it exactly.',
        ],
      },
    ],
    faq: [
      {
        question: 'Do I need something like Postman, or is a browser-based tool enough?',
        answer:
          'For most day-to-day testing — trying an endpoint, checking a response, debugging headers or auth — a browser-based tool covers it with zero install. Desktop apps add things like team workspaces, mock servers, and automated test suites, which matter once testing is a shared, ongoing part of a team’s workflow rather than a one-off check.',
      },
      {
        question: 'Why does my request need a Content-Type header?',
        answer:
          'Content-Type tells the server how to parse the body you sent. Send JSON without it (or with the wrong value) and many servers will fail to parse the body at all, even though the JSON itself is perfectly valid — the parsing failure happens before your data is even looked at.',
      },
      {
        question: 'What’s the difference between a 401 and a 403 response?',
        answer:
          '401 Unauthorized means the server doesn’t know who you are — your credentials are missing or invalid. 403 Forbidden means it does know who you are, but you don’t have permission for this specific action. Sending a token fixes a 401; a 403 usually means the token is valid but lacks the right permissions.',
      },
      {
        question: 'Can I test an API that requires login first?',
        answer:
          'Yes — most APIs that require login issue a token (from a separate login/auth endpoint) that you then attach to subsequent requests via the Authorization header. Test the login endpoint first to get a token, then paste that token into the Auth tab for the requests that need it.',
      },
    ],
    relatedSlugs: ['what-is-a-cors-error', 'json-post-request-example', 'form-data-file-upload-example'],
    ctaText: 'Put this into practice with a real request.',
    ctaToolHref: '/tools/developer/api-request-builder',
    ctaToolLabel: 'Try the free API Request Builder',
  },
  {
    slug: 'what-is-a-cors-error',
    title: 'What Is a CORS Error, and How Do You Fix It?',
    description:
      'Why "blocked by CORS policy" shows up in your console, what’s actually enforcing it, and the real ways to fix it depending on whether you control the API.',
    category: 'developer-tools',
    readTimeMinutes: 7,
    publishedDate: '2026-08-15',
    updatedDate: '2026-08-15',
    intro: [
      'A CORS error is one of the most common things a web developer runs into, and one of the most commonly misunderstood — it’s not a bug in your code, not a bug in the API, and not something you can fix by changing anything in your JavaScript. It’s the browser enforcing a rule that only the server on the other end can change.',
      'This guide explains what’s actually happening, why it exists, and what your real options are depending on whether you control the API you’re calling.',
    ],
    sections: [
      {
        heading: 'What CORS actually is',
        paragraphs: [
          'CORS (Cross-Origin Resource Sharing) is a browser security rule: by default, JavaScript running on one origin (say, https://yourapp.com) can’t read the response from a request to a different origin (https://api.example.com), even though the request itself often goes out and the server responds normally. The browser gets the response and then throws it away before your code ever sees it, unless the server explicitly said it’s okay.',
          'That "explicitly said it’s okay" is an Access-Control-Allow-Origin response header. If the API doesn’t send one that matches your origin, the browser blocks your JavaScript from reading the response — regardless of whether the request itself succeeded on the server.',
        ],
      },
      {
        heading: 'Why it exists',
        paragraphs: [
          'Without this rule, any website you visit could silently make authenticated requests to other sites you’re logged into — your bank, your email — using cookies your browser sends automatically, and read the responses. CORS (alongside the older same-origin policy it extends) exists specifically to stop that.',
          'It’s worth internalizing: CORS protects the person visiting the API-calling site, not the API itself. A server that skips CORS headers entirely isn’t "insecure" in the way an open database would be — it’s just not opted in to being called from arbitrary browser JavaScript, which is a deliberate default, not an oversight.',
        ],
      },
      {
        heading: 'Why it works from Postman/curl but not the browser',
        paragraphs: [
          'CORS is enforced by browsers specifically, not by HTTP as a protocol. A command-line tool like curl, a desktop app like Postman, or a server calling another server all bypass it entirely — there’s no browser involved to enforce the rule. That’s the single most common reason "it works everywhere except my frontend" reports happen: everywhere else was never subject to the restriction in the first place.',
        ],
      },
      {
        heading: 'If you control the API',
        paragraphs: [
          'This is the real fix: add CORS headers on the server. In most frameworks this is a one-line middleware — Express’s cors package, Django’s django-cors-headers, Spring’s @CrossOrigin, and equivalents in every major framework. Set the allowed origin to your actual frontend domain (or a specific allowlist) rather than a wildcard if the request also sends credentials like cookies — browsers reject the combination of Access-Control-Allow-Origin: * with credentialed requests specifically.',
        ],
      },
      {
        heading: 'If you don’t control the API',
        paragraphs: [
          'If the API is a third party that hasn’t opted in to browser CORS for your origin, there’s no client-side trick that changes that — CORS isn’t a client capability gap, it’s enforced by the browser regardless of what JavaScript tries. The real options are: check if the provider has a CORS-enabled endpoint or offers one on request, route the call through your own backend so the browser is only ever talking to your own origin, or — for quick testing only — route through a CORS proxy that fetches the response server-side and adds the header for you.',
          'A CORS proxy is a genuine convenience for testing, but it’s a real trade-off: the proxy operator sees everything in that request, including any auth headers or tokens. It’s fine for poking at a public API; it’s not something to route production traffic — or anything with real credentials — through by default.',
        ],
      },
      {
        heading: 'Common CORS mistakes to check for',
        paragraphs: [
          'A handful of specific misconfigurations account for most "I added CORS headers and it still doesn’t work" reports.',
        ],
        bullets: [
          'Access-Control-Allow-Origin: * combined with credentials (cookies, Authorization headers with credentials: "include") — browsers reject this combination outright.',
          'Headers added to the actual response but not to the OPTIONS preflight response — browsers check the preflight response’s headers before ever sending the real request for non-simple requests.',
          'A typo or trailing slash mismatch between the allowed origin and the actual origin — these are checked as exact strings, not patterns, unless the server explicitly handles wildcards.',
          'CORS headers added to the wrong layer — a CDN, load balancer, or reverse proxy in front of the API can strip or override headers the application itself sends.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is a CORS error a security vulnerability?',
        answer:
          'No — it’s the opposite. CORS blocking your request means the security feature is working as designed. A vulnerability would be an API that should restrict cross-origin access but doesn’t (or does so incorrectly, like allowing * with credentials); a CORS error itself is just the browser refusing to hand your JavaScript a response it wasn’t authorized to read.',
      },
      {
        question: 'Can I just disable CORS in my browser?',
        answer:
          'Browser flags and extensions that disable CORS exist, but they only affect your own browser during testing — they don’t change how the API behaves for anyone else, including your users in production. Relying on one is a sign the API itself still needs a real fix before anything depending on it can ship.',
      },
      {
        question: 'Does adding a CORS proxy "fix" CORS?',
        answer:
          'It works around it for testing, but it doesn’t fix the underlying cause — the API still isn’t opted in to browser access from your origin. A proxy fetches the response on a server (where CORS doesn’t apply) and re-serves it with the right header added. That’s fine for checking whether an endpoint works; it’s not a substitute for the API actually adding CORS support if you need this to work reliably in production.',
      },
      {
        question: 'Why does my request fail with no error details, just "CORS error"?',
        answer:
          'This is a deliberate browser limitation, not a missing detail — for security reasons, browsers don’t expose why a cross-origin response was blocked (which header was missing, what the actual response was) to your JavaScript. To see what actually happened, check the Network tab in your browser’s DevTools, which shows the real response and headers even though your code can’t access them.',
      },
    ],
    relatedSlugs: ['how-to-test-an-api', 'json-post-request-example', 'authentication-testing-examples'],
    ctaText: 'See this handled for you, automatically.',
    ctaToolHref: '/tools/developer/api-request-builder',
    ctaToolLabel: 'Try the free API Request Builder',
  },
  {
    slug: 'json-post-request-example',
    title: 'How to Send a JSON POST Request (With a Live Example)',
    description:
      'How to send a JSON POST request — the Content-Type header, the request body, and a live example you can open and test in the API Request Builder.',
    category: 'developer-tools',
    readTimeMinutes: 8,
    publishedDate: '2026-08-17',
    updatedDate: '2026-08-17',
    intro: [
      'POST is the method you reach for when you’re sending data to an API rather than just asking for it back — creating a user, submitting a form, kicking off an action. JSON is the most common shape for that data on modern APIs: readable as plain text, and native to both browsers and virtually every backend language.',
      'Getting it right comes down to two things matching what the endpoint expects: the Content-Type header, which tells the server how to parse what follows, and the body itself, which has to be valid JSON in the shape the API actually wants. This guide walks through a real JSON POST request piece by piece, with a live example you can open and send yourself.',
    ],
    sections: [
      {
        heading: 'The request',
        paragraphs: [
          'Here’s the exact request this guide walks through — a POST to httpbin.org’s /anything endpoint, which accepts any method and body and echoes back exactly what it received. That makes it safe to send for real: no account, no side effects, nothing stored anywhere.',
        ],
        bullets: [
          'POST https://httpbin.org/anything',
          'Content-Type: application/json',
          '{',
          '  "name": "John Doe",',
          '  "email": "john@example.com"',
          '}',
        ],
        examples: [JSON_POST_EXAMPLE],
      },
      {
        heading: 'What each part of the request does',
        paragraphs: ['Four things have to line up for this request to work: the method, the URL, the header, and the body.'],
        bullets: [
          'POST — tells the endpoint you’re submitting data, not just retrieving it. Most APIs use POST specifically for creating a new resource.',
          'URL (https://httpbin.org/anything) — the endpoint receiving the request. It echoes back anything sent to it, any method or body, which is what makes it useful for a guide like this one rather than a real API you’d need credentials for.',
          'Content-Type: application/json — tells the server the body is JSON rather than a query string or form fields, so it parses it correctly instead of guessing or rejecting it outright.',
          'Request body — the actual data being sent, as a JSON object. What keys and structure it needs to contain depends entirely on the API you’re calling; httpbin.org accepts anything.',
        ],
      },
      {
        heading: 'How to test a JSON POST request',
        paragraphs: ['This is the same request, built step by step in the API Request Builder:'],
        bullets: [
          'Open the API Request Builder.',
          'Select POST as the method.',
          'Enter https://httpbin.org/anything as the URL.',
          'Add a header: Content-Type set to application/json.',
          'Open the Body section.',
          'Select JSON as the body type.',
          'Enter the payload.',
          'Send the request.',
          'Inspect the response — status code, body, headers, and response time all appear once it comes back.',
        ],
      },
      {
        heading: 'As a cURL command',
        paragraphs: ['Once a request works, the same call can be copied straight out of the request’s code panel — no retyping it by hand:'],
        bullets: JSON_POST_CURL,
      },
      {
        heading: 'As a JavaScript (Fetch) call',
        paragraphs: ['The same request as a fetch() call, ready to paste into frontend code:'],
        bullets: JSON_POST_FETCH,
      },
      {
        heading: 'As a Python request',
        paragraphs: ['And the same request using the requests library:'],
        bullets: JSON_POST_PYTHON,
      },
      {
        heading: 'Common mistakes',
        paragraphs: ['A handful of specific issues account for most "why isn’t my JSON POST working" reports.'],
        bullets: [
          'Missing Content-Type — send JSON without this header (or with the wrong value, like text/plain) and many servers won’t parse the body as JSON at all, even though the JSON itself is perfectly valid. The parsing fails before your data is ever looked at.',
          'Invalid JSON — a trailing comma, an unquoted key, or a stray quote breaks the whole body. {"name": "John Doe",} — a comma after the last field — is invalid JSON and will fail to parse, even though it looks almost right.',
          'Sending form data instead of JSON — application/x-www-form-urlencoded (key=value pairs joined with &) and application/json are different formats entirely. Setting the header to one while shaping the body like the other is a common way to get a confusing parse error.',
          'Wrong endpoint — a perfectly valid JSON POST to the wrong URL or path still fails; a 404 or routing error can look similar to a body-parsing error until you check the status code and response body.',
          'API expects a different schema — valid JSON only means the syntax is correct, not that the server accepts that particular shape. A missing required field or an unexpected key can still get rejected, even though nothing about the JSON itself is malformed.',
        ],
      },
      {
        heading: 'JSON vs. form data',
        paragraphs: ['JSON and form data are both common ways to send a body with POST, but they’re shaped differently and used for different things.'],
        bullets: [
          'JSON (Content-Type: application/json) — a structured payload of nested objects, arrays, numbers, and booleans. The default for most modern REST APIs.',
          'Form data (Content-Type: multipart/form-data) — flat key/value fields, and the only real option once a file is part of the payload; JSON has no native way to carry binary data.',
        ],
      },
      {
        heading: 'Reading the response',
        paragraphs: [
          'Once the request is sent, four things are worth checking before assuming it worked: the status code first, then the body, the headers, and how long it took.',
          'The status code alone tells you the outcome before you even read the body. 2xx generally means the request succeeded. 4xx means the problem is on the request side — bad input, invalid JSON, missing auth, a wrong URL. 5xx means the request reached the server fine but something failed while handling it.',
          'The response body is worth checking too — httpbin.org echoes back exactly what it received, which is a fast way to confirm the server saw the same body you thought you sent. Response headers and response time round out the picture: Content-Type on the way back tells you how to parse the response, and response time is useful for spotting a slow endpoint before it becomes a production problem.',
        ],
      },
      {
        heading: 'Browser requests and CORS',
        paragraphs: [
          'A request sent from a tool like this one, or from curl, isn’t subject to CORS — that restriction only applies to JavaScript running in a browser trying to read a cross-origin response. If this exact request works fine here but fails when called from your own frontend’s JavaScript, CORS is the most likely reason, not a problem with the JSON itself.',
        ],
      },
    ],
    faq: [
      {
        question: 'Do I need to set Content-Type manually, or does POST send it automatically?',
        answer:
          'You need to set it. POST doesn’t imply any particular body format on its own — the method and the body format are independent choices, and the server has no way to know your body is JSON unless the Content-Type header says so.',
      },
      {
        question: 'Why does httpbin.org accept anything I send it?',
        answer:
          'httpbin.org is a public testing service built specifically for this — its /anything endpoint accepts any method, headers, and body, and echoes them back in the response instead of doing anything with them. It’s useful for confirming a request is shaped the way you think it is, without needing a real backend or credentials.',
      },
      {
        question: 'Can I send a JSON body with a GET request instead of POST?',
        answer:
          'Technically some tools will let you attach one, but GET requests conventionally don’t carry a body, and many servers, proxies, and caches will ignore or strip it. If you need to send structured data, POST (or PUT/PATCH for updates) is the reliable choice.',
      },
      {
        question: 'What happens if the JSON I send doesn’t match what the API expects?',
        answer:
          'Valid JSON syntax doesn’t guarantee the API accepts it — the server still validates the JSON against whatever schema it expects. A missing required field or an unexpected shape typically comes back as a 400-range error with a message describing what was wrong, not a parsing failure.',
      },
    ],
    relatedSlugs: ['how-to-test-an-api', 'what-is-a-cors-error', 'authentication-testing-examples'],
    ctaText: 'Test this exact request yourself.',
    ctaToolHref: '/tools/developer/api-request-builder',
    ctaToolLabel: 'Try the free API Request Builder',
  },
  {
    slug: 'authentication-testing-examples',
    title: 'How to Test an API with Bearer Tokens, API Keys, and Basic Auth',
    description:
      'How to test API authentication — Bearer tokens, API keys, and Basic Auth — with live request examples you can open and send in the browser.',
    category: 'developer-tools',
    readTimeMinutes: 11,
    publishedDate: '2026-08-17',
    updatedDate: '2026-08-17',
    intro: [
      'Most APIs that do anything meaningful — read a private record, create something, charge a card — need to know who’s calling before they respond. That’s authentication: proving your identity on the request itself, since HTTP carries no memory of you between calls the way a logged-in browser session might.',
      'Testing the authentication piece on its own, separate from whatever the endpoint actually does, makes it much faster to tell “my credentials are wrong” apart from “my request is wrong.” This guide covers the three schemes you’ll run into most often — Bearer tokens, API keys, and Basic Auth — with a live example of each you can open and send.',
    ],
    sections: [
      {
        heading: 'Authentication methods at a glance',
        paragraphs: [
          'The three schemes below aren’t interchangeable — which one an API expects is dictated entirely by that API’s own documentation, not by preference.',
        ],
        bullets: [
          'Bearer token — a string, often issued by a login endpoint or OAuth flow, sent in the Authorization header. The most common scheme for modern REST APIs.',
          'API key — a key the provider issues you directly, sent as a header or a query parameter depending on the API. Simpler than a full token exchange; common for third-party and public APIs.',
          'Basic Auth — a username and password combined and base64-encoded into the Authorization header. Older, but still common for internal tools and simple services.',
        ],
      },
      {
        heading: 'Test an API with a Bearer token',
        paragraphs: [
          'A Bearer token is a credential proving who’s making the request — issued by a login endpoint, an OAuth flow, or generated directly in an API provider’s dashboard. Because HTTP requests carry no memory of who called last time, the token rides along in the Authorization header on every request that needs it.',
          'There’s no one universal token format — a Bearer token might be an opaque string, a JWT, or something provider-specific — so treat it as whatever that API’s documentation says to send, not a fixed shape.',
          'Rather than putting a real token into a public example, this one uses a {{token}} placeholder — the same syntax the API Request Builder’s environment variables use, so you can swap in your own value without editing the request itself:',
        ],
        bullets: [
          'Literal: Authorization: Bearer YOUR_TOKEN',
          'Reusable: Authorization: Bearer {{token}} — resolved from an environment variable named token',
        ],
        examples: [AUTH_BEARER_EXAMPLE],
      },
      {
        heading: 'Test an API with an API key',
        paragraphs: [
          'An API key is a credential the provider issues you directly — no login flow, no token exchange — that you attach to each request. Where it goes depends entirely on the API: some expect a header, some a query parameter, and the exact header or parameter name is whatever that provider chose.',
          'A query-string API key proves the same thing a header one does, but it’s more exposed — URLs get written into server logs, browser history, and any proxy or CDN sitting in front of the API in ways headers usually aren’t. Use whichever the API’s documentation actually asks for, and default to a header when you have the choice.',
        ],
        bullets: [
          'Header: X-Api-Key: {{apiKey}}',
          'Query parameter: https://example.com/data?api_key={{apiKey}}',
        ],
        examples: [AUTH_API_KEY_EXAMPLE],
      },
      {
        heading: 'Test a Basic Auth API',
        paragraphs: [
          'Basic Auth sends a username and password, joined with a colon and base64-encoded, in the Authorization header: Authorization: Basic base64(username:password). Base64 is an encoding, not encryption — anyone who intercepts the header can decode it instantly, which is why Basic Auth only belongs on HTTPS.',
          'The example below uses httpbin.org’s Basic Auth sandbox endpoint, which only accepts one specific username and password — both literally “demo” — and exists purely for testing. These are public example credentials for this one endpoint, not anything you’d reuse against a real API.',
          'Opening the example carries over the method, URL, auth type, and username automatically; the password field arrives empty by design — type demo into it yourself before sending. See “What this tool does with your credentials” below for why.',
        ],
        examples: [AUTH_BASIC_EXAMPLE],
      },
      {
        heading: 'How to test an authenticated request, step by step',
        paragraphs: [
          'The workflow is the same regardless of which scheme the API uses. Reaching for an environment variable instead of typing a credential directly is worth doing by default — the token or key lives in one place, and the request itself just references {{token}} or {{apiKey}}. One note on where the request actually goes: sending is browser-first, and most requests go straight from your browser to the target API, but if that API blocks cross-origin browser requests, this tool’s CORS proxy fallback (or a custom proxy you’ve configured) can route the request through a third-party server instead — it isn’t accurate to say a request always stays in the browser.',
        ],
        bullets: [
          'Identify the authentication method from the API’s documentation.',
          'Open the API Request Builder.',
          'Set the HTTP method and URL.',
          'Open the Auth tab.',
          'Select the matching authentication type — Bearer, API Key, or Basic Auth.',
          'Enter the credential directly, or reference an environment variable (e.g. {{token}}).',
          'Send the request.',
          'Check the status code and response body before assuming it worked.',
        ],
      },
      {
        heading: 'Using environment variables for auth',
        paragraphs: [
          'Instead of typing a real token or key directly into a request, define it once as an environment variable and reference it by name — the template stays in the request text, and the real value lives in whichever environment is active, swappable (e.g. staging vs. production) without touching the request itself.',
          'Environment values are stored in this browser’s local storage, in plain text — not encrypted — the same as everything else this tool saves locally. Treat it the way you’d treat any other value sitting in your own browser: fine for a personal or team dev setup, not a place to leave a production credential you wouldn’t want exposed if the machine itself were compromised.',
        ],
        bullets: [
          'Environment: token = your-real-token',
          'Environment: apiKey = your-real-api-key',
          'Request header: Authorization: Bearer {{token}}',
          'Request header: X-Api-Key: {{apiKey}}',
        ],
      },
      {
        heading: 'API key placement: header vs. query parameter',
        paragraphs: [
          'Both forms send the same key; they just carry it in a different part of the request. The API’s own documentation decides which one is required — not personal preference — though a header is generally the safer default when an API supports both.',
        ],
        bullets: [
          'Header — X-Api-Key: {{apiKey}}. Not visible in the URL; the usual recommendation when an API supports both.',
          'Query parameter — https://example.com/data?api_key={{apiKey}}. Visible in the URL itself, so it can end up in server logs, browser history, and any intermediary sitting in front of the API.',
        ],
      },
      {
        heading: 'Authentication vs. authorization — and what 401 and 403 actually mean',
        paragraphs: [
          'Authentication answers “who are you?” — a Bearer token, API key, or Basic Auth credential is how you answer it. Authorization is a separate question: “what are you allowed to do, now that the server knows who you are?” A request can pass the first check and still fail the second.',
          'The two status codes map roughly onto that distinction, though neither has one single universal cause:',
        ],
        bullets: [
          '401 Unauthorized — the server doesn’t recognize you as authenticated. Common causes: no credential was sent, the token expired, the token or key is simply wrong, or the auth header isn’t formatted the way the API expects.',
          '403 Forbidden — the server knows who you are, but won’t let this particular request through. Common causes: the token or key lacks a required scope or permission, the account behind it doesn’t have access to this resource, or a policy is blocking the request for a reason unrelated to identity.',
        ],
      },
      {
        heading: 'Bearer token as a cURL command',
        paragraphs: ['The example above, generated straight from its own request definition, so it can never drift out of sync with it:'],
        bullets: AUTH_BEARER_CURL,
      },
      {
        heading: 'Bearer token as a JavaScript (Fetch) call',
        paragraphs: ['The same request as a fetch() call:'],
        bullets: AUTH_BEARER_FETCH,
      },
      {
        heading: 'Bearer token as a Python request',
        paragraphs: ['And using the requests library:'],
        bullets: AUTH_BEARER_PYTHON,
      },
      {
        heading: 'Basic Auth as a cURL command',
        paragraphs: ['For comparison, the Basic Auth example as cURL — note requests handles the base64 encoding for you via -u:'],
        bullets: AUTH_BASIC_CURL,
      },
      {
        heading: 'Works in cURL but fails in your browser?',
        paragraphs: [
          'An authenticated request that works fine from cURL, or from this tool, can still fail once it’s called from your own frontend’s JavaScript — and the reason is almost always CORS, not the authentication itself. CORS is enforced by browsers specifically, so cURL, this tool, and any server-to-server call bypass it entirely, which is why “it works everywhere except my frontend” is such a common report.',
          'See What Is a CORS Error, and How Do You Fix It? (linked below) for what’s actually happening and how to fix it depending on whether you control the API.',
        ],
      },
      {
        heading: 'What this tool does with your credentials',
        paragraphs: [
          'This section covers specifically what happens to a token, key, or password you type into a request’s Auth tab — worth reading before relying on any of it for something sensitive.',
          'Request and environment state, including any credential you enter, lives in this browser’s local storage, not a cloud account — nothing needs to be created or signed into to use this tool.',
          'Requests are sent browser-first with fetch(). If the target API doesn’t allow cross-origin browser requests, this tool’s CORS proxy fallback (or a custom proxy you’ve configured) can route the request through a third-party server instead — and that request, credentials included, does pass through that proxy, the way any proxy works. It is not accurate to say your credentials never leave your browser; whether they do depends on whether a proxy was involved.',
          'Opening one of this guide’s examples only carries a credential value over if it’s written as a {{template}} — which is why the Bearer and API-key examples above open with {{token}} and {{apiKey}} intact, but the Basic Auth example’s username comes through while its literal “demo” password does not. That’s the link-sharing mechanism deliberately refusing to put a literal secret in a URL, not a bug in the example — type demo back into the password field yourself after opening it.',
          'Saving a request, or letting one land in history, goes further still: the Bearer token, Basic Auth password, and API key value are always cleared before anything is written to local storage — template or not — so reopening a saved or historical request later means re-entering that value again.',
          'localStorage itself is not encrypted. Anyone with access to this browser profile, or a script running on this page’s own origin, could in principle read what’s stored — the same caveat that applies to local storage in any web app, not something unique to this tool.',
        ],
      },
    ],
    faq: [
      {
        question: 'What’s the difference between a Bearer token and an API key?',
        answer:
          'Both are credentials sent with the request, but a Bearer token is usually issued through a login or OAuth flow and can expire or get refreshed, while an API key is typically a long-lived value the provider hands you directly with no separate exchange step. Which one an API uses is decided by that API, not by you.',
      },
      {
        question: 'Why does my authenticated request work in cURL but fail from my frontend?',
        answer:
          'That’s almost always CORS, not the authentication — CORS is enforced by browsers specifically, so cURL, this tool, and any server-to-server call bypass it entirely. See What Is a CORS Error, and How Do You Fix It? for the real fix, which depends on whether you control the API.',
      },
      {
        question: 'Is Basic Auth secure?',
        answer:
          'Basic Auth only encodes the credentials (base64) — it doesn’t encrypt them, and anyone who intercepts the request can decode the header instantly. It’s fine to use, but only over HTTPS, which is what actually protects the credentials in transit, not the encoding itself.',
      },
      {
        question: 'Does using a {{token}} template keep my credential secret?',
        answer:
          'It keeps the literal value out of a saved request, a share link, or a public example like the ones on this page — the template is just a placeholder resolved from whichever environment is active when the request is sent. The real value still lives in that environment’s storage, unencrypted, the same as anything else this tool saves locally.',
      },
    ],
    relatedSlugs: ['how-to-test-an-api', 'json-post-request-example', 'what-is-a-cors-error'],
    ctaText: 'Test an authenticated request yourself.',
    ctaToolHref: '/tools/developer/api-request-builder',
    ctaToolLabel: 'Try the free API Request Builder',
  },
  {
    slug: 'form-data-file-upload-example',
    title: 'How to Send Form Data and File Uploads to an API',
    description:
      'How to send multipart/form-data to an API — text form fields, file uploads, and the Content-Type mistake that breaks them — with live examples you can test.',
    category: 'developer-tools',
    readTimeMinutes: 9,
    publishedDate: '2026-08-17',
    updatedDate: '2026-08-17',
    intro: [
      'Plenty of APIs take structured data in the request body rather than the URL — a form submission, a profile update, an upload. How that body is shaped is a separate decision from the method, and the API on the other end decides which shape it accepts.',
      'multipart/form-data is the shape you reach for when the request carries files, or a mix of files and ordinary text fields. It splits the body into separate parts, one per field, each with its own name — which is what lets binary file content sit alongside plain text in a single request. That’s the thing JSON can’t do: JSON is text, with no native way to carry a file’s bytes. URL-encoded form data (application/x-www-form-urlencoded) can carry flat key/value text pairs but has the same problem with files.',
      'This guide walks through both cases — a text-only multipart request and one with a file attached — with live examples you can open and send, plus the Content-Type detail that quietly breaks more multipart requests than anything else.',
    ],
    sections: [
      {
        heading: 'A multipart request with text fields only',
        paragraphs: [
          'The simplest multipart request carries no files at all — just named text fields. Here’s the one this guide starts with, sent to httpbin.org’s /anything endpoint, which accepts any method and body and echoes back exactly what it received. That makes it safe to actually send: no account, no side effects, nothing stored anywhere.',
          'The card below summarizes the request as multipart/form-data, but read that as what the request will be sent as — not as a header it sets. Open it and the Headers tab is empty: this request deliberately carries no Content-Type header of its own, and the section further down explains why that omission is the whole point.',
        ],
        bullets: [
          'POST https://httpbin.org/anything',
          'Body type: Multipart Form Data',
          'name = John Doe',
          'email = john@example.com',
        ],
        examples: [FORM_DATA_TEXT_EXAMPLE],
      },
      {
        heading: 'Text fields: a key and a value',
        paragraphs: [
          'Every multipart field is a pair — a key (the field name) and a value. The key is the name the server looks the field up by, so it has to match what the API documents, exactly, including case. The value is just the text you’re sending under that name.',
          'On the receiving end, each part is parsed back out into a named field in whatever the server’s form-parsing layer calls its parsed-body collection. The names you send are the names it looks up; nothing else about your field ordering or formatting survives, and none of this is specific to any one backend framework or language.',
        ],
        bullets: [
          'name = John Doe — the field named "name" arrives carrying the text "John Doe".',
          'email = john@example.com — the field named "email" arrives carrying that address as text.',
          'A key the API doesn’t recognize is usually ignored, or rejected as an unexpected field.',
          'A key the API expects but doesn’t receive is usually reported as a missing required field.',
        ],
      },
      {
        heading: 'Adding a file to the request',
        paragraphs: [
          'The second example is the same endpoint with a file field added alongside a text field. It’s the mixed case most upload endpoints actually use: some metadata, plus the file itself.',
          'One thing to know before opening it: the file field arrives empty on purpose. A file lives on your own machine, and a shareable link is just text — there is no way to serialize a real local file into a URL, and this tool’s share format deliberately drops file contents rather than pretending otherwise. So the link carries the field name, the field’s file mode, and everything else about the request, but not a file.',
          'That means you need to choose a local file yourself after opening the request. In the Body section, the file row shows "Choose file…" — click it, pick any small file (a plain .txt file is ideal for a first test), and the row switches to showing that file’s name. Then send.',
        ],
        bullets: [
          'name = profile — an ordinary text field.',
          'file = (choose a local file) — a file field, opened empty, waiting for you to attach something.',
        ],
        examples: [FORM_DATA_FILE_EXAMPLE],
      },
      {
        heading: 'File fields: a name and a locally selected file',
        paragraphs: [
          'A file field has two halves: the field name the API expects, and the actual file you pick from your machine. The field name is yours to match against the docs — avatar, file, upload, attachment, whatever that endpoint asks for. The file half is chosen through the browser’s own file picker.',
          'What actually goes over the wire for that part is the file’s bytes, along with metadata the browser attaches — the field name, the original filename, and the file’s content type. That’s all assembled by the browser’s FormData mechanism when the request is sent. Worth being precise about: a file field does not send a path or a filename string as its value. If you type "profile.png" into a text field, the server receives the literal text "profile.png", not an image — which is a genuinely common way to end up debugging an upload that never contained a file.',
        ],
        bullets: [
          'avatar = profile.png — read this as "the field named avatar carries the file profile.png", not as a text value.',
          'The field name comes from the API’s documentation; the file comes from your machine.',
          'Filename and content type ride along as part metadata, set by the browser from the file you picked.',
        ],
      },
      {
        heading: 'Never set the Content-Type header yourself',
        paragraphs: [
          'This is the single most common way a multipart request breaks, and it looks like the opposite of a mistake: you know the body is multipart/form-data, so you add a Content-Type header saying exactly that. The request then fails to parse on the server, usually with an unhelpful error about a missing or malformed body.',
          'The reason is the boundary. A multipart body is a sequence of parts separated by a delimiter string, and the receiving server has to be told what that delimiter is — it travels as a parameter on the Content-Type header itself, not inside the body. The full header looks like multipart/form-data; boundary=... with a randomly generated token after the equals sign, and the server splits the body on exactly that token.',
          'When you send a browser FormData body, the browser generates that boundary and writes the complete header for you. Set the header manually and you overwrite it with a version that has no boundary parameter, so the server has nothing to split the body on. The fix is to not set it: leave Content-Type off entirely and let the browser fill it in.',
          'This is why the examples above carry no Content-Type header, and why the API Request Builder doesn’t add one for you in Multipart Form Data mode the way it does for a JSON body. Open either example and check the Headers tab — it’s empty. It’s the same rule in fetch() code, which is why the generated snippet further down sends the FormData object with an empty headers object.',
        ],
        bullets: [
          'Correct: send the form body with no Content-Type header at all.',
          'Broken: Content-Type: multipart/form-data — no boundary, so the server can’t split the parts.',
          'What the browser actually sends: multipart/form-data; boundary=(a generated token).',
          'This applies to browser FormData specifically — a server-side HTTP client or cURL builds its own boundary the same way.',
        ],
      },
      {
        heading: 'JSON vs. multipart/form-data',
        paragraphs: [
          'Neither format is better in the abstract — they’re answers to different questions, and in practice the API you’re calling has already picked one. Check its documentation before choosing.',
        ],
        bullets: [
          'JSON (Content-Type: application/json) — the right choice when the API expects structured JSON: nested objects, arrays, numbers, booleans. The default for most modern REST APIs, and you do set this header yourself.',
          'multipart/form-data — the right choice for files, flat text form fields, or a mix of the two. Header set automatically, with a boundary.',
          'Nesting is where multipart gets awkward — it’s a flat list of named parts, so representing deep structure means flattening it into field names or sending a JSON string as one field’s value.',
          'Files are where JSON gets awkward — carrying a file means base64-encoding it into a string, which inflates the payload and requires the API to be designed for it.',
        ],
      },
      {
        heading: 'How to test a form-data request, step by step',
        paragraphs: ['Building either example from scratch in the API Request Builder:'],
        bullets: [
          'Open the API Request Builder.',
          'Select POST as the method.',
          'Enter https://httpbin.org/anything as the URL.',
          'Open the Body tab.',
          'Choose Multipart Form Data as the body type.',
          'Click "Add field" and fill in the Key and Value columns — for example, name and John Doe.',
          'Add a second field the same way for email.',
          'For a file field, add the field, type its key, then click the paperclip button on that row to switch it to a file value.',
          'Click "Choose file…" on that row and pick a local file — the row then shows the filename.',
          'Leave the Headers tab alone: do not add a Content-Type header.',
          'Send the request.',
          'Inspect the response — status code, body, headers, and response time all appear once it comes back.',
        ],
      },
      {
        heading: 'Text fields and a file in one request',
        paragraphs: [
          'Most real upload endpoints want both: the file, plus some fields describing it. A profile update might look like this — one file and two text fields, all in a single multipart body.',
          'Configuring it is exactly the two steps above combined: three rows in Multipart Form Data mode, two of them left as text values, one switched to a file value with the paperclip button. No Content-Type header on any of them.',
          'What a real endpoint does with those fields — which are required, what file types it allows, what it returns — is entirely that API’s business. The examples here point at httpbin.org purely as an inspection sandbox: it echoes back what it received so you can confirm the request was shaped correctly, and it implements no particular upload schema of its own.',
        ],
        bullets: [
          'POST /upload',
          'name = John Doe (text field)',
          'email = john@example.com (text field)',
          'file = profile.txt (file field — selected locally)',
        ],
      },
      {
        heading: 'As a cURL command',
        paragraphs: [
          'The text-only example, copied straight from the request’s code panel. Each -F flag is one form field, and cURL handles the boundary itself — note there’s no -H Content-Type flag here either:',
        ],
        bullets: FORM_DATA_CURL,
      },
      {
        heading: 'Adding a file in cURL',
        paragraphs: [
          'A file field uses the same -F flag with an @ prefix on the value, which tells cURL to read a file rather than send the text literally:',
        ],
        bullets: [
          `-F 'file=@demo.txt' — sends the file demo.txt from the current directory.`,
          `-F 'file=demo.txt' — without the @, sends the literal text "demo.txt" instead. A frequent typo.`,
        ],
      },
      {
        heading: 'As a JavaScript (Fetch) call',
        paragraphs: [
          'The same request as a fetch() call. The important detail is what’s missing: headers is empty, because setting Content-Type here would strip the boundary and break the request:',
        ],
        bullets: FORM_DATA_FETCH,
      },
      {
        heading: 'Adding a file in fetch()',
        paragraphs: ['A file field is appended the same way, using a File object — usually straight from a file input element:'],
        bullets: [
          'formData.append("file", fileInput.files[0]);',
          'formData.append("file", fileInput.files[0], "custom-name.txt"); — optional third argument overrides the filename sent.',
        ],
      },
      {
        heading: 'Common mistakes',
        paragraphs: ['Most "why is my upload failing" reports come down to one of these.'],
        bullets: [
          'Setting the multipart Content-Type by hand — the boundary goes missing and the server can’t split the body into parts. Covered above; it’s worth repeating because the header looks correct.',
          'Sending JSON when the API expects multipart — a JSON body with a JSON Content-Type reaching an endpoint that only parses form data typically comes back as a parse error or an unsupported-media-type response, not a helpful message about the format mismatch.',
          'The wrong field name — an endpoint expecting avatar won’t find a field you named file, and vice versa. Field names are matched exactly, so this usually surfaces as "no file was uploaded" even though a file clearly was.',
          'Forgetting the file field entirely — if the endpoint requires a file, sending only text fields fails validation, often with a message about the missing field rather than anything mentioning uploads.',
          'The wrong file type — many endpoints restrict uploads by MIME type or extension (images only, PDFs only), and reject anything else regardless of how well-formed the request is.',
          'A file that’s too large — browsers, the API itself, and any reverse proxy or CDN in between can each impose their own upload size ceiling. Which one you hit, and at what size, depends entirely on that stack’s configuration.',
          'Typing a filename into a text field — sends the string, not the file. Switch the row to a file value with the paperclip button instead.',
        ],
      },
      {
        heading: 'Reading the response',
        paragraphs: [
          'Once the request comes back, four things are worth checking: the status code first, then the response body, the response headers, and how long it took. httpbin.org echoes the request back, so its body is a fast way to confirm the server saw the fields you thought you sent — a file part shows up under "files" rather than "form", which is a useful sanity check that the field really was sent as a file.',
          'When a multipart request fails, the status code narrows it down quickly:',
        ],
        bullets: [
          '400 or 422 — the body was malformed or a required field was missing. The usual suspect is the Content-Type boundary problem, or a field name that doesn’t match.',
          '401 or 403 — an authentication or permission problem, not a format one. The upload never got as far as being parsed.',
          '413 — the payload was too large; the server or a proxy in front of it rejected it on size.',
          '415 — unsupported media type: the server won’t accept this format, either for the body as a whole or for the uploaded file specifically.',
        ],
      },
      {
        heading: 'Browser requests and CORS',
        paragraphs: [
          'Multipart requests sent from a browser are subject to CORS like any other cross-origin request — and a multipart POST is never a "simple" request, so it triggers a preflight OPTIONS call the API has to answer correctly before the real upload is allowed through.',
          'That’s worth knowing because it explains a specific symptom: an upload that works fine from cURL but fails from your own frontend’s JavaScript. cURL isn’t a browser and ignores CORS entirely, so the difference points at CORS rather than at anything wrong with the multipart body. See What Is a CORS Error, and How Do You Fix It? (linked below) for what to actually do about it.',
        ],
      },
      {
        heading: 'Where your file actually goes',
        paragraphs: [
          'The API Request Builder assembles and sends the request in your browser, using the same fetch() and FormData a web page would — the file you pick is read by the browser and sent to whatever URL you entered, and nothing about it is stored by this site.',
          'The one qualification: sending is browser-first, but if the target API blocks cross-origin browser requests, this tool’s CORS proxy fallback (or a custom proxy you’ve configured) can route the request through a third-party server instead. In that case the request — file included — does pass through that server, the way any proxy works. It would not be accurate to say a request never leaves your browser; whether it does depends on whether a proxy was involved.',
          'The examples on this page carry no credentials, no environment values, and no reference to any file on your machine. A file field can only ever be filled by you, locally, after the request is open.',
        ],
      },
    ],
    faq: [
      {
        question: 'Why shouldn’t I set the Content-Type header for a multipart request?',
        answer:
          'Because the header has to include a boundary parameter — multipart/form-data; boundary=... — that identifies the delimiter separating the parts of the body. The browser generates that boundary when it builds the FormData body and writes the complete header itself. Setting the header manually replaces it with one that has no boundary, leaving the server nothing to split the body on.',
      },
      {
        question: 'Can I share a request that already has my file attached?',
        answer:
          'No. A share link is text, and a file is binary data on your own machine — it can’t be encoded into a URL, and this tool deliberately drops file contents rather than trying. A shared multipart request carries the field names and everything else about the request, but the file field arrives empty for whoever opens it to fill in themselves.',
      },
      {
        question: 'When should I use multipart/form-data instead of JSON?',
        answer:
          'When files are involved, or when the API explicitly documents a form-data endpoint. For structured data with no files, JSON is usually the better fit and is what most REST APIs expect. The deciding factor is what the API accepts, not a general preference.',
      },
      {
        question: 'Why does my upload return 413?',
        answer:
          '413 Payload Too Large means something in the chain rejected the request on size before or during processing — the API itself, or a reverse proxy, load balancer, or CDN in front of it, each of which can enforce its own limit. The specific ceiling depends on that stack’s configuration, so check the API’s documented upload limit first.',
      },
      {
        question: 'Can I send a file with a GET request?',
        answer:
          'No. GET requests conventionally carry no body, and browsers won’t send one — the API Request Builder shows a warning if you configure a body on a GET or HEAD request, and the body is left out when the request is sent. Uploads use POST, or sometimes PUT/PATCH for replacing an existing file.',
      },
    ],
    relatedSlugs: ['json-post-request-example', 'how-to-test-an-api', 'what-is-a-cors-error'],
    ctaText: 'Test a multipart upload yourself.',
    ctaToolHref: '/tools/developer/api-request-builder',
    ctaToolLabel: 'Try the free API Request Builder',
  },
  {
    slug: 'curl-to-fetch-axios-python',
    title: 'Convert a cURL Command to JavaScript, Axios, or Python',
    description:
      'Import a cURL command, inspect and test the request, then generate the equivalent JavaScript Fetch, Axios, Node.js, or Python Requests code.',
    category: 'developer-tools',
    readTimeMinutes: 9,
    publishedDate: '2026-08-17',
    updatedDate: '2026-08-17',
    intro: [
      'A cURL command is how HTTP requests get passed around. API documentation shows one. A support ticket includes one. A README pastes one in. A teammate copies one out of their terminal, or out of the browser devtools "Copy as cURL" menu, and drops it in a chat message.',
      'What you usually need next is three separate things: to understand what the command actually does, to confirm it works before building anything on top of it, and to turn it into code in whatever language you are writing. Reading flags out of a one-line shell command is a slow way to do the first, and hand-translating them is an error-prone way to do the third.',
      'The API Request Builder can do all three in one place. Paste the command and it parses into an editable request — method, URL, headers, query parameters, body, and auth all shown as fields you can read and change. Send it to see the real response. Then open the code panel and take the same request out as JavaScript Fetch, Axios, Node.js, or Python Requests. This guide walks that path with one worked example, and is honest about where the conversion has real limits.',
    ],
    sections: [
      {
        heading: 'The example request used throughout this guide',
        paragraphs: [
          'Everything below — the cURL command, the Fetch code, the Axios code, the Node code, the Python code — is generated from this one request by the tool’s own generators. Nothing on this page was written by hand, so what you read here is what the tool actually produces.',
          'It points at httpbin.org/anything, which accepts any method and body and echoes back what it received. That makes it safe to open and actually send: no account, no side effects, nothing stored. Opening the card below pre-fills the request in the API Request Builder — it does not send it. You press Send when you want to.',
        ],
        bullets: [
          'POST https://httpbin.org/anything',
          'Content-Type: application/json',
          'X-Client-Version: demo',
          'Body (JSON): { "name": "John Doe", "email": "john@example.com" }',
        ],
        examples: [CURL_CONVERT_EXAMPLE],
      },
      {
        heading: 'The original cURL command',
        paragraphs: [
          'This is that request as cURL, copied straight from the tool’s "Copy as cURL" button. Reading it flag by flag: -X sets the method, each -H adds one header, -d carries the request body, and --max-time caps how long the whole operation may take (30 seconds, which is the builder’s default request timeout — a command you received from somewhere else usually won’t have this flag at all).',
        ],
        bullets: CURL_CONVERT_CURL,
      },
      {
        heading: 'How to import a cURL command',
        paragraphs: [
          'There are two entry points, and they run the same parser, so it makes no difference which you use.',
          'The quicker one is the URL bar. Paste a whole command — anything starting with "curl" — into the request URL field and it is detected as a command rather than a URL, parsed, and applied to the entire request: method, headers, query string, body, and auth. A short notice confirms what was imported, along with any warnings. This is triggered by the paste itself, so typing a command out character by character won’t do it. The other entry point is the "Import cURL" button above the request, which opens a textarea sized for a multi-line command and shows parse errors and warnings in place before you dismiss it.',
          'Multi-line commands with backslash line continuations work, as do single quotes, double quotes, and backslash escapes inside them. Worth being clear about the boundary, though: this is a shell-like tokenizer, not a shell. It reads quoting and escaping, and it understands cURL’s common flags — but it does not run anything, expand variables, or interpret pipes, subshells, or command substitution.',
        ],
        bullets: [
          'Copy the cURL command from wherever you got it.',
          'Open the API Request Builder.',
          'Paste it into the URL field, or click "Import cURL" and paste it there.',
          'The command is parsed and the whole request is populated.',
          'Read any warnings — unrecognized flags are reported rather than silently dropped.',
          'Inspect and edit the request in the Params, Headers, Auth, and Body tabs.',
          'Send it, if you want to see the real response first.',
          'Open the code panel and pick the language you need.',
        ],
      },
      {
        heading: 'What the parser recognizes',
        paragraphs: [
          'The flags below are the ones that map onto something the request model can hold. Flags that only affect cURL’s own behavior on the command line — output files, retries, certificates, proxy settings — are consumed and discarded rather than guessed at, and anything genuinely unrecognized is reported as a warning so you know to check it by hand.',
        ],
        bullets: [
          '-X / --request — the HTTP method. An unsupported method is reported as an error rather than silently ignored.',
          '-H / --header — headers, one per flag.',
          '-d / --data / --data-raw / --data-binary / --data-ascii / --data-urlencode — the request body. The body type is inferred from the Content-Type header, or from the body’s own shape when there is no such header.',
          '-F / --form — multipart form fields. A value starting with @ marks it as a file field.',
          '-u / --user — becomes Basic Auth, filled into the Auth tab.',
          '-G / --get — folds the -d data into the query string instead of the body.',
          '-b / --cookie, -A / --user-agent, -e / --referer — added as the corresponding headers.',
          '--url — an explicitly flagged URL, instead of a bare one.',
          'Method inference: with no -X, a command carrying data or form fields is treated as POST, and one carrying neither as GET.',
        ],
      },
      {
        heading: 'Convert cURL to JavaScript Fetch',
        paragraphs: [
          'With the request imported, the code panel produces this. The mapping is close to one-for-one with the flags above: the URL is the first fetch() argument, -X becomes method, each -H becomes an entry in the headers object, and -d becomes body — here as JSON.stringify() over the parsed object, because the body is valid JSON.',
          'Two things have no cURL counterpart. credentials is a browser-only setting controlling whether cookies ride along on a cross-origin request; cURL has no equivalent concept, which is why the generated command omits it. And the timeout becomes an AbortController with a setTimeout that aborts it, wrapped in try/finally to clear the timer — the browser Fetch API has no timeout option, so this is the standard way to express one.',
        ],
        bullets: CURL_CONVERT_FETCH,
      },
      {
        heading: 'Convert cURL to Axios',
        paragraphs: [
          'The same request as an Axios call. Axios takes a single config object, so method, url, and headers all become properties of it. The body goes in data — and note it is a plain object, not a string: Axios serializes JSON itself, so there is no JSON.stringify() here.',
          'The timeout is a native timeout option in milliseconds, which is why there is no AbortController in this version. The comment at the top is generated too, not editorial: Axios has no direct equivalent of Fetch’s credentials mode, so rather than emit a setting that would misrepresent the behavior, the generator says so.',
        ],
        bullets: CURL_CONVERT_AXIOS,
      },
      {
        heading: 'Convert cURL to Python Requests',
        paragraphs: [
          'The Python version uses the requests library. The method becomes the function called — requests.post() here — with the URL as the first argument.',
          'The body is passed as json=, which is the idiomatic form: requests serializes the dict and would set the JSON Content-Type itself, though the explicit header from the original command is carried through as well. Headers go in headers= as a dict. Enabled query parameters would appear as params=; this example has none, so the URL is passed whole. timeout= takes seconds rather than milliseconds, so the builder’s 30000 ms becomes 30.',
        ],
        bullets: CURL_CONVERT_PYTHON,
      },
      {
        heading: 'Convert cURL to Node.js',
        paragraphs: [
          'Node.js has had a global fetch() since v18, so this version is the Fetch code minus the browser-specific parts: no credentials, since there is no browser cookie jar, and the timeout uses AbortSignal.timeout() instead of hand-wiring an AbortController. There is also no forbidden-header restriction here — headers a browser would refuse to let script set, such as User-Agent or Cookie, are kept in the Node version because Node will happily send them.',
        ],
        bullets: CURL_CONVERT_NODE,
      },
      {
        heading: 'Why the generated code doesn’t look like the cURL command',
        paragraphs: [
          'Equivalent HTTP requests look quite different across languages, because each client models the same concepts its own way. A generated snippet that reads nothing like the original command is usually correct, not wrong. The differences worth knowing:',
        ],
        bullets: [
          'Timeouts: cURL has --max-time in seconds, browser Fetch has no timeout at all and needs an AbortController, Node has AbortSignal.timeout(), Axios has a native timeout in milliseconds, and Python Requests has timeout= in seconds.',
          'JSON bodies: cURL and Fetch send a string, so the body is stringified. Axios (data=) and Python (json=) take a real object or dict and serialize it themselves.',
          'Credentials and cookies: Fetch’s credentials mode is a browser cookie-jar concept with no cURL, Node, or Axios equivalent, so it appears only in the browser Fetch output.',
          'Forbidden headers: browser Fetch silently refuses to let scripts set headers such as Cookie, Host, and User-Agent, so the browser output omits them and says which it dropped. cURL, Node, and Python all send them.',
          'CORS: the browser enforces it on the Fetch and Axios-in-a-browser versions. cURL, Node, and Python are not browsers and are not subject to it.',
        ],
      },
      {
        heading: 'Converting an authenticated cURL command',
        paragraphs: [
          'Most real commands carry a credential. A typical one looks like this:',
          'On import, an Authorization header with a Bearer prefix is recognized specifically: the header is removed and the Auth tab is switched to Bearer with the token filled in, so you can see and edit it as a credential rather than as a raw string. A -u user:password flag becomes Basic Auth the same way. Any other authentication header — an X-Api-Key, say — stays in the Headers tab as an ordinary header, which is still perfectly usable.',
          'Two cautions. First, $TOKEN in a shell command is shell syntax: your shell substitutes the real value before cURL ever sees it. Paste the command here and the literal text "$TOKEN" is imported, because nothing is expanding it — replace it with the real token, or better, with a {{token}} environment variable. Second, once a real credential is in the request, be careful what you copy out of it: generated code and generated cURL both contain the resolved value in plain text.',
        ],
        bullets: [
          'curl https://api.example.com/users \\',
          '  -H "Authorization: Bearer $TOKEN"',
        ],
      },
      {
        heading: 'Making an imported request reusable',
        paragraphs: [
          'An imported command is hardcoded by definition — one host, one token, whatever the person who wrote it was pointing at. Replacing the parts that change with {{variable}} placeholders turns it into a request you can point at staging or production by switching environments, and keeps the credential out of the request itself.',
          'An environment is a named set of key/value pairs; the active one resolves any {{name}} in the URL, headers, params, or body at send time. Create one per target — Local, Staging, Production — with the same variable names and different values. Note that the code and cURL generators resolve variables into their real values, since the point of copying a command is to be able to run it. The authentication guide below covers environments and credential handling in more detail.',
        ],
        bullets: [
          'https://api.example.com/users — hardcoded to one host.',
          '{{baseUrl}}/users — resolved from whichever environment is active.',
          'Bearer $TOKEN — shell syntax, not resolved by this tool.',
          '{{token}} — resolved from the active environment.',
        ],
      },
      {
        heading: 'Common cURL conversion problems',
        paragraphs: [
          'These are the real limits, and most of them come from the gap between a terminal and a browser rather than from the parsing itself.',
        ],
        bullets: [
          'Shell constructs — pipes, subshells, $(...) command substitution, and environment variables like $TOKEN are shell features. The parser reads quoting and escaping but does not execute anything, so these arrive as literal text. Substitute real values before importing, or swap them for {{variables}} after.',
          'Unusual quoting — commands copied out of PowerShell, a YAML file, a JSON string, or a chat client that has "helpfully" replaced straight quotes with curly ones may not tokenize as intended. If the body or a header looks wrong after import, that is usually why; fix it in the relevant tab.',
          'Browser-forbidden headers — Cookie, Host, User-Agent, Referer and similar are imported and visible, but a browser will not let script code set them. The Fetch generator drops them and tells you which; the Node and Python versions keep them.',
          'Cookies — a -b/--cookie flag imports as a Cookie header, which is exactly that forbidden case. Cookies in a browser come from the cookie jar and the credentials setting, not from a header you set by hand.',
          'File uploads — -F \'file=@photo.png\' imports as a file field, and a warning says so, but the file itself cannot be read from a pasted command. Attach the local file yourself in the Body tab before sending.',
          'Unrecognized flags — reported as warnings rather than silently ignored. Flags that only shape cURL’s own behavior (--output, --retry, --cert, --proxy) have no request-model equivalent and are dropped by design.',
        ],
      },
      {
        heading: 'Works in cURL, fails in the browser',
        paragraphs: [
          'This is the single most common surprise after a conversion, and it is not a conversion bug. cURL runs in a terminal and is not a browser: it has no origin, so the same-origin policy and CORS simply do not apply to it. A request that succeeds from your terminal can still be blocked when the identical request is made from browser JavaScript.',
          'If the generated Fetch or Axios code fails from a web page while the original command works, the cause is almost always one of: a CORS policy the API has not opened up for your origin, a credentials/cookie policy mismatch, a header the browser refuses to send, or cookies that exist in your terminal session but not in the browser. The CORS guide linked below covers what to actually do about it, which depends on whether you control the API.',
        ],
      },
      {
        heading: 'Test the request before you ship the code',
        paragraphs: [
          'Generating code from a command you have not run just moves the uncertainty into your codebase. The useful order is to import, send, read the response, fix whatever is wrong, and only then generate — that way the snippet you paste is one you have already seen work.',
          'Open the example below to see the whole loop on a request that is safe to actually send. It arrives pre-filled and idle; nothing is sent until you press Send.',
        ],
        examples: [CURL_CONVERT_EXAMPLE],
      },
    ],
    faq: [
      {
        question: 'How do I convert a cURL command to fetch()?',
        answer:
          'Paste the command into the API Request Builder — either into the URL field or through the "Import cURL" button — and it is parsed into an editable request. Open the code panel and choose JavaScript (Fetch) to get the equivalent code, with the URL, method, headers, and body already mapped across.',
      },
      {
        question: 'Why does the generated fetch() code have an AbortController when my cURL command didn’t?',
        answer:
          'Because the request has a timeout and the browser Fetch API has no timeout option. An AbortController aborted by a setTimeout is the standard way to express one. cURL uses --max-time, Axios uses a native timeout option, and Python Requests uses timeout= — same intent, four different mechanisms.',
      },
      {
        question: 'Does the importer handle $TOKEN and other shell variables?',
        answer:
          'No, and that is the correct behavior. Your shell expands $TOKEN before cURL ever runs, so a pasted command still containing the literal text has nothing to expand it. Replace it with the real value, or with a {{token}} environment variable resolved from whichever environment is active.',
      },
      {
        question: 'Why does my converted request fail in the browser but work in cURL?',
        answer:
          'Almost always CORS or another browser-only restriction. cURL has no origin, so the same-origin policy does not apply to it; browser JavaScript is subject to the API’s CORS policy, its credentials rules, and a list of headers scripts are not allowed to set. See the CORS guide for the fix.',
      },
      {
        question: 'Can I convert a cURL command with a file upload?',
        answer:
          'The -F \'field=@file\' flags import as file fields and a warning tells you so, but the file contents cannot be read from a pasted command — there is no file, only its name. Attach the file yourself in the Body tab before sending.',
      },
    ],
    // Capped at three deliberately: getRelatedGuides only renders three, so a longer
    // list would just be data nothing displays. The form-data and how-to-test-an-api
    // guides both link here indirectly via the API Request Builder page's guide list.
    relatedSlugs: ['json-post-request-example', 'authentication-testing-examples', 'what-is-a-cors-error'],
    ctaText: 'Convert a cURL command yourself.',
    ctaToolHref: '/tools/developer/api-request-builder',
    ctaToolLabel: 'Try the free API Request Builder',
  },
  {
    slug: 'how-to-write-dbml',
    title: 'How to Write DBML: A Guide to Diagramming Your Database Schema',
    description:
      'DBML syntax explained — tables, columns, column settings, and Ref relationships — with a practical walkthrough of writing a schema that renders as a diagram.',
    category: 'developer-tools',
    readTimeMinutes: 9,
    publishedDate: '2026-08-16',
    updatedDate: '2026-08-16',
    intro: [
      'DBML (Database Markup Language) is a small, plain-text language for describing a database schema — tables, columns, and the relationships between them — that’s built specifically to be turned into a diagram, rather than run against a database. You write it once and get a readable ER diagram out of it, without dragging boxes around by hand or reverse-engineering one from an existing database.',
      'This guide walks through the syntax one piece at a time — tables, columns, column settings, and relationships — then how to work with it efficiently once a schema has more than a couple of tables.',
    ],
    sections: [
      {
        heading: 'Defining a table',
        paragraphs: [
          'A table is a `Table` block with a name and, inside braces, one line per column. Each column line is just a name followed by a type — no commas, no semicolons.',
        ],
        bullets: [
          'Table users {',
          '  id integer',
          '  username varchar',
          '  created_at timestamp',
          '}',
        ],
      },
      {
        heading: 'Column settings',
        paragraphs: [
          'Square brackets after a column’s type attach settings to it — constraints and metadata that shape how the column is drawn and (if you export the DBML elsewhere) how a real database would enforce it. Multiple settings are comma-separated inside one pair of brackets.',
        ],
        bullets: [
          'primary key (or the shorthand pk) — marks the column as the table’s primary key.',
          'not null — the column is required.',
          'unique — no two rows can share a value.',
          'increment — an auto-incrementing value, typically paired with a primary key.',
          'default: value — a default value, e.g. default: 0 or default: `now()` for an expression.',
          'note: \'text\' — a short annotation shown alongside the column, useful for documenting intent without a separate wiki page.',
        ],
      },
      {
        heading: 'Relationships with Ref',
        paragraphs: [
          'A `Ref` line is what turns a set of separate tables into a connected diagram — it declares a foreign key relationship and draws the connecting line between the two tables. The symbol in the middle says which side is the "many": `>` means the left table has many rows per one row on the right, `<` is the reverse, and `-` is one-to-one.',
          'Refs can be declared inline, right after the table they belong to, or gathered at the bottom of the file — both are read identically. For a schema with more than a handful of relationships, grouping them at the end tends to be easier to scan than hunting through each table for its foreign keys.',
        ],
        bullets: [
          'Ref: posts.user_id > users.id',
          'Ref: comments.post_id > posts.id',
          'Ref: profiles.user_id - users.id',
        ],
      },
      {
        heading: 'Indexes and notes',
        paragraphs: [
          'An `indexes` block inside a table declares which columns are indexed, including composite indexes across multiple columns — useful for documenting query performance decisions alongside the schema they apply to, rather than in a separate migration file no one reads.',
          'A standalone `Note` (either at the table level or as its own top-level block) documents intent that doesn’t belong on any single column — why a table exists, a constraint the diagram can’t express, a TODO for a future migration.',
        ],
        bullets: [
          'indexes {',
          '  (user_id, created_at)',
          '  email [unique]',
          '}',
        ],
      },
      {
        heading: 'Working efficiently: templates, import/export, and sharing',
        paragraphs: [
          'Starting from a blank editor for a common shape — a blog, an e-commerce schema, a basic users/posts setup — usually costs more time than it saves. Starting from a template and renaming tables to match your actual schema gets to a working diagram faster than typing every table from scratch.',
          'Import an existing .dbml file to pick up an export from elsewhere, or export the current schema as DBML, PNG, or SVG once it’s ready to share or paste into documentation. A share link works without any account or server round-trip — it compresses the DBML itself into the URL, so opening the link reconstructs the exact schema on the other end.',
          'Everything — the schema text and the diagram layout you’ve dragged tables into — is saved to this browser’s local storage automatically. Nothing is uploaded anywhere unless you explicitly export or share it.',
        ],
      },
    ],
    faq: [
      {
        question: 'Do I need a database connection to use DBML?',
        answer:
          'No — DBML is just text describing a schema; it never connects to a real database. You can design a schema entirely on paper (or in the editor) before a database exists, or document one that already does, without giving the tool any credentials or access.',
      },
      {
        question: 'Does DBML support enums?',
        answer:
          'DBML’s `enum` syntax is recognized without erroring, but it isn’t drawn on the diagram — so it’s fine to include for documentation purposes, but don’t rely on it to show up visually. Tables, columns, column settings, and Ref relationships are what actually render.',
      },
      {
        question: 'What’s the difference between `>` and `<` in a Ref?',
        answer:
          'They describe the same relationship from opposite directions, not two different relationship types. `posts.user_id > users.id` and `users.id < posts.user_id` mean exactly the same thing: many posts reference one user. Pick whichever direction reads more naturally for the line you’re writing.',
      },
      {
        question: 'Can I turn an existing database into a DBML diagram?',
        answer:
          'Only if you already have (or can export) its schema as DBML — this tool renders DBML you provide, it doesn’t connect to or introspect a live database. Some database clients and ORMs can export a schema as DBML directly, which you can then paste in as a starting point.',
      },
    ],
    relatedSlugs: [],
    ctaText: 'Put this into practice with a real schema.',
    ctaToolHref: '/tools/developer/dbml-diagram-builder',
    ctaToolLabel: 'Try the free DBML Diagram Builder',
  },
  {
    slug: 'import-postman-collection-without-postman',
    title: 'How to Open a Postman Collection Without Installing Postman',
    description:
      'Open a .postman_collection.json file without installing Postman — import a Collection v2.0/v2.1 in the browser and inspect, edit, and test its requests.',
    category: 'developer-tools',
    readTimeMinutes: 10,
    publishedDate: '2026-08-17',
    updatedDate: '2026-08-17',
    intro: [
      'Someone hands you a file called something like `orders-api.postman_collection.json`. It came from an API vendor, a teammate, a README, or a folder in an old project nobody has touched in a year. You need to see what endpoints it contains, understand how they are organized, and probably send two or three of them to check something.',
      'None of that requires installing a desktop application, creating an account, or signing into a workspace. The file is just JSON, and the API Request Builder can read it: import the collection, review a preview of what it found, and get an editable set of requests you can inspect and send from the browser.',
      'This guide walks through that import end to end — what the importer supports, what the preview tells you before anything is saved, how folders, variables, auth, and bodies are translated, and which Postman features deliberately do not come across. Being clear about the second list matters as much as the first: the goal is to bring request definitions into a lightweight browser client, not to reproduce the Postman runtime.',
    ],
    sections: [
      {
        heading: 'What a Postman collection file actually is',
        paragraphs: [
          'A Postman collection is a single JSON document describing a set of API requests and the configuration around them. Despite the `.postman_collection.json` extension, there is nothing binary or proprietary about it — you can open it in any text editor and read it.',
          'Inside, a collection typically carries a handful of things worth knowing about before you import one:',
        ],
        bullets: [
          'Requests — method, URL, query parameters, headers, body, and per-request auth.',
          'Folders — nested groups of requests, which Postman stores as items that themselves contain items.',
          'Variables — collection-level `{{placeholder}}` declarations with default values.',
          'Authentication — an auth block that can be set on the collection, on a folder, or on a single request.',
          'Request bodies — raw text or JSON, URL-encoded form fields, multipart form data, GraphQL, or a binary file reference.',
          'Scripts — optional pre-request and test JavaScript, stored as plain text in the file.',
        ],
      },
      {
        heading: 'Which Postman formats are supported',
        paragraphs: [
          'The importer supports Postman Collection schema v2.0 and v2.1 — the two formats Postman has exported for years, and what you will almost certainly have. It identifies the format from the `info.schema` URL at the top of the file:',
        ],
        bullets: [
          '{',
          '  "info": {',
          '    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"',
          '  }',
          '}',
        ],
      },
      {
        heading: 'What happens to a file the importer cannot read',
        paragraphs: [
          'Rejection and partial import are two different outcomes, and it is worth knowing which one you are looking at.',
          'A file is rejected outright — nothing is imported, and you see a single error — when it is not valid JSON, when it is empty, when it is larger than the 5MB import limit, when `info.schema` is missing or is not a v2.0/v2.1 collection URL (the older v1 format and non-Postman JSON both land here), when it has no `item` array, or when the walk finishes without finding a single importable request.',
          'Everything short of that is a partial import with warnings. Malformed collection-level metadata is tolerated rather than treated as fatal, an item that is neither a folder nor a recognizable request is skipped quietly, and a request whose HTTP method the tool does not model is counted as skipped rather than guessed at. The preview reports both the warnings and the skipped count so you can decide whether the result is good enough before committing it.',
        ],
      },
      {
        heading: 'Step by step: import the collection',
        paragraphs: [
          'The whole flow lives in the API Request Builder\'s saved-requests drawer. Nothing is written to your browser storage until the final step.',
        ],
        bullets: [
          '1. Open the API Request Builder at /tools/developer/api-request-builder.',
          '2. Click "Saved" in the toolbar to open the drawer on its Saved tab — this is the collections browser.',
          '3. Click "Import Postman Collection" in the row of actions at the top of that panel.',
          '4. In the "Import Postman Collection" dialog, click "Choose a Postman Collection .json file" and pick your `.postman_collection.json` file.',
          '5. Read the preview that appears — the collection name, request count, folder count, variable count, and any warnings.',
          '6. If it is the wrong file, click "Choose a different file"; if it is wrong entirely, click "Cancel".',
          '7. Click the "Import N requests" button to commit it.',
          '8. The drawer refreshes and the new collection appears in the collections browser, named after the source collection with " (Imported)" appended.',
          '9. Expand its folders and click a request to load it into the editor.',
          '10. Review the URL, params, headers, body, and Auth tab, fill in whatever the warnings told you was missing, and press Send when you are ready.',
        ],
      },
      {
        heading: 'The preview screen, and why it comes first',
        paragraphs: [
          'Selecting a file parses and converts it entirely in memory. It does not create a collection, does not save any requests, does not create an environment, and does not touch anything already in your browser storage. Only the Import button commits the result, so picking the wrong file costs you nothing but a second click.',
          'What the preview shows you is deliberately the information you need to make that decision:',
        ],
        bullets: [
          'The collection name read from `info.name`.',
          'The number of requests that converted successfully.',
          'The number of folders that will be created.',
          'The number of variables that will be collected into an environment.',
          'A list of warnings — unsupported auth types, body modes that could not be represented, flattened folders, pre-request and test scripts, dynamic variables, and blanked secret-shaped variable values.',
          'A count of requests skipped for an unsupported method or malformed structure, when there are any.',
        ],
      },
      {
        heading: 'How folders and requests are mapped',
        paragraphs: [
          'The importer walks the Postman item tree and rebuilds it as a collection containing folders and saved requests. A structure like this:',
        ],
        bullets: [
          'Postman Collection',
          '├── Users',
          '│   ├── Get Users',
          '│   └── Create User',
          '└── Orders',
          '    └── List Orders',
        ],
      },
      {
        heading: 'The folder depth limit',
        paragraphs: [
          '...becomes one collection with a "Users" folder and an "Orders" folder holding the same three requests, with names taken from each item\'s `name` field. A request with no name gets a `METHOD url` fallback rather than an empty row, and names longer than 80 characters are truncated.',
          'Nesting is not unlimited. The tool caps folders at three levels deep, which is the same limit the manual "New subfolder" button enforces, so an imported structure can never be deeper than one you could build by hand. When a Postman folder sits below that depth, it is not created and it is not dropped either — its contents are flattened into the deepest folder that could be created, and the walk continues from there. Every request still lands somewhere. The preview warns you when this happened and how many folders it affected, so a deeply nested source collection never silently loses its shape without telling you.',
        ],
      },
      {
        heading: 'Variables stay as variables',
        paragraphs: [
          'Postman\'s `{{baseUrl}}` syntax and the API Request Builder\'s environment variable syntax are the same, which makes this the easiest part of the import. A request URL written as `{{baseUrl}}/users/{{userId}}` is imported exactly as that string. It is not resolved, not flattened into a concrete URL, and not rewritten — the template survives, so switching environments later still works the way you would expect.',
          'Postman\'s older `:id` path-variable syntax is the one thing that gets rewritten: `/users/:userId` becomes `/users/{{userId}}`, so it lines up with the same variable system as everything else. A declared value is never substituted in.',
          'Variable *declarations* are handled separately. Collection-level `variable` entries, folder-level ones, and URL path variables are merged into a single flat list — more specific scopes override less specific ones by key — and if that list is non-empty, one new environment is created alongside the collection, named after it with " (Imported)". Values whose key looks like a secret (`token`, `password`, `api_key`, `secret`, `auth`, `credential`) are imported with an empty value and flagged in the warnings, rather than written into local storage in plaintext.',
          'One thing this is not: importing a Postman environment file. The tool reads variables declared *inside the collection document*. If your team keeps real values in a separate `.postman_environment.json` export, those values are not imported, and the generated environment is not automatically made active — you select it from the environment picker and fill in what is blank.',
        ],
      },
      {
        heading: 'Authentication mapping',
        paragraphs: [
          'Postman lets auth be declared on the collection, on a folder, or on an individual request, and the importer honors that inheritance chain: an item that declares its own `auth` wins, including an explicit `noauth` used to turn inheritance off; an item with no `auth` key at all inherits from its nearest ancestor.',
          'Three types map onto the tool\'s own auth model:',
        ],
        bullets: [
          'Bearer — the token value is carried across into the Auth tab\'s Bearer field.',
          'Basic — username and password map to the Basic auth fields.',
          'API key — the key name and value map across, and the key is placed in the header or the query string depending on the collection\'s `in` setting.',
          'No auth — imported as no auth, which is also what the request falls back to in every other case.',
        ],
      },
      {
        heading: 'What happens to unsupported auth types',
        paragraphs: [
          'Anything else — OAuth 2.0, AWS Signature, Digest, Hawk, NTLM, EdgeGrid, or a type the tool has never seen — is not faked. The request still imports, with everything else intact, but its auth is left as none and a warning names the type so you know which requests need configuring by hand. OAuth 2.0 in particular is not imported, and no token is fetched or refreshed on your behalf.',
          'Credential values themselves follow the same rule as every other saved request in the tool. Values are carried through the conversion — whether they are `{{token}}` templates or literal secrets — and then redacted at the point of saving: bearer tokens, basic passwords, API key values, and credential-shaped headers such as `Authorization`, `Cookie`, and `X-Api-Key` are all blanked before anything reaches local storage. A literal password that lived in the collection file does not end up persisted, which also means you may need to re-enter it in the editor before sending.',
        ],
      },
      {
        heading: 'Request bodies',
        paragraphs: [
          'Bodies are converted for every method that can carry one; GET and HEAD requests import without a body regardless of what the file contains.',
        ],
        bullets: [
          'Raw JSON — imported as a JSON body, but only when the collection marks the language as JSON *and* the text actually parses. Otherwise it comes in as plain text rather than being labeled JSON on a guess.',
          'Raw text — imported as a text body, unchanged.',
          'URL-encoded — each field becomes a form row, with Postman\'s disabled flag preserved as an unchecked row.',
          'Multipart form data — text fields map straight across; file fields become placeholder rows carrying only the original file name, and a warning tells you they need re-selection.',
          'GraphQL — best-effort imported as raw text so the query is still readable, with a warning that the tool does not execute GraphQL.',
          'Binary file body — not imported, with a warning; attach the file yourself.',
        ],
      },
      {
        heading: 'Why file fields cannot come across',
        paragraphs: [
          'A Postman collection stores a file upload as a path on the machine that created it — something like a `src` pointing at a folder on your teammate\'s laptop. That is a string, not the file. A browser cannot read a path from a JSON document and turn it into a file, and it should not be able to.',
          'So multipart file fields import as named placeholders with no content. The field name, its enabled state, and the original file name are preserved so you can see what the request expects; you pick the actual file from your own machine in the Body tab before sending. Nothing is invented to fill the gap.',
        ],
      },
      {
        heading: 'Postman features that are not imported',
        paragraphs: [
          'This is the part worth reading carefully, because the gap is intentional rather than accidental. The importer brings request *definitions* into a browser-based HTTP client. It does not implement the Postman runtime.',
          'Pre-request scripts and test scripts are never executed. They are not even parsed as code — the importer only checks whether a script block is non-empty so it can count it, then reports "N pre-request scripts not imported" and "N test scripts ignored" in the warnings. Whatever those scripts did — signing a request, fetching a token, chaining a value from one response into the next request — you now do by hand or not at all.',
          'Postman\'s dynamic variables are detected but not evaluated. Names like `{{$randomUUID}}` and `{{$timestamp}}` are left in place as literal text and listed in the warnings, so they are visible rather than silently masquerading as a normal resolvable variable. Nothing generates a value for them at send time.',
          'Also not carried across: collection-level test runners, monitors, mock servers, workspace sync, and the auth types listed above. If your collection depends on a script to work at all, importing it gives you a readable, editable starting point rather than a working request — which is usually still the thing you wanted.',
        ],
      },
      {
        heading: 'Security: an imported file is untrusted input',
        paragraphs: [
          'A collection someone sends you is a document from outside your control, and the import path treats it that way.',
          'No JavaScript from the file is executed. Scripts are counted and reported, never run. No request is sent as a side effect of importing — the importer produces saved requests, and a request only goes out when you press Send. No URL found in the file is fetched during import, and nothing in the file causes a remote resource to be loaded. Parsing is a guarded `JSON.parse` with a 5MB ceiling, so a malformed or oversized file produces a one-line error instead of a crash.',
          'On secrets, the honest version: literal credentials in the file do exist in memory during conversion and can be visible in the request editor after import — that is unavoidable, since showing you the request is the point. What is guaranteed is the persistence boundary. Saved requests go through the same redaction as everything else in the tool, blanking bearer tokens, basic passwords, API key values, and credential-shaped headers; secret-looking collection variables are blanked as well. Local storage is not encrypted, and this guide will not pretend otherwise — treat a collection full of production credentials with the same care you would treat any other file containing them.',
        ],
      },
      {
        heading: 'A worked example',
        paragraphs: [
          'Here is a trimmed collection — simplified for readability, not a complete export — with one folder and one GET request:',
        ],
        bullets: [
          '{',
          '  "info": {',
          '    "name": "Orders API",',
          '    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"',
          '  },',
          '  "variable": [{ "key": "baseUrl", "value": "https://api.example.com" }],',
          '  "item": [{',
          '    "name": "Orders",',
          '    "item": [{',
          '      "name": "List Orders",',
          '      "request": {',
          '        "method": "GET",',
          '        "url": "{{baseUrl}}/orders?status=open",',
          '        "header": [{ "key": "Accept", "value": "application/json" }]',
          '      }',
          '    }]',
          '  }]',
          '}',
        ],
      },
      {
        heading: 'What the importer makes of that example',
        paragraphs: [
          'The preview reports one request, one folder, and one variable. Importing creates a collection named "Orders API (Imported)" containing an "Orders" folder with a single saved request called "List Orders".',
          'That request is a GET to `{{baseUrl}}/orders` with `status=open` split out as a query parameter row and `Accept: application/json` as a header row. The URL keeps its template rather than being resolved. Alongside the collection, an environment named "Orders API (Imported)" is created with `baseUrl` set to `https://api.example.com` — created, but not activated, so you select it before sending if you want the variable to resolve.',
        ],
      },
      {
        heading: 'When this workflow is the right one',
        paragraphs: [
          'This import is aimed at a specific situation: you have a collection file and you need to understand or exercise what is in it, quickly, without setting up tooling around it. That covers more cases than it sounds like.',
        ],
        bullets: [
          'A vendor ships a Postman collection as their API documentation and you want to see the real endpoints.',
          'A teammate exports a collection and sends it over so you can reproduce something.',
          'An old repository has a collection checked in and nobody remembers what it covers.',
          'You need to hit two or three endpoints once, and standing up a full workspace for that is disproportionate.',
          'You want to move a handful of request definitions into a lightweight browser tool you can also generate cURL or code from.',
          'You are on a machine where you would rather not install anything.',
        ],
      },
      {
        heading: 'What to do after importing',
        paragraphs: [
          'Import, then read the warnings before you send anything — they are a to-do list for the gap between what the file described and what came across.',
          'Concretely: select the generated environment and fill in any variable that was blanked, configure auth by hand for requests whose type was not supported, obtain any OAuth token yourself and paste it into the Bearer field, re-attach files for multipart or binary bodies, and replace dynamic variables like `{{$timestamp}}` with real values. Anything a pre-request script used to compute is now yours to supply. Once a request sends cleanly, you can save it, copy it as cURL, or generate Fetch, Axios, Node, or Python code from it.',
        ],
      },
      {
        heading: 'How this compares to using Postman itself',
        paragraphs: [
          'These are different tools for overlapping jobs, and it would be dishonest to frame this as a replacement. Postman is a full API platform with a scripting runtime, test execution, collection runners, and team workspaces. This import path gives you none of that.',
          'What it gives you is speed for one specific task: reading and testing request definitions from a collection file, in a browser tab, with nothing installed. When that is genuinely what you need, the round trip through installing and configuring a desktop client is overhead. When you need scripts, chained tests, or a shared workspace, use the tool built for it.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can I open a .postman_collection.json file without installing Postman?',
        answer:
          'Yes. The file is plain JSON, and the API Request Builder imports Collection v2.0 and v2.1 exports directly in the browser — open the Saved drawer, click "Import Postman Collection", choose the file, and its requests and folders become an editable collection. Nothing is installed and no account is needed.',
      },
      {
        question: 'Which Postman collection versions are supported?',
        answer:
          'Schema v2.0 and v2.1, identified from the `info.schema` URL in the file. The older v1 format is not supported and is rejected with a clear message rather than being partially misread.',
      },
      {
        question: 'Does importing a collection send any of its requests?',
        answer:
          'No. Importing creates saved requests and nothing else. A request is only sent when you open it and press Send, so importing a collection full of destructive endpoints has no effect on its own.',
      },
      {
        question: 'Are pre-request and test scripts run?',
        answer:
          'Never. Script blocks are counted so the preview can tell you how many exist, but their contents are not parsed as code and not executed. Whatever a script did for the request, you will need to do manually.',
      },
      {
        question: 'Is OAuth 2.0 imported?',
        answer:
          'No. Bearer, Basic, API key, and explicit no-auth map across; OAuth 2.0, AWS Signature, Digest, Hawk, NTLM, and EdgeGrid do not. Those requests still import with everything else intact, but with auth left unset and a warning naming the type — you obtain the token yourself and set it in the Auth tab.',
      },
      {
        question: 'What happens to {{baseUrl}} and other variables?',
        answer:
          'They are preserved as templates, so `{{baseUrl}}/users/{{userId}}` stays exactly that. Variables declared in the collection are merged into a new environment created alongside it, though that environment is not made active automatically and secret-shaped values are imported blank.',
      },
      {
        question: 'Does it import my Postman environment file too?',
        answer:
          'No. Only variables declared inside the collection document are read. A separate `.postman_environment.json` export is not imported, so values kept there need to be entered in the environment editor.',
      },
      {
        question: 'What about file uploads in multipart requests?',
        answer:
          'The collection only stores a filesystem path from the machine that created it, which a browser cannot read. File fields import as placeholder rows carrying the original file name, and a warning tells you to re-select the file yourself before sending.',
      },
      {
        question: 'Are credentials from the collection saved to my browser?',
        answer:
          'Not in plaintext. Saved requests pass through the same redaction as everything else in the tool: bearer tokens, basic passwords, API key values, and credential-shaped headers are blanked before persisting, and secret-looking collection variables are imported empty. Local storage itself is not encrypted.',
      },
      {
        question: 'Why were some of my folders flattened?',
        answer:
          'Folders are capped at three levels deep — the same limit the manual "New subfolder" button uses. Anything deeper has its contents moved into the deepest folder that could be created rather than being dropped, and the preview warns you how many folders that affected.',
      },
    ],
    relatedSlugs: ['how-to-test-an-api', 'authentication-testing-examples', 'curl-to-fetch-axios-python'],
    ctaText: 'Open the API Request Builder and import your collection.',
    ctaToolHref: '/tools/developer/api-request-builder',
    ctaToolLabel: 'Try the free API Request Builder',
  },
  {
    slug: 'test-openapi-spec-online',
    title: 'How to Test an OpenAPI Spec Online',
    description:
      'Test an OpenAPI 3.0 or 3.1 spec online — import the JSON or YAML file in the browser and turn its endpoints into editable, sendable API requests.',
    category: 'developer-tools',
    readTimeMinutes: 10,
    publishedDate: '2026-08-17',
    updatedDate: '2026-08-17',
    intro: [
      'You already have an OpenAPI definition. A vendor published one, an internal team maintains one, or there is an `openapi.yaml` sitting in the repository you just cloned. What you actually want is to look at the endpoints it declares, see what parameters and request bodies they expect, check how authentication is meant to work, and send one or two of them to confirm the API behaves the way the document claims.',
      'Doing that by hand means reading the spec and rebuilding every request in a client: copy the server URL, paste the path, retype each query parameter, hand-write a JSON body that matches the schema. For anything more than one endpoint that is tedious, and it is easy to get a field name subtly wrong.',
      'The API Request Builder can import the specification instead. It parses an OpenAPI 3.0 or 3.1 document — JSON or YAML — shows you a preview of what it found, and creates a collection of editable saved requests grouped into folders. Nothing is sent during the import; you get a starting point you then edit and send yourself. This guide walks through that, and is equally clear about the parts of OpenAPI it deliberately does not map.',
    ],
    sections: [
      {
        heading: 'What an OpenAPI document describes',
        paragraphs: [
          'An OpenAPI document is a machine-readable description of an HTTP API, written as a single JSON or YAML file. It is documentation that a tool can act on rather than prose a human has to interpret.',
          'You do not need to know the whole specification to import one. In practice the parts that matter for turning a spec into requests are:',
        ],
        bullets: [
          'Paths — the URL templates the API exposes, such as `/users/{userId}`.',
          'Operations — the HTTP methods available under each path, with an `operationId`, `summary`, and `tags`.',
          'Parameters — values that go in the path, the query string, a header, or a cookie.',
          'Request bodies — the content types an operation accepts and the schema of each one.',
          'Servers — the base URLs the API is reachable at, optionally with `{variable}` placeholders.',
          'Security schemes — how the API expects to be authenticated, declared in `components.securitySchemes`.',
          'Components — reusable schemas, parameters, and schemes referenced elsewhere in the document via `$ref`.',
        ],
      },
      {
        heading: 'Which OpenAPI versions are supported',
        paragraphs: [
          'The importer accepts OpenAPI 3.0.x and OpenAPI 3.1.x. It reads the `openapi` field at the top of the document and requires a full three-part version — `3.0.3` and `3.1.0` are both fine.',
          'Swagger 2.0 is not supported. A document whose top-level key is `swagger` rather than `openapi` is rejected with a message naming the supported versions, and so is any other version string that does not match 3.0.x or 3.1.x. That rejection is deliberate: a 2.0 document has a different shape for bodies, parameters, and security, and half-interpreting it would produce requests that look plausible and are quietly wrong. If all you have is a Swagger 2.0 file, convert it to OpenAPI 3 first with a converter of your choice, then import the result.',
          'Within the supported range, both revisions of the schema dialect are handled — 3.0\'s `nullable` style and 3.1\'s JSON Schema 2020-12 style, including a `type` given as an array such as `["string", "null"]`.',
        ],
      },
      {
        heading: 'JSON and YAML both work',
        paragraphs: [
          'Either serialization imports the same way, and the file picker accepts `.json`, `.yaml`, and `.yml`.',
          'The format is determined by parsing, not by the extension. JSON is attempted first when the text starts like JSON, and YAML is used otherwise or as a fallback — so a `.yaml` file containing JSON, or a `.json` file that is actually YAML, still imports. If neither parser can read it, you get one short error rather than a stack trace. There is a 5MB ceiling on the file, which is generous for even a large multi-hundred-operation document.',
        ],
      },
      {
        heading: 'A small OpenAPI spec to try',
        paragraphs: [
          'Here is a complete, deliberately short OpenAPI 3.1 document. Save it as `demo-api.yaml` and use it as the file you import while following the steps below. It points at `https://httpbin.org`, a public request-echo service, so the requests it produces are safe to send once you fill in the path variable — though nothing about the import itself needs that server to be reachable.',
        ],
        bullets: [
          'openapi: 3.1.0',
          'info:',
          '  title: Demo API',
          '  version: 1.0.0',
          'servers:',
          '  - url: https://httpbin.org',
          'security:',
          '  - bearerAuth: []',
          'paths:',
          '  /anything/users/{userId}:',
          '    get:',
          '      operationId: getUser',
          '      summary: Get a user',
          '      tags: [Users]',
          '      parameters:',
          '        - name: userId',
          '          in: path',
          '          required: true',
          '          schema: { type: string }',
          '        - name: include',
          '          in: query',
          '          schema: { type: string, default: profile }',
          '      responses: { "200": { description: A single user } }',
          '  /anything/orders:',
          '    post:',
          '      operationId: createOrder',
          '      tags: [Orders]',
          '      requestBody:',
          '        content:',
          '          application/json:',
          '            schema:',
          '              $ref: "#/components/schemas/NewOrder"',
          '      responses: { "201": { description: Created } }',
          'components:',
          '  schemas:',
          '    NewOrder:',
          '      type: object',
          '      properties:',
          '        sku:',
          '          type: string',
          '        quantity:',
          '          type: integer',
          '  securitySchemes:',
          '    bearerAuth:',
          '      type: http',
          '      scheme: bearer',
        ],
      },
      {
        heading: 'Step by step: import the spec',
        paragraphs: [
          'The whole flow lives in the API Request Builder\'s saved-requests drawer, and nothing is written to your browser storage until the final step.',
        ],
        bullets: [
          '1. Open the API Request Builder at /tools/developer/api-request-builder.',
          '2. Click "Saved" in the toolbar to open the drawer on its Saved tab — the collections browser.',
          '3. Click "Import OpenAPI" in the row of actions at the top of that panel.',
          '4. In the "Import OpenAPI" dialog, click "Choose a .json, .yaml, or .yml file" and pick your specification.',
          '5. Read the preview that appears — the API title plus endpoint, folder, server, and security-scheme counts.',
          '6. Check that those counts look like the spec you expected, and read any warnings listed under them.',
          '7. If it is the wrong file, click "Choose a different file"; to back out entirely, click "Cancel".',
          '8. Click the "Import N requests" button to commit it.',
          '9. The drawer refreshes and the new collection appears, named after the API title with " (Imported)" appended.',
          '10. Expand a folder and click a request to load it into the editor.',
          '11. Fill in what the document could not supply — the auth token, any `{{pathVariable}}` the URL still contains — and select the generated environment from the environment picker.',
          '12. Press Send when you are ready. Importing never sends anything on its own; every request goes out only when you press Send.',
        ],
      },
      {
        heading: 'The preview, and why it comes first',
        paragraphs: [
          'Choosing a file parses, validates, and converts the whole document in memory. It does not create a collection, does not save any requests, does not create an environment, and does not touch anything already in your browser storage. Only the Import button commits the plan, so picking the wrong file costs you a second click and nothing else.',
          'The preview shows exactly the information you need to make that call:',
        ],
        bullets: [
          'The API title, read from `info.title`.',
          'The number of endpoints — operations that converted successfully, and so the number of saved requests you will get.',
          'The number of folders that will be created, one per tag actually used.',
          'The number of servers declared in the document.',
          'The number of security schemes declared in `components.securitySchemes`.',
          'A list of warnings, aggregated into counts rather than one line per operation.',
          'A count of operations skipped for an unsupported method or malformed structure, when there are any.',
        ],
      },
      {
        heading: 'How paths and operations become requests',
        paragraphs: [
          'Each method under each path becomes one saved request. Its name comes from `operationId` when there is one, falling back to the method plus the `summary`, then to the method plus the path; names longer than 80 characters are truncated.',
          'The URL is built as a template rather than a concrete address. OpenAPI\'s single-brace path templating is rewritten into the tool\'s own `{{name}}` variable syntax and prefixed with a `baseUrl` variable, so `/users/{userId}` becomes `{{baseUrl}}/users/{{userId}}`. No fake value is ever substituted for a path parameter — the placeholder stays visible so you know it is yours to fill in.',
          'Parameters are mapped by their `in` value:',
        ],
        bullets: [
          'Path parameters become `{{variable}}` placeholders in the URL, reusable across requests that share them.',
          'Query parameters become request parameter rows, pre-filled from the parameter\'s `example`, first named `examples` entry, schema `default`, or a value generated from its schema — in that order.',
          'Header parameters become header rows, filled the same way.',
          'Headers a browser refuses to let script set — `Host`, `Content-Length`, `Cookie`, `Origin`, `Referer` and the rest of that list — are skipped rather than imported as rows that would never actually be sent, and counted in a warning.',
          'Cookie parameters are not supported and are skipped, also with a warning.',
        ],
      },
      {
        heading: 'Where parameters can come from',
        paragraphs: [
          'Two details in that mapping are worth calling out because they are easy to miss when reading a spec by eye. Parameters declared once at the path-item level apply to every operation under that path, and they are merged in; an operation-level parameter with the same name and location wins over the shared one. Both can be a `$ref` to a reusable component.',
          'The other is that this is best-effort, not a full-fidelity translation. Parameter serialization details — `style`, `explode`, `allowReserved`, deep-object query syntax — are not modelled. A parameter arrives as a plain key/value row you can edit, which covers the overwhelming majority of real APIs but is not the same as reproducing every encoding rule the specification permits.',
        ],
      },
      {
        heading: 'Tags become folders',
        paragraphs: [
          'Operations are grouped by tag. The first tag on an operation places it in a folder of that name, and every operation with that tag lands in the same folder. An operation with no tags goes into a folder called "General", so nothing ends up loose at the collection root.',
          'A spec tagging its operations `Users` and `Orders` produces:',
        ],
        bullets: [
          'Users',
          '  ├── List Users',
          '  └── Get User',
          'Orders',
          '  └── Create Order',
        ],
      },
      {
        heading: 'Folder depth is never a problem here',
        paragraphs: [
          'Tag folders are always exactly one level deep. OpenAPI tags are a flat list, not a tree, so there is nothing to nest and no depth limit to run into — unlike a Postman import, where a deeply nested source structure has to be flattened to fit. If an operation carries several tags, only the first one is used to place it; the others are not turned into additional folders or duplicate requests.',
        ],
      },
      {
        heading: 'Servers become a reusable baseUrl',
        paragraphs: [
          'This is the part that makes an imported collection worth keeping rather than throwing away after one send. A document declaring:',
        ],
        bullets: [
          'servers:',
          '  - url: https://api.example.com/v1',
        ],
      },
      {
        heading: 'How the environment is created',
        paragraphs: [
          '...produces a new environment, named after the API title with " (Imported)", holding a single `baseUrl` variable set to that URL. Every imported request points at `{{baseUrl}}/users` rather than a hard-coded host, so the same collection can be run against staging, production, or a local server by editing one value in one place instead of every request.',
          'The first declared server is the one used. If the document declares several, the extras are counted in the preview\'s server count but not turned into separate environments — you add those yourself in the environment editor, which is exactly where you would change `baseUrl` anyway. If a server URL contains `{variable}` placeholders, each one is replaced with the default declared for it in `variables`, so `https://{region}.api.example.com` with a `region` default of `eu` becomes `https://eu.api.example.com`. There is no separate server-variable picker; the substituted URL is a normal environment value you can edit.',
          'If the document declares no servers at all, an environment is still created with an empty `baseUrl` and a warning tells you to set it before sending. That way the request URLs stay consistent either way.',
          'The import does not activate that environment. It is created alongside the collection and you select it from the environment picker, which also keeps an import from silently changing what a request you were already working on resolves to. Path variables such as `{{userId}}` are not added to it either — those are per-call values, not configuration, so you either add them as variables yourself or type a concrete value into the URL before sending.',
        ],
      },
      {
        heading: 'How request bodies are generated',
        paragraphs: [
          'For any method that can carry a body — everything except GET and HEAD — the importer looks at the operation\'s `requestBody` content map and picks one content type, preferring `application/json`, then `application/x-www-form-urlencoded`, then `multipart/form-data`, then `text/plain`, and finally any `+json` media type such as `application/merge-patch+json`. JSON becomes a raw JSON body; the form types become editable field rows, with `format: binary` properties turned into file rows you attach yourself; `text/plain` becomes a text body.',
          'The value itself is resolved in a fixed order of preference: an explicit `example` on the media type, then the first entry of an `examples` map, then the schema\'s `default`, and only then a value generated from the schema. A schema like:',
        ],
        bullets: [
          'type: object',
          'properties:',
          '  name:',
          '    type: string',
          '  age:',
          '    type: integer',
        ],
      },
      {
        heading: 'What schema-generated bodies look like',
        paragraphs: [
          '...has no example to borrow, so a sample is generated from the types — an empty string for `name`, zero for `age`:',
        ],
        bullets: [
          '{',
          '  "name": "",',
          '  "age": 0',
          '}',
        ],
      },
      {
        heading: 'The limits of generated examples',
        paragraphs: [
          'That output is deterministic and meant to be edited, not to be a valid payload the API will accept. Generation is a pragmatic best effort rather than a complete JSON Schema implementation. `example`, `default`, and the first `enum` value always win over a generated value at any level. `allOf` subschemas are merged into one flat object, since composing a base schema with an extension is the common case; `oneOf` and `anyOf` expand only their first branch. Well-known string formats get a recognizable placeholder — an `email` becomes `user@example.com`, a `uuid` becomes an all-zero UUID, a `date-time` becomes `2024-01-01T00:00:00Z`.',
          'There are guardrails against pathological documents: recursion stops after eight levels, a genuinely circular reference stops expanding rather than looping forever, and an object expands at most forty properties so a schema with hundreds of fields does not produce an unreadable wall of JSON. Constraint keywords like `pattern`, `minLength`, and `required` are not used to synthesize conforming values. If a schema is complex, expect to edit the body — that is what it is there for.',
        ],
      },
      {
        heading: 'Security schemes that map across',
        paragraphs: [
          'The importer reads `components.securitySchemes` together with the operation\'s `security` requirement, falling back to the document-level `security` when the operation does not declare its own. An explicit empty `security: []` on an operation is honored as "no auth", which is different from omitting the field.',
          'Three scheme types map onto the tool\'s auth model:',
        ],
        bullets: [
          'HTTP bearer (`type: http`, `scheme: bearer`) — the Auth tab is set to Bearer with the token left empty.',
          'HTTP basic (`type: http`, `scheme: basic`) — the Auth tab is set to Basic with username and password left empty.',
          'API key in a header or the query string (`type: apiKey`) — the key name and its location are carried across; the value is left empty.',
        ],
      },
      {
        heading: 'Why no credential is ever filled in',
        paragraphs: [
          'An OpenAPI document describes how to authenticate, not what your credentials are. The importer sets up the auth configuration and always leaves every secret field blank — even if the document happens to contain a literal example key, that value is not carried into the request. You paste your own token or key into the Auth tab afterwards.',
          'Schemes with no equivalent in a browser-based client are not faked either. OAuth 2.0, OpenID Connect, mutual TLS, an API key sent via cookie, and any other HTTP auth scheme such as Digest are not imported: the request still arrives with its URL, parameters, and body intact, but its auth is left unset and a warning names the scheme so you know which requests need configuring by hand. There is no token acquisition flow here — no authorization-code redirect, no client-credentials exchange, no refresh. If the API needs an OAuth token, you obtain it however you normally do and paste it into the Bearer field.',
        ],
      },
      {
        heading: 'Local $ref references are resolved',
        paragraphs: [
          'Real specs rarely inline everything. A request body usually points at a reusable schema, and parameters are often shared components:',
        ],
        bullets: [
          '$ref: "#/components/schemas/User"',
        ],
      },
      {
        heading: 'Which references are followed',
        paragraphs: [
          'References like that one — internal JSON Pointers beginning with `#/` — are followed for the structures the importer cares about: path items, parameters, request bodies, media type schemas, security schemes, and nested schemas inside them. Lookups are memoized, so a schema reused by fifty operations is walked once, and pointer escapes (`~0`, `~1`) are decoded correctly.',
          'Remote references are intentionally never fetched. A `$ref` pointing at a URL or a relative file path is not resolved, because importing a document you were handed should not make your browser issue requests to somewhere the document chooses. The affected part of the request is left out or falls back to an empty value rather than being invented. If your spec is split across multiple files, bundle it into a single self-contained document first — most OpenAPI tooling has a bundle command — and import that.',
        ],
      },
      {
        heading: 'What actually gets created',
        paragraphs: [
          'A successful import produces one collection, one folder per tag used, one saved request per operation, and one environment:',
        ],
        bullets: [
          'OpenAPI title (Imported)',
          '├── Tag folder',
          '│   ├── Request',
          '│   └── Request',
          '└── General',
          '    └── Request',
        ],
      },
      {
        heading: 'Everything imported stays editable',
        paragraphs: [
          'Nothing about the result is read-only or linked back to the source file. An imported request is an ordinary saved request: change the method, edit the URL, add or remove parameters and headers, rewrite the body, set auth, rename it, move it to another folder, delete it. You can also generate cURL or Fetch, Axios, Node, or Python code from it, or share it as a link.',
          'The collection and environment are named after the API title with " (Imported)" appended, and a numeric suffix is added if that name is already taken — importing the same spec twice gives you a second collection rather than overwriting the first. Because there is no live link to the document, re-importing after the spec changes creates a fresh collection; it does not merge into or update the one you already edited.',
        ],
      },
      {
        heading: 'What importing never does',
        paragraphs: [
          'A specification you were given is input from outside your control, and the import path treats it as data — never as instructions.',
          'Importing an OpenAPI document does not:',
        ],
        bullets: [
          'Send any request. Conversion produces saved requests; nothing goes out until you press Send.',
          'Execute any code. There is no scripting model here, and nothing in a description, example, or extension field is evaluated.',
          'Fetch a remote `$ref`, or any other URL found in the document — including the server URL, which is stored as a string and never contacted during import.',
          'Log into an OAuth or OpenID provider, or start any authorization flow.',
          'Create, request, or guess an authentication token, key, or password. Secret fields are left empty for you to fill in.',
          'Upload your specification anywhere. Parsing happens in your browser, and the resulting collection is stored in your browser\'s local storage.',
        ],
      },
      {
        heading: 'Warnings, skipped operations, and outright rejection',
        paragraphs: [
          'A document is rejected in full — nothing imported, one clear error — only when it cannot be read at all or has nothing to import: it is neither valid JSON nor valid YAML, it is empty, it is over the 5MB limit, it is not an object, its `openapi` version is missing or unsupported (Swagger 2.0 lands here), it has no `paths` object, or the conversion finished without producing a single importable operation.',
          'Short of that, an import is partial and the preview tells you what was imperfect. A single malformed operation or unparseable schema is counted as skipped rather than failing the document, and so is a method the tool does not model. Present-but-malformed metadata — a broken `info` block, a server entry with no `url`, a security scheme with no `type` — is tolerated instead of treated as fatal, on the principle that a spec with usable `paths` should still import.',
          'Warnings are aggregated into counts rather than repeated per operation, so a 200-endpoint spec produces a short list you will actually read. You may see: N operations using an unsupported authentication scheme; N operations whose request body content type is unsupported, imported without a body; N header parameters skipped because a browser will not let script set them; N cookie parameters skipped; and a note that no server URL was found. Treat that list as a to-do list for the gap between what the document described and what came across.',
        ],
      },
      {
        heading: 'When this workflow is useful',
        paragraphs: [
          'This is aimed at a narrow, common situation: an OpenAPI document exists, and you need to understand or exercise the API it describes without building the requests by hand.',
        ],
        bullets: [
          'A vendor ships an OpenAPI spec as their API documentation and you want to try the real endpoints rather than read about them.',
          'An internal team maintains OpenAPI definitions and you need to call a service you have never called before.',
          'You are reviewing an API change and want to see the requests a new or modified operation implies.',
          'You need to hit two or three endpoints once, and setting up tooling for that is disproportionate.',
          'You want an editable starting point — correct paths, parameter names, and body shape — that you then adapt for your own testing.',
          'You are on a machine where you would rather not install anything, or you just want a browser tab.',
        ],
      },
      {
        heading: 'OpenAPI import versus building requests by hand',
        paragraphs: [
          'Building a request manually from a specification looks like this:',
        ],
        bullets: [
          'read docs → create URL → add params → add headers → create body',
        ],
      },
      {
        heading: 'What the import replaces',
        paragraphs: [
          'Importing replaces that with:',
        ],
        bullets: [
          'select spec → preview → import → edit → send',
        ],
      },
      {
        heading: 'Where the time actually goes',
        paragraphs: [
          'The saving is in setup, and it scales with how complete the document is. A spec with `operationId`s, tags, declared parameters, request body schemas, and a server URL gives you named requests in sensible folders with the right paths, correct parameter names, and a realistic body shape — work you would otherwise do by hand and occasionally get wrong. A thin spec with bare paths and no schemas gives you correct URLs and little else, which is still faster than typing them, but do not expect the import to invent detail the document never had.',
          'It is worth being clear about what this is not. This is an import path into a lightweight browser HTTP client, not an API lifecycle platform: there is no mock server, no contract testing, no spec linting, no client code generation from the document, and no monitoring. If you need those, use tooling built for them. For reading a spec and actually sending its requests, this is the short path.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can I test an OpenAPI spec online without installing anything?',
        answer:
          'Yes. Open the API Request Builder, click "Saved" then "Import OpenAPI", and choose your JSON or YAML file. The document is parsed in your browser and its operations become editable saved requests you can send. No install, no account, and the file is not uploaded anywhere.',
      },
      {
        question: 'Which OpenAPI versions are supported?',
        answer:
          'OpenAPI 3.0.x and 3.1.x, read from the `openapi` field. Anything else — including Swagger 2.0, which uses a `swagger` field instead — is rejected with a message naming the supported versions rather than being partially misinterpreted.',
      },
      {
        question: 'Is Swagger 2.0 supported?',
        answer:
          'No. Swagger 2.0 describes bodies, parameters, and security differently from OpenAPI 3, so guessing at it would produce requests that look right and are wrong. Convert the file to OpenAPI 3 with a converter first, then import the result.',
      },
      {
        question: 'Does it accept YAML as well as JSON?',
        answer:
          'Both. The picker takes `.json`, `.yaml`, and `.yml`, and the format is decided by parsing rather than by the extension — so a `.yaml` file containing JSON, or a misnamed `.json` file containing YAML, still imports.',
      },
      {
        question: 'Does importing a spec send any requests to the API?',
        answer:
          'No. Import only creates saved requests. Nothing is sent until you open a request and press Send, so importing a spec full of destructive endpoints has no effect on its own. The server URL is stored as a string and never contacted during the import.',
      },
      {
        question: 'What happens to path parameters like /users/{userId}?',
        answer:
          'They become variable placeholders: `/users/{userId}` is imported as `{{baseUrl}}/users/{{userId}}`. No value is invented, so you either define `userId` as a variable or type a concrete value into the URL before sending.',
      },
      {
        question: 'How is the server URL handled?',
        answer:
          'The first declared server becomes a `baseUrl` variable in a new environment created alongside the collection, and `{variable}` placeholders in that URL are replaced with their declared defaults. The environment is created but not activated — select it from the environment picker, and edit `baseUrl` to point at a different server later.',
      },
      {
        question: 'Are request bodies generated from schemas?',
        answer:
          'Yes, for JSON and form bodies. An explicit `example` wins, then the first `examples` entry, then the schema `default`, then a value generated from the schema — a string becomes `""`, an integer `0`, and known formats get placeholders. It is an editable starting point, not a payload guaranteed to validate.',
      },
      {
        question: 'Is OAuth 2.0 authentication imported?',
        answer:
          'No. Bearer, Basic, and API key (header or query) map across with their secret fields left empty. OAuth 2.0, OpenID Connect, mutual TLS, and cookie-based API keys are not imported — the request still arrives intact with auth unset and a warning naming the scheme. No token is ever fetched on your behalf.',
      },
      {
        question: 'Are $ref references resolved?',
        answer:
          'Local ones are. A `$ref` starting with `#/`, such as `#/components/schemas/User`, is resolved within the document. Remote references pointing at a URL or another file are deliberately never fetched — bundle a multi-file spec into one document before importing it.',
      },
      {
        question: 'Can I edit the requests after importing?',
        answer:
          'Yes. Imported requests are ordinary saved requests, not a read-only view of the spec. Edit the URL, parameters, headers, body, and auth, rename or move them, generate cURL or code from them, or delete them. There is no live link back to the source file.',
      },
      {
        question: 'What if some operations fail to import?',
        answer:
          'A malformed operation or unparseable schema is skipped and counted rather than failing the whole document, and the preview reports both that count and any warnings before you commit. Only an unreadable file, an unsupported version, a missing `paths` object, or zero importable operations rejects the import outright.',
      },
    ],
    relatedSlugs: [
      'import-postman-collection-without-postman',
      'how-to-test-an-api',
      'authentication-testing-examples',
      'curl-to-fetch-axios-python',
      'json-post-request-example',
    ],
    ctaText: 'Import your OpenAPI spec in API Request Builder.',
    ctaToolHref: '/tools/developer/api-request-builder',
    ctaToolLabel: 'Try the free API Request Builder',
  },
  {
    slug: 'common-api-testing-errors',
    title: 'Common API Testing Errors and What They Mean',
    description:
      'A reference for common API testing errors — what 400, 401, 403, 404, 405, 415, 422, 429 and 5xx status codes mean, plus timeouts and CORS failures, and what to check next.',
    category: 'developer-tools',
    readTimeMinutes: 11,
    publishedDate: '2026-08-17',
    updatedDate: '2026-08-17',
    intro: [
      'An API request can fail for reasons that have nothing to do with each other: the data you sent was invalid, your credentials were missing or expired, the URL pointed at nothing, the endpoint does not accept that method or that media type, you have been rate limited, the server itself broke, or the browser refused to hand you the response. Each of those needs a different fix, and guessing wastes time.',
      'The HTTP status code is the first useful clue, because it tells you which class of problem you are in before you read a single line of the response body. A 4xx points at the request you sent; a 5xx points at the server handling it; no status code at all — a timeout or a blocked browser request — means nothing came back to classify.',
      'This page is a reference, not a tutorial. Find the code or symptom you are looking at, read what it usually means, and work down the short list of things to check. Every section ends with a next action rather than a theory.',
    ],
    sections: [
      {
        heading: 'Quick reference: status code, meaning, typical cause',
        paragraphs: [
          'Each line below is Status — Meaning — Typical cause. Only codes this page explains further are listed; there is a section for each one.',
        ],
        bullets: [
          '400 Bad Request — the server could not process the request because it was invalid or malformed — malformed JSON, a missing required field, or a badly formed parameter.',
          '401 Unauthorized — the request was not authenticated — no credential sent, or a token/key that is invalid, expired, or in the wrong header.',
          '403 Forbidden — the server is refusing access to this resource — insufficient permission, a missing scope or role, or a policy restriction.',
          '404 Not Found — the server has nothing at that URL — a typo in the path, the wrong API version, or a resource ID that does not exist.',
          '405 Method Not Allowed — the endpoint exists but not for this method — sending GET where the operation is POST, or vice versa.',
          '409 Conflict — the request conflicts with the current state of the resource — a duplicate record, or a version/state clash.',
          '415 Unsupported Media Type — the server does not accept the body format you sent — a Content-Type mismatch, usually JSON where form data is expected.',
          '422 Unprocessable Content — the format was understood but the data was rejected — schema or field-level validation failure.',
          '429 Too Many Requests — you are being rate limited — too many requests in a window, or a quota exhausted.',
          '500 Internal Server Error — the server hit an unexpected condition — an unhandled exception, a broken dependency, or a bad deploy.',
          '502 Bad Gateway — an intermediary got an invalid response from upstream — the application behind a proxy or gateway is failing or unreachable.',
          '503 Service Unavailable — the service is temporarily unable to handle the request — overload, maintenance, or a dependency that is down.',
          'No status code at all — nothing came back — a timeout, a network failure, or a browser blocking the response (CORS).',
        ],
      },
      {
        heading: 'Status codes are a class of answer, not the answer',
        paragraphs: [
          'Before using the sections below, one caveat worth keeping: HTTP status codes give you a standard class of information, but the exact reason a specific API rejected a specific request is API-specific. Different APIs legitimately use different codes for similar situations — a validation failure might come back as 400 on one API and 422 on another, and a permission problem as 401, 403, or even 404 depending on whether the API wants to reveal that the resource exists.',
          'So treat the code as a starting direction and the response body as the actual explanation. Most APIs return a machine-readable error object with a message, an error code, or a list of field-level problems; that plus the provider’s documentation is where the actionable detail lives. If a section here disagrees with the API’s own docs, the docs win.',
        ],
      },
      {
        heading: '400 Bad Request',
        paragraphs: [
          'Meaning: the server could not process the request because the request itself was invalid or malformed. It is the most general 4xx, and a broad range of problems land on it — a 400 does not by itself mean your JSON was malformed.',
        ],
        bullets: [
          'Common cause — malformed JSON in the body (a trailing comma, a missing comma, unquoted keys).',
          'Common cause — a required field missing from the body or the query string.',
          'Common cause — a parameter in the wrong format: a string where a number is expected, a date in the wrong format, an ID that does not match the expected shape.',
          'Common cause — an invalid query string: an unknown parameter the API rejects rather than ignores, or a value that failed to parse.',
          'Common cause — the right fields nested at the wrong level, so the body structure does not match the documented schema.',
          'Check 1 — validate the JSON syntax before anything else; see the malformed-JSON section below.',
          'Check 2 — compare the body’s fields against the documented required fields.',
          'Check 3 — read the query parameters in the Params tab, including ones left over from an earlier attempt.',
          'Check 4 — diff the whole request against the API documentation’s own example, method and headers included.',
          'Check 5 — read the response body. A 400 usually carries the specific validation detail, and it is faster than guessing.',
          'For the anatomy of a correctly formed JSON body, see /guides/developer-tools/json-post-request-example.',
        ],
      },
      {
        heading: '401 Unauthorized',
        paragraphs: [
          'Meaning: the request was not accepted as authenticated. Despite the name, 401 is about authentication — who you are — rather than authorization.',
        ],
        bullets: [
          'Common cause — no authentication sent at all, because the Auth tab is still set to None.',
          'Common cause — an invalid token: truncated on copy, from a different environment, or simply the wrong credential.',
          'Common cause — an expired token. Short-lived access tokens are the single most common answer to “it worked an hour ago”.',
          'Common cause — a malformed Authorization header, most often the `Bearer ` prefix missing, duplicated, or a stray newline pasted in with the token.',
          'Common cause — an incorrect API key, or the right key sent under the wrong header name.',
          'Common cause — the wrong authentication method entirely, such as a Bearer token where the API expects Basic Auth or an API key.',
          'Check — open the Auth tab and confirm which method is selected, not just that something is filled in.',
          'Check — for a Bearer token, confirm the token itself is current and that the tool is building the header rather than you also adding a manual Authorization header that overrides it.',
          'Check — for an API key, confirm both the name and the location: a header named exactly as documented, or a query parameter, depending on the API.',
          'Check — for Basic Auth, confirm the username and password, and that they are credentials for the API rather than for a dashboard login.',
          'Check — re-read the API’s authentication documentation. Scheme details vary more than any other part of an API.',
          'Worked examples of all three schemes: /guides/developer-tools/authentication-testing-examples.',
        ],
      },
      {
        heading: '403 Forbidden',
        paragraphs: [
          'Meaning: the server is refusing access to the requested resource. Whether authentication succeeded depends on the API — the common shorthand that “403 means you are authenticated but not permitted” is true of many APIs and not all of them. Some return 403 for a missing or bad credential, and some return 404 to avoid confirming that a resource exists.',
        ],
        bullets: [
          'Possible cause — the authenticated identity lacks permission for this action on this resource.',
          'Possible cause — the token is valid but missing a required scope, or the account lacks a required role.',
          'Possible cause — an IP allowlist, region restriction, or firewall rule in front of the API.',
          'Possible cause — an endpoint-level authorization policy: the credential works for read endpoints but not write ones, or for one tenant’s data but not another’s.',
          'Possible cause — an account or plan restriction: a trial account, a suspended key, a feature not enabled for that subscription.',
          'Check — read the response body. APIs that distinguish 401 from 403 carefully usually say which permission or scope was missing.',
          'Check — confirm the credential is the one you think it is, since a wrong-but-valid token from another account produces exactly this.',
          'Check — if the credential was just issued, confirm its scopes at issue time; scopes usually cannot be widened after the fact.',
          'Check — work through the authentication checklist below before assuming the problem is permissions.',
        ],
      },
      {
        heading: '404 Not Found',
        paragraphs: [
          'Meaning: the server has nothing to serve at that URL. Because it is the default answer for anything unrouted, a 404 is as often a typo as it is a missing record.',
        ],
        bullets: [
          'Common cause — the URL is wrong: a typo, a missing or extra slash, or the wrong host.',
          'Common cause — the wrong path: `/user` instead of `/users`, or a missing prefix such as `/api`.',
          'Common cause — the wrong API version, where `/v1` and `/v2` expose different paths.',
          'Common cause — a resource ID that does not exist, or exists but not for your account.',
          'Common cause — an endpoint that was removed or renamed in a version you have not read the changelog for.',
          'Check — read the complete resolved URL, not the template. If it is built from an environment variable, confirm what that variable currently expands to.',
          'Check — confirm every path parameter has a real value and no `{{placeholder}}` survived into the sent URL.',
          'Check — confirm the active environment. Pointing a staging path at a production `baseUrl` (or the reverse) produces a 404 that looks like a missing record.',
          'Check — confirm the API version segment against the documentation you are reading.',
          'Check — test a known-good endpoint on the same host, such as a health or list endpoint. If that works, the host and auth are fine and the path is the problem.',
        ],
      },
      {
        heading: '405 Method Not Allowed',
        paragraphs: [
          'Meaning: the endpoint exists, but the HTTP method you used is not allowed for that resource. This is a useful failure — it confirms the URL is right.',
          'The classic version: the documentation describes `POST /users` to create a user, and the request that was actually sent is `GET /users` because the method dropped back to the default after the URL was edited.',
        ],
        bullets: [
          'Check — the method selector to the left of the URL in the API Request Builder. It offers GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS.',
          'Check — the documented operation for that exact path. Collection paths and item paths usually accept different methods: `POST /users` to create, `GET /users/{id}` to read, `PATCH /users/{id}` to update.',
          'Check — the `Allow` response header when present; servers that return 405 correctly list the methods the endpoint does accept.',
          'Check — whether an update endpoint expects PUT (replace the whole resource) or PATCH (change some fields). Many APIs implement only one.',
        ],
      },
      {
        heading: '409 Conflict',
        paragraphs: [
          'Meaning: the request conflicts with the current state of the server or the resource. Nothing is malformed and nothing is unauthorized — the operation just cannot apply to the state that exists right now. Not every API uses 409 this way; some return 400 or 422 for the same situations.',
        ],
        bullets: [
          'Common example — a duplicate resource: creating a record with an email, username, or slug that already exists.',
          'Common example — a version conflict: an optimistic-concurrency check where the `If-Match`/ETag or version field you sent no longer matches the stored one.',
          'Common example — an invalid state transition: cancelling an order that already shipped, or paying an invoice already marked paid.',
          'Check — the response body, which is where the specific conflict is named.',
          'Check — whether the resource already exists, with a GET before retrying the create.',
          'Check — for a version conflict, re-read the resource to get the current version and resend with that.',
          'Beyond that, troubleshooting a 409 is endpoint-specific: it depends on that API’s domain rules, so its documentation is the only reliable source.',
        ],
      },
      {
        heading: '415 Unsupported Media Type',
        paragraphs: [
          'Meaning: the server does not accept the media type the request declared or sent. The body may be perfectly valid — it is the format, and the Content-Type header describing it, that was rejected.',
          'The two media types this comes up with most are `application/json` and `multipart/form-data`. Sending one where the endpoint accepts only the other produces a 415 even when the fields are correct.',
        ],
        bullets: [
          'Common cause — sending JSON to an endpoint that only accepts form data, or the reverse.',
          'Common cause — an incorrect or missing Content-Type header, so the server cannot tell what the body is.',
          'Common cause — a body format the endpoint does not support at all, such as XML or plain text where only JSON is accepted.',
          'Common cause — a Content-Type with a charset or vendor suffix the server matches strictly, such as `application/vnd.api+json`.',
          'Check — what the documentation lists as accepted request content types for that specific operation.',
          'Check — switch the Body mode rather than hand-editing the header; the tool sets the matching Content-Type for JSON, form-url-encoded, and multipart bodies.',
          'Important for multipart — do not set the Content-Type header yourself. A multipart body needs a boundary parameter, and the browser generates it when it constructs the `FormData`. A hand-written `multipart/form-data` header has no boundary, so the server cannot parse the body.',
          'JSON bodies in detail: /guides/developer-tools/json-post-request-example.',
          'Multipart and file uploads in detail: /guides/developer-tools/form-data-file-upload-example.',
        ],
      },
      {
        heading: '422 Unprocessable Content',
        paragraphs: [
          'Meaning: in the most common usage, the server understood the request format but rejected the submitted data. The body parsed, the content type was fine, and validation then failed. There is no single universal meaning — plenty of APIs return 400 for exactly these cases, and a few use 422 more loosely — so read it as “your data was rejected” rather than as a precise diagnosis.',
        ],
        bullets: [
          'Common example — a required field missing from an otherwise valid JSON object.',
          'Common example — an invalid field value: an out-of-range number, an unrecognised enum value, a malformed email or date.',
          'Common example — a schema validation failure, such as the wrong type for a field or an unexpected extra property on a strict schema.',
          'Common example — a cross-field rule, such as an end date earlier than a start date.',
          'Check — the response body first. A 422 is the code most likely to carry a structured list of field-level errors, and it usually names the exact field.',
          'Check — field names and types against the documented schema, including case: `firstName` and `first_name` are different fields.',
          'Check — that valid JSON is not being mistaken for valid data. Syntax and schema are separate concerns; see the malformed-JSON section.',
          'Body structure and Content-Type basics: /guides/developer-tools/json-post-request-example.',
        ],
      },
      {
        heading: '429 Too Many Requests',
        paragraphs: [
          'Meaning: you are being rate limited. The request was well formed and probably authenticated; you simply sent more than the API allows for now.',
        ],
        bullets: [
          'Common cause — too many requests inside the limit window, often from a loop or a test script rather than manual testing.',
          'Common cause — a plan or account quota exhausted for the day or month, which does not reset in seconds.',
          'Common cause — a burst limit exceeded even though the average rate is fine.',
          'Common cause — a limit shared across a whole key or organisation, so someone else’s traffic consumed it.',
          'Check — the API’s rate-limit documentation for the actual window and limit; they vary enormously.',
          'Check — the `Retry-After` response header when present. It tells you how long to wait, in seconds or as a date.',
          'Check — any `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers, which many APIs send on every response, not only on a 429.',
          'Check — whether this is a quota rather than a rate, by looking at your account or dashboard usage.',
          'Then — slow down. Wait out the window, reduce request frequency, and space out repeated sends. Do not hammer the endpoint with automated retries: aggressive retrying keeps the limit tripped, can extend the block, and on some APIs counts against your quota.',
        ],
      },
      {
        heading: '500 Internal Server Error',
        paragraphs: [
          'Meaning: the server encountered an unexpected condition while handling the request. It is a generic catch-all — the server is telling you it failed, not why.',
          'A 500 does not imply the client is wrong, and it also does not prove the client is innocent. Unhandled input is a real cause, so it is worth a few client-side checks before reporting it.',
        ],
        bullets: [
          'Possible cause — an unhandled server-side exception on that code path.',
          'Possible cause — a bad or in-progress deployment, or a misconfigured environment variable on the server.',
          'Possible cause — a failing dependency: a database, cache, or downstream API the endpoint relies on.',
          'Possible cause — input the server did not expect and did not validate, so it crashed instead of returning a 400.',
          'Check — that the request is correctly formed against the documentation, so you can rule your own request in or out.',
          'Check — a known-working request against the same API. If that succeeds, the failure is specific to this endpoint or this payload.',
          'Check — the response body and headers; some APIs include an error ID or trace ID, which is the single most useful thing to quote in a support ticket.',
          'Check — reproducibility. Consistent on every send, or intermittent? Consistent points at a code path; intermittent points at capacity or a flaky dependency.',
          'Check — whether one field makes the difference. Removing or simplifying part of the payload until the 500 stops narrows it down fast, and if a simplified valid request also 500s the problem is not yours.',
          'Then — if it is your API, the server logs hold the answer. If it is not, report it with the request, the timestamp, and any trace ID.',
        ],
      },
      {
        heading: '502 Bad Gateway and 503 Service Unavailable',
        paragraphs: [
          'Both usually mean the failure happened somewhere between the request arriving and the application handling it, so there is rarely anything to fix in the request. Exact semantics depend on the infrastructure in front of the API, and not every deployment uses these codes the same way.',
          '502 Bad Gateway often indicates that an intermediary — a reverse proxy, load balancer, gateway, or CDN — received an invalid or empty response from the upstream server it forwarded to. That commonly means the application behind it crashed, is restarting, or closed the connection.',
          '503 Service Unavailable commonly indicates that the service is temporarily unable to handle the request: overload, a deliberate maintenance window, or a dependency being down. A 503 may carry a `Retry-After` header, which is worth checking before retrying.',
          'For either, the practical response is the same: confirm the request is well formed, retry once after a short pause, check the provider’s status page, and if it is your own infrastructure, look at the proxy and application logs together — the proxy will say what it could not reach.',
        ],
      },
      {
        heading: 'Request timeout',
        paragraphs: [
          'A timeout is not an HTTP status code. There is no response at all, which is exactly why it is harder to diagnose than a 4xx or 5xx — the same silence covers several different causes.',
          'A client-side request timeout means your client stopped waiting. The server may still be working, and may even complete the operation after you gave up, which matters for anything that writes data: a timed-out POST is not proof that nothing was created.',
          'A server response timeout means something on the server side gave up first — often a gateway timing out an upstream — and that usually arrives as a status code such as 504 rather than as silence.',
          'A network failure means the request never completed the round trip: no connectivity, DNS failure, a wrong host, or the server refusing the connection. A browser/CORS failure looks similar from JavaScript, because the browser blocks the response without telling your code why. In the API Request Builder these two land in the same error, and the message says so rather than guessing — the browser does not expose enough detail to distinguish them.',
          'The tool’s Timeout control in the toolbar sets the client-side limit and offers 5, 10, 30, 60, and 120 seconds, defaulting to 30. When that limit is reached the request is aborted and the error names the configured value, so a timeout at exactly your configured number is your budget expiring, not a diagnosis of the server.',
          'What to do: raise the timeout if the endpoint is legitimately slow (reports, exports, cold starts); confirm the host is reachable at all with a simpler request; and for a timed-out write, check whether it actually took effect before resending. A timeout does not prove the server is down.',
        ],
      },
      {
        heading: 'When the request works in cURL but fails in the browser',
        paragraphs: [
          'If the exact same request succeeds from a terminal and fails from browser JavaScript with no status code and no detail, the browser is almost certainly the difference. CORS is enforced by browsers, not by HTTP, so cURL and desktop clients were never subject to it.',
          'The short version of what changes inside a browser: the response is withheld from your JavaScript unless the API returns an `Access-Control-Allow-Origin` header matching your origin; non-simple requests are preceded by an automatic `OPTIONS` preflight that must succeed on its own; some headers are forbidden for JavaScript to set and are controlled by the browser; and sending cookies or credentials adds stricter rules, including that a wildcard allowed-origin is rejected outright for credentialed requests.',
          'The API Request Builder sends requests straight from your browser, so it is subject to all of that. When a request fails this way it offers to retry through a CORS proxy, which fetches the response server-side where CORS does not apply. That is a testing convenience with a real trade-off — the proxy operator sees the whole request, credentials included — and a response that came back that way is labelled as such in the response header row.',
          'The full explanation, including the fixes that depend on whether you control the API, is in the dedicated guide: /guides/developer-tools/what-is-a-cors-error.',
        ],
      },
      {
        heading: 'Invalid JSON body',
        paragraphs: [
          'Malformed JSON is common enough, and produces confusing enough errors, to be worth isolating. Depending on the API it surfaces as a 400, a 415, or an error the tool raises before the request is even sent.',
          'This body is invalid — there is no comma after the first value:',
        ],
        bullets: [
          '{',
          '  "name": "John"',
          '  "email": "john@example.com"',
          '}',
        ],
      },
      {
        heading: 'The same JSON body, corrected',
        paragraphs: [
          'Adding the missing comma is the whole fix:',
        ],
        bullets: [
          '{',
          '  "name": "John",',
          '  "email": "john@example.com"',
          '}',
        ],
      },
      {
        heading: 'Syntax errors versus schema errors',
        paragraphs: [
          'Valid JSON syntax and valid API data are separate concerns, and conflating them is what makes these errors feel arbitrary. Syntax is whether the text parses at all: commas, quotes, brackets, no trailing comma, no comments, keys quoted. Schema is whether the parsed object is acceptable to the endpoint: the right fields, the right types, the required ones present.',
          'A body can pass one and fail the other in both directions. Perfectly valid JSON containing the wrong field names is a schema failure, usually a 422 or a 400 with field detail. Text that is nearly JSON but has a stray comma never gets far enough to be validated at all.',
          'The usual culprits are a trailing comma after the last property, a missing comma between properties, single quotes instead of double, unquoted keys, and a JavaScript-style comment pasted in from documentation. The Body editor in the API Request Builder flags a JSON body it cannot parse and can format it, and formatting failing is itself the signal that the problem is syntax rather than schema.',
          'For a body known to be well formed to compare against, see /guides/developer-tools/json-post-request-example.',
        ],
      },
      {
        heading: 'Checklist: before debugging a 401 or 403',
        paragraphs: [
          'Most authentication failures are one of seven things. Work down the list before digging into scopes and policies.',
        ],
        bullets: [
          '1. Is authentication enabled at all, or is the Auth tab still set to None?',
          '2. Is the auth method the one the API documents — Bearer, Basic, or API key?',
          '3. Is the token or API key actually present, and not an empty or unresolved `{{variable}}`?',
          '4. Is the header name exactly right — `Authorization` for Bearer and Basic, or the API’s own header name for a key?',
          '5. Is the token expired, or issued for a different environment or account?',
          '6. Does this endpoint require a specific scope or role the credential does not carry?',
          '7. Are browser credential or CORS rules involved — cookies not being sent cross-origin, or the response blocked before your code sees it?',
          'Worked examples for each scheme: /guides/developer-tools/authentication-testing-examples.',
        ],
      },
      {
        heading: 'Checklist: debugging any failing request',
        paragraphs: [
          'When the status code alone has not told you enough, go through the request in the order the server does.',
        ],
        bullets: [
          '1. Verify the method — GET, POST, PUT, PATCH, DELETE.',
          '2. Verify the URL, including the base URL or environment the variables resolve against.',
          '3. Check the query parameters, and remove leftovers from earlier attempts.',
          '4. Check the headers for duplicates, typos, and stale values.',
          '5. Check authentication with the checklist above.',
          '6. Check the body and its content type together — they have to agree.',
          '7. Check the response status and the response headers, not just the body.',
          '8. Read the response body. It is the most-skipped and most-informative step.',
          '9. Check whether a browser constraint is involved, if the same request works outside the browser.',
          '10. Change one thing and resend. Fixing three things at once tells you nothing about which one mattered.',
        ],
      },
      {
        heading: 'What to look at in the API Request Builder',
        paragraphs: [
          'The reason to debug in a request builder rather than in application code is that every part of the exchange is visible at once. On the response side, the row above the response shows the status code and status text, the response time, the response size, and the detected body kind, with a warning marker when a large body was truncated for display or when the response arrived through a CORS proxy. Two tabs sit below it: Body — JSON pretty-printed as a tree or as raw text, with copy and download — and Headers, which is where `Retry-After`, rate-limit headers, `Allow`, `Content-Type`, and any trace ID actually live.',
          'On the request side, the controls map to exactly the things the checklists above ask about: the method selector and URL field at the top; the Params, Headers, Body, and Auth tabs beneath them; the environment picker for swapping which `baseUrl` and variables a request resolves against; and the Timeout control for the client-side limit. Saved requests and local history make the useful comparison possible — load the version that worked, put it next to the one that does not, and look at what differs.',
        ],
      },
    ],
    faq: [
      {
        question: 'What is the difference between a 401 and a 403?',
        answer:
          '401 means the request was not accepted as authenticated — the credential is missing, invalid, or expired. 403 means the server is refusing access to the resource, most often because the identity lacks permission, a scope, or a role. The line is not perfectly consistent across APIs: some return 403 for a bad credential and some return 404 rather than admit a resource exists, so read the response body rather than relying on the code alone.',
      },
      {
        question: 'Why do I get a 400 when my JSON looks fine?',
        answer:
          'Because a 400 covers far more than malformed JSON. A missing required field, a value in the wrong format, an unexpected query parameter, or the right fields nested at the wrong level all produce one. Valid JSON syntax and valid API data are separate concerns — the response body usually names the specific field, so read it before re-checking the syntax.',
      },
      {
        question: 'What is the difference between a 400 and a 422?',
        answer:
          'As commonly used, a 400 means the request itself was malformed or unparseable, and a 422 means the request was understood but the data failed validation. Many APIs do not draw that line and return 400 for both, so treat 422 as “my data was rejected” and look to the response body, which for a 422 usually includes field-level errors.',
      },
      {
        question: 'Why am I getting a 415 when I send JSON?',
        answer:
          'The endpoint does not accept `application/json` for that operation, or the Content-Type does not match the body sent. The usual case is an endpoint that expects `multipart/form-data` or `application/x-www-form-urlencoded`. Switch the Body mode instead of hand-editing the header, and for multipart never set Content-Type yourself — the browser must generate the boundary as part of building the FormData.',
      },
      {
        question: 'How should I handle a 429?',
        answer:
          'Wait, then send fewer requests. Check `Retry-After` if the response includes it, and any rate-limit headers for the remaining allowance and reset time, then confirm against the API’s documented limits whether you hit a per-second rate or an exhausted quota. Avoid aggressive automated retries — they keep the limit tripped and on some APIs extend the block.',
      },
      {
        question: 'Does a 500 mean I did something wrong?',
        answer:
          'Not necessarily. A 500 means the server hit an unexpected condition, which is usually a server-side bug, a bad deploy, or a failing dependency. It also does not clear the client, since unvalidated input can crash a handler. Confirm the request matches the documentation, try a known-working request against the same API, check for a trace ID in the response, and see whether it reproduces consistently.',
      },
      {
        question: 'My request timed out. Is the API down?',
        answer:
          'Not necessarily. A timeout means your client stopped waiting; the server may still be processing, and may complete the work after you gave up — so a timed-out POST is not proof that nothing was created. It can equally be a slow endpoint, a network failure, or a browser blocking the response. Raise the Timeout setting, confirm the host answers a simpler request, and for a write, check whether it took effect before resending.',
      },
      {
        question: 'Why does the request work in cURL but fail in my browser?',
        answer:
          'CORS is enforced by browsers, not by HTTP, so cURL was never subject to it. From browser JavaScript the response is withheld unless the API returns a matching `Access-Control-Allow-Origin` header, non-simple requests must pass an automatic OPTIONS preflight first, and credentialed requests face stricter rules. The failure carries no status code because there is no readable response.',
      },
    ],
    relatedSlugs: [
      'how-to-test-an-api',
      'authentication-testing-examples',
      'what-is-a-cors-error',
      'json-post-request-example',
      'form-data-file-upload-example',
      'curl-to-fetch-axios-python',
    ],
    ctaText: 'Send the failing request again with every part of it visible.',
    ctaToolHref: '/tools/developer/api-request-builder',
    ctaToolLabel: 'Test the failing request in API Request Builder',
  },
];

export const getGuideBySlug = (slug: string): Guide | undefined => GUIDES.find((guide) => guide.slug === slug);

// Slugs retired by content consolidation, mapped to the guide their content
// was merged into — GuidePage/GuideOrCategoryPage use this to send old
// bookmarked/indexed URLs to the article that now covers that ground,
// instead of the generic /guides fallback an unknown slug otherwise gets.
const GUIDE_REDIRECTS: Record<string, string> = {
  'how-to-reduce-late-payments': 'how-to-get-paid-faster',
  'collect-unpaid-invoices': 'overdue-invoices',
  'credit-memo-vs-credit-note': 'credit-notes',
};

export const getGuideRedirectTarget = (slug: string): Guide | undefined => {
  const targetSlug = GUIDE_REDIRECTS[slug];
  return targetSlug ? getGuideBySlug(targetSlug) : undefined;
};

export const getRelatedGuides = (guide: Guide, limit = 3): Guide[] =>
  guide.relatedSlugs
    .map((slug) => getGuideBySlug(slug))
    .filter((candidate): candidate is Guide => Boolean(candidate))
    .slice(0, limit);

export const getGuidesByCategory = (categorySlug: string): Guide[] =>
  GUIDES.filter((guide) => guide.category === categorySlug);
