// Copy owned by the /menu-qr-code landing page (see MenuQrCodePage.tsx).
// Kept in a plain .ts module rather than inline in the page for the same
// reason apiRequestBuilder/seoContent.ts exists: jest runs in a node
// environment and only matches *.test.ts, so content that needs assertions
// (accuracy of the static-QR claims, no fabricated stats, no duplicate FAQ
// questions) has to live outside the .tsx component to be testable.
//
// Everything here describes STATIC QR behavior only — the generator encodes
// the menu URL directly into the code. There is no backend, no redirect
// service, and no editable/dynamic destination, so no sentence below may
// imply otherwise.

export interface MenuQrFaqItem {
  question: string;
  answer: string;
}

/** The four-step scan flow, in the order the page renders them. */
export const MENU_QR_HOW_IT_WORKS_STEPS: string[] = [
  'You paste the link to your menu — a page on your website, or a PDF you have already uploaded somewhere public.',
  'The tool encodes that exact link into a QR code, in your browser. Nothing is uploaded, stored, or shortened.',
  'A customer points their phone camera (or a QR scanner app) at the printed or displayed code.',
  'Their phone reads the link out of the code and opens it, the same as tapping the URL anywhere else.',
];

/**
 * Webpage vs PDF menu tradeoff. Deliberately framed around the *destination*,
 * not the QR code — the code holds a URL in both cases and never the file
 * itself.
 */
export const MENU_FORMAT_COMPARISON: {
  format: string;
  summary: string;
  advantages: string[];
}[] = [
  {
    format: 'Webpage menu',
    summary: 'A menu page on your own website, ordering platform, or site builder.',
    advantages: [
      'Easier to update — change a price or pull a dish and the page is live immediately',
      'Usually already mobile-friendly, so it reflows to fit a phone screen',
      'As long as the URL stays the same, the printed QR code keeps working after every edit',
      'Customers can usually jump between sections rather than pinching around a fixed page',
    ],
  },
  {
    format: 'PDF menu',
    summary: 'A PDF already hosted somewhere public — your site, Google Drive, Dropbox, or a menu platform.',
    advantages: [
      'Preserves your designed layout exactly as it was laid out for print',
      'Practical when the printable menu already exists and nobody needs to rebuild it as a web page',
      'Straightforward to set up when the file is already online at a stable address',
    ],
  },
];

/** Physical places a printed menu QR code tends to go. No scan-rate claims. */
export const MENU_QR_PLACEMENT_IDEAS: string[] = [
  'Table tents and tabletop stands',
  'Stickers or decals applied directly to dining tables',
  'The entrance door or a board outside',
  'The counter, till, or pickup point',
  'Window decals, so people can read the menu before walking in',
  'Printed receipts and bill folders',
  'Takeaway bags, boxes, and delivery packaging',
  'Existing printed menus, posters, and signage',
];

/**
 * Print guidance. Intentionally free of universal "X cm always works"
 * thresholds — scan distance, printer, and scanner quality all move that
 * number, so the page tells people to test instead.
 */
export const MENU_QR_PRINT_TIPS: string[] = [
  'Keep strong contrast between the code and its background — dark code on a light background is the safest combination.',
  'Leave a clear margin (the "quiet zone") around all four sides of the code. Artwork or text pressed against the edge can stop it scanning.',
  'Print from the downloaded PNG or SVG. Use SVG when the code is going on anything large — it stays sharp at any size.',
  'Never use a screenshot or a photo of a screen. Rescaled screenshots blur the code\'s squares and break the pattern.',
  'Size the code for the distance it will be read from: a table tent someone leans over can be small, a window decal read from the pavement needs to be much bigger.',
  'Avoid placing it on a curve, a fold, or behind glare-prone glossy lamination where a camera struggles to focus.',
  'Test the printed proof with more than one phone before ordering the full print run.',
];

/**
 * Menu-specific FAQ. Rendered on the page AND emitted as FAQPage schema —
 * one source, so schema can never advertise a question the page doesn't show.
 */
export const MENU_QR_FAQ: MenuQrFaqItem[] = [
  {
    question: 'Do customers need an app to scan a menu QR code?',
    answer:
      'On most current iPhones and Android phones, the built-in camera app recognises a QR code and offers to open the link — no separate app to install. Older phones, and some locked-down or budget devices, may still need a QR scanner app. Once the link opens, the menu loads in the phone\'s normal browser.',
  },
  {
    question: 'Can I use a PDF menu with a QR code?',
    answer:
      'Yes, as long as the PDF is already hosted at a public URL — on your website, Google Drive, Dropbox, or anywhere else that serves it openly. The QR code does not store the PDF itself; it stores the link to it. So the file has to stay online at that address for the code to keep working, and whoever scans it will need to load the whole PDF on their phone.',
  },
  {
    question: 'Can I update my menu without changing the QR code?',
    answer:
      'It depends on whether the URL changes. If the code points at a webpage and you edit prices or dishes on that page, the printed code keeps working — it points at the address, not the content. Same for a PDF you replace in place, as long as the new file sits at exactly the same URL. But if the new menu ends up at a different URL (a newly uploaded PDF usually does), the old code still points at the old file and you would need to generate and print a new one.',
  },
  {
    question: 'Where should I place a restaurant menu QR code?',
    answer:
      'Wherever a customer already looks: table tents and table stickers, the entrance, the counter, a window decal for passers-by, receipts, and takeaway packaging. Put it at a height and size someone can comfortably point a phone at, and keep it out of the way of spills and cutlery.',
  },
  {
    question: 'What makes a printed menu QR code easy to scan?',
    answer:
      'Contrast, clear space, and print quality. Keep the code dark on a light background, leave an empty margin around all four sides, print from the downloaded PNG or SVG rather than a screenshot, and size it for the distance people will scan from. Always test the printed proof on a couple of real phones before a full print run.',
  },
  {
    question: 'Does a menu QR code expire?',
    answer:
      'Not from our side. The code contains your menu link directly — there is no account, subscription, or redirect service behind it, so nothing here can switch it off. It stops working only if the menu URL itself goes offline or changes, or if the printed code gets damaged past the point a camera can read it.',
  },
  {
    question: 'Can I see how many people scanned my menu QR code?',
    answer:
      'Not with this tool. Scan counts require a tracking redirect between the code and your menu, which means a server. This generator encodes your link directly and has no backend, so a scan goes straight from the phone to your menu with nothing in between to count it. Any analytics you already have on the destination page still applies.',
  },
];
