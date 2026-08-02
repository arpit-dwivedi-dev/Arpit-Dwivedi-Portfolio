export interface MapsListing {
  id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  hours: string;
}

const NAME_PREFIXES = ['Silver', 'Golden', 'Blue Ridge', 'Riverside', 'Downtown', 'Maple', 'Summit', 'Harbor', 'Cedar', 'Northgate'];
const NAME_SUFFIXES = ['& Co.', 'Studio', 'Group', 'Bros.', 'House', 'Collective', 'Works', 'Center'];
const STREET_NAMES = ['Main St', 'Oak Ave', '2nd St', 'Elm St', 'Park Rd', 'Broadway', 'Market St', 'Highland Ave'];
const HOURS_TEMPLATES = [
  'Mon–Fri 9 AM–6 PM, Sat 10 AM–4 PM, Sun Closed',
  'Mon–Sat 8 AM–8 PM, Sun 10 AM–5 PM',
  'Daily 7 AM–9 PM',
  'Mon–Fri 10 AM–7 PM, Weekends Closed',
];

// Mulberry32 PRNG, seeded from the query — deterministic per (query, index)
// instead of Math.random(), so the same search reliably regenerates the same
// demo rows rather than reshuffling on every render.
function mulberry32(seed: number) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (Math.imul(31, h) + value.charCodeAt(i)) | 0;
  return h;
}

// Generates one fully-synthetic listing — not a real business, address, or
// phone number. Websites resolve under example.com (IANA-reserved for
// documentation) and phone numbers use the 555 exchange (reserved,
// non-dialable in North America) specifically so nothing here can collide
// with a real listing while the tool runs in demo mode (see
// GoogleMapsScraperPage for why: no scraping backend is connected yet).
export function generateSampleListing(query: string, index: number): MapsListing {
  const rand = mulberry32(hashString(query) + index * 7919);
  // Only the business-type portion of the query becomes part of the name —
  // "coffee shops in Austin, TX" -> "Coffee Shops", dropping the location —
  // otherwise the whole query ends up baked into the name and the fake
  // website slug, both far longer than a real Maps listing would ever be.
  const [rawCategory] = query.split(/\s+in\s+/i);
  const category = (rawCategory || query).trim().replace(/\b\w/g, (c) => c.toUpperCase());
  const prefix = NAME_PREFIXES[Math.floor(rand() * NAME_PREFIXES.length)];
  const suffix = NAME_SUFFIXES[Math.floor(rand() * NAME_SUFFIXES.length)];
  const name = `${prefix} ${category} ${suffix}`;

  const streetNumber = 100 + Math.floor(rand() * 899);
  const street = STREET_NAMES[Math.floor(rand() * STREET_NAMES.length)];
  const areaCode = 200 + Math.floor(rand() * 799);
  const phoneLine = 1000 + Math.floor(rand() * 8999);
  const rawSlug = `${prefix} ${category}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');
  const slug = rawSlug.slice(0, 24).replace(/-+$/, '');

  return {
    id: `${slug}-${index}`,
    name,
    address: `${streetNumber} ${street}`,
    phone: `(${areaCode}) 555-${phoneLine}`,
    website: `${slug}.example.com`,
    rating: Math.round((3.5 + rand() * 1.5) * 10) / 10,
    hours: HOURS_TEMPLATES[Math.floor(rand() * HOURS_TEMPLATES.length)],
  };
}
