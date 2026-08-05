import type { Guide } from './types';

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
    category: 'Document Basics',
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
    relatedSlugs: ['invoice-number-guide', 'invoice-payment-terms'],
  },
  {
    slug: 'invoice-payment-terms',
    title: 'Invoice Payment Terms Explained: Net 30, Net 15, and Due on Receipt',
    description:
      'What Net 30, Net 15, and Due on Receipt actually mean, how to pick the right terms for a client, and how to write them so there’s no ambiguity about when you get paid.',
    category: 'Getting Paid',
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
    relatedSlugs: ['how-to-get-paid-faster', 'invoice-late-fees'],
  },
  {
    slug: 'invoice-number-guide',
    title: 'How to Number Your Invoices (Without Losing Track)',
    description:
      'A simple, sustainable invoice numbering system — sequential, date-based, or client-based — plus how to fix a numbering system that’s already inconsistent.',
    category: 'Document Basics',
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
    relatedSlugs: ['how-to-make-an-invoice', 'invoice-payment-terms'],
  },
  {
    slug: 'how-to-get-paid-faster',
    title: 'How to Get Paid Faster: Practical Ways to Speed Up Invoice Payments',
    description:
      'Concrete, low-effort changes to your invoicing process — clearer invoices, upfront deposits, and better timing — that shorten how long clients take to pay.',
    category: 'Getting Paid',
    readTimeMinutes: 8,
    publishedDate: '2026-08-05',
    updatedDate: '2026-08-05',
    intro: [
      'Most late payments aren’t caused by clients who don’t want to pay — they’re caused by friction: an unclear invoice, an inconvenient payment method, or simply no reminder before the due date slipped past. Fixing the friction usually does more for your cash flow than chasing harder after the fact.',
    ],
    sections: [
      {
        heading: 'Make it easy to say yes',
        paragraphs: [
          'Every extra step between "client opens the invoice" and "client pays it" is a chance for the payment to stall. A clear breakdown of what’s owed, an obvious total, and at least one payment method the client already uses regularly (bank transfer, card, UPI) removes most of that friction.',
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
          'A short reminder two or three days before the due date prevents far more late payments than a reminder after the date has already passed, because it catches invoices that simply got buried in someone’s inbox rather than actively ignored.',
          'Keep reminders short and neutral in tone: a reference to the invoice number, amount, and due date is usually enough. Save firmer language for genuinely overdue invoices, not upcoming ones.',
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
    ],
    relatedSlugs: ['invoice-payment-terms', 'invoice-late-fees'],
  },
  {
    slug: 'invoice-late-fees',
    title: 'Invoice Late Fees: How to Charge Them the Right Way',
    description:
      'How to structure a late fee, add it to your invoices and contracts, and enforce it without damaging a client relationship you want to keep.',
    category: 'Getting Paid',
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
    relatedSlugs: ['invoice-payment-terms', 'how-to-get-paid-faster'],
  },
];

export const getGuideBySlug = (slug: string): Guide | undefined => GUIDES.find((guide) => guide.slug === slug);

export const getRelatedGuides = (guide: Guide, limit = 3): Guide[] =>
  guide.relatedSlugs
    .map((slug) => getGuideBySlug(slug))
    .filter((candidate): candidate is Guide => Boolean(candidate))
    .slice(0, limit);
