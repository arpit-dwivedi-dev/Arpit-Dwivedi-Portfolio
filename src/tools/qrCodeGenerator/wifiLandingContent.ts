// Copy owned by the /wifi-qr-code landing page (see WifiQrCodePage.tsx).
// Kept in a plain .ts module rather than inline in the page for the same
// reason menuLandingContent.ts exists: jest runs in a node environment and
// only matches *.test.ts, so content that needs assertions (accuracy of the
// WiFi-payload claims, no overclaimed security/connection behavior, no
// fabricated stats) has to live outside the .tsx component to be testable.
//
// Everything here describes the STATIC WIFI: QR payload the tool actually
// generates (see buildWifiPacket in encode.ts) — network name, password,
// security type, and hidden-network flag, encoded directly into the code.
// There is no backend, no encryption beyond that plain-text payload format,
// and no guarantee every device auto-joins on scan, so no sentence below may
// imply otherwise.

export interface WifiQrFaqItem {
  question: string;
  answer: string;
}

/** The five-step scan flow, in the order the page renders them. */
export const WIFI_QR_HOW_IT_WORKS_STEPS: string[] = [
  'You enter the network name (SSID) exactly as it appears on the router or access point.',
  'You choose the security type the network actually uses — WPA/WPA2/WPA3, WEP, or open/none.',
  'You enter the password, if the network requires one.',
  'The tool encodes those details into a standard WIFI: QR payload, in your browser — nothing is uploaded or stored.',
  'A compatible phone camera reads the payload after scanning. Compatible phones may offer to join the network; the exact prompt varies by device and OS version.',
];

/** Security-type explanations. No claims about every router/device combination. */
export const WIFI_SECURITY_TYPES: { type: string; summary: string }[] = [
  {
    type: 'WPA / WPA2 / WPA3',
    summary:
      'The security used by most current home and business routers. Pick this option for any modern password-protected network — the tool encodes the same payload format regardless of which WPA generation the router actually runs.',
  },
  {
    type: 'WEP',
    summary:
      'An older, largely retired security standard. Included for networks still running it, but WEP is weak by modern standards — replace it with WPA2/WPA3 on the router itself where possible.',
  },
  {
    type: 'Open / None',
    summary:
      'No password is required to join. Common on public and guest networks. The QR still saves someone the step of picking the network by hand, even without a password to type.',
  },
];

/** Physical places a printed WiFi QR code tends to go. No adoption stats. */
export const WIFI_QR_PLACEMENT_IDEAS: string[] = [
  'Airbnb and short-term rental welcome books',
  'Hotel or guest room key cards and info sheets',
  'Café and coworking space counters or tables',
  'Restaurant tables, alongside a menu QR code',
  'Office reception desks for visitor WiFi',
  'Conference rooms and event spaces',
];

/**
 * Print guidance. Intentionally free of universal "X cm always works"
 * thresholds — scan distance, printer, and scanner quality all move that
 * number, so the page tells people to test instead.
 */
export const WIFI_QR_PRINT_TIPS: string[] = [
  'Keep strong contrast between the code and its background — dark code on a light background is the safest combination.',
  'Leave a clear margin (the "quiet zone") around all four sides of the code. Artwork or text pressed against the edge can stop it scanning.',
  'Print from the downloaded PNG or SVG rather than a screenshot — a rescaled screenshot blurs the code\'s squares and can break the pattern.',
  'Avoid placing it somewhere glossy lamination, glare, or damage will stop a camera from focusing on it.',
  'Size it for the distance it will actually be read from — a card on a nightstand can be small, a sign across a lobby needs to be larger.',
  'Test the printed code with an actual phone before handing it to a guest or printing a full run.',
];

/**
 * WiFi-specific FAQ. Rendered on the page AND emitted as FAQPage schema —
 * one source, so schema can never advertise a question the page doesn't show.
 */
export const WIFI_QR_FAQ: WifiQrFaqItem[] = [
  {
    question: 'How does a WiFi QR code work?',
    answer:
      'The tool encodes your network name, security type, and password into a standard WIFI: QR payload, directly in your browser. When a compatible phone camera scans it, it reads that payload and may offer to join the network — the exact prompt and level of support varies by phone and OS version.',
  },
  {
    question: 'What WiFi security types are supported?',
    answer:
      'WPA/WPA2/WPA3 (for most modern password-protected networks), WEP (for older networks still running it), and Open/None (for networks with no password). Pick whichever one matches what the router actually uses.',
  },
  {
    question: 'Can I create a QR code for an open WiFi network?',
    answer:
      'Yes — choose "None / Open" as the security type and leave the password blank. The generated code still saves someone the step of finding and selecting the network by hand, even though no password is involved.',
  },
  {
    question: 'Can I create a QR code for a hidden network?',
    answer:
      'Yes — turn on the hidden-network toggle before generating the code. This only tells a scanning device the network does not broadcast its name publicly, so it knows to connect by name rather than by browsing a visible list; the toggle itself does not hide or change the network. Only enable it if the network is actually configured as hidden on the router.',
  },
  {
    question: 'Does the QR code reveal my WiFi password?',
    answer:
      'Yes, to anyone who can scan or otherwise inspect it. The QR code is not a password-protection mechanism — it is a convenient encoding of the same network name and password you would otherwise type in by hand. Treat a printed WiFi QR code the same way you would treat the password itself: anyone who can scan or photograph it can read the credentials out of it.',
  },
  {
    question: 'Does a WiFi QR code expire?',
    answer:
      'Not from our side. The code encodes your network details directly — there is no account, subscription, or server behind it. It stops working only if you change the network name or password on the router without regenerating the code, or if the printed code gets damaged past the point a camera can read it.',
  },
  {
    question: 'Can I print a WiFi QR code for guests?',
    answer:
      'Yes — download it as a PNG or SVG and print it for a welcome book, guest room, café table, or reception desk. Use a guest network rather than your main household or office WiFi when sharing access with people you don\'t fully trust, since anyone who scans the code can read the password from it.',
  },
];
