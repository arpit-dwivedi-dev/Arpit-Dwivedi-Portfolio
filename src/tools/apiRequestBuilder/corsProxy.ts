import type { HttpMethod } from './types';

export interface CorsProxyPoolEntry {
  id: string;
  label: string;
  /** `{url}` is replaced with the encoded target URL. */
  template: string;
  /** false when the proxy always performs a plain GET server-side, ignoring the original method/headers/body. */
  forwardsRequest: boolean;
  sourceUrl: string;
  note: string;
}

// A small, curated set of named CORS-proxy *services* — not a scraped list of
// open IP:port relays (those are a different, much riskier category built for
// traffic interception, not something to wire into a tool that handles API
// tokens). Tried in order: Corsfix first since it forwards the full request;
// AllOrigins only helps for plain GETs.
export const CORS_PROXY_POOL: CorsProxyPoolEntry[] = [
  {
    id: 'corsfix',
    label: 'Corsfix',
    template: 'https://proxy.corsfix.com/?url={url}',
    forwardsRequest: true,
    sourceUrl: 'https://github.com/corsfix/corsfix',
    note: 'Open source, no signup for light use (60 req/min free tier). Forwards method, headers, and body.',
  },
  {
    id: 'allorigins',
    label: 'AllOrigins',
    template: 'https://api.allorigins.win/raw?url={url}',
    forwardsRequest: false,
    sourceUrl: 'https://github.com/gnuns/allorigins',
    note: 'Open source, no signup. Always performs a plain GET on the server and ignores method, headers, and auth.',
  },
];

export const SELF_HOSTABLE_PROXIES: Array<{ label: string; sourceUrl: string; note: string }> = [
  {
    label: 'Corsfix',
    sourceUrl: 'https://github.com/corsfix/corsfix',
    note: 'Open source, forwards all methods and headers.',
  },
  {
    label: 'Proxyscotch',
    sourceUrl: 'https://github.com/hoppscotch/proxyscotch',
    note: "By Hoppscotch's team, forwards all methods and headers.",
  },
];

export type CorsProxyMode = 'off' | 'auto' | 'custom';

export interface CorsProxySettings {
  mode: CorsProxyMode;
  customTemplate: string;
}

export const DEFAULT_CORS_PROXY_SETTINGS: CorsProxySettings = {
  mode: 'auto',
  customTemplate: '',
};

/** Candidates worth trying for this method, in priority order — GET can use
 *  the whole pool, anything else is restricted to proxies that actually forward it. */
export const eligiblePoolCandidates = (method: HttpMethod, hasHeadersOrAuth: boolean): CorsProxyPoolEntry[] =>
  CORS_PROXY_POOL.filter((p) => p.forwardsRequest || (method === 'GET' && !hasHeadersOrAuth));

const safeOrigin = (template: string): string => {
  try {
    return new URL(template.replace('{url}', '')).origin;
  } catch {
    return template;
  }
};

export const buildProxiedUrl = (template: string, targetUrl: string): string => {
  const encoded = encodeURIComponent(targetUrl);
  if (template.includes('{url}')) return template.replace('{url}', encoded);
  return `${template}${template.includes('?') ? '&' : '?'}url=${encoded}`;
};

export interface ResolvedCustomProxy {
  template: string;
  origin: string;
}

/** Custom mode only — the user's own choice/infrastructure, always used up front (not a fallback). */
export const resolveCustomProxy = (settings: CorsProxySettings): ResolvedCustomProxy | null => {
  if (settings.mode !== 'custom') return null;
  const template = settings.customTemplate.trim();
  if (!template) return null;
  return { template, origin: safeOrigin(template) };
};

export const proxyOrigin = (template: string): string => safeOrigin(template);
