import { generateSampleListing, type MapsListing } from './sampleListings';

const DEMO_THROTTLE_MS = 450;

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

export interface FetchListingsParams {
  query: string;
  count: number;
  signal: AbortSignal;
  onRow: (row: MapsListing) => void;
}

async function fetchListingsDemo({ query, count, signal, onRow }: FetchListingsParams): Promise<void> {
  for (let i = 0; i < count; i++) {
    await sleep(DEMO_THROTTLE_MS, signal);
    onRow(generateSampleListing(query, i));
  }
}

// Talks to the real scraper (see 101techlabs-tools-api, tools/google-maps-scraper).
// Server-Sent Events match this function's existing contract naturally: rows
// arrive one at a time via a "row" event, a business-level failure arrives as
// "failed" (deliberately not named "error" — that name collides with
// EventSource's own connection-failure event), and "done" ends the stream.
function fetchListingsLive({ query, count, signal, onRow }: FetchListingsParams, apiUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/tools/google-maps-scraper/stream', apiUrl);
    url.searchParams.set('query', query);
    url.searchParams.set('count', String(count));

    const source = new EventSource(url.toString());
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      source.close();
      fn();
    };

    if (signal.aborted) {
      finish(() => reject(new DOMException('Aborted', 'AbortError')));
      return;
    }
    signal.addEventListener('abort', () => finish(() => reject(new DOMException('Aborted', 'AbortError'))));

    source.addEventListener('row', (event) => {
      onRow(JSON.parse((event as MessageEvent).data));
    });

    source.addEventListener('failed', (event) => {
      const data = (event as MessageEvent).data;
      const message = data ? (JSON.parse(data).message as string) : 'Something went wrong fetching results.';
      finish(() => reject(new Error(message)));
    });

    source.addEventListener('done', () => {
      finish(resolve);
    });

    // Native connection-level failure (network drop, server unreachable) —
    // distinct from the server's own "failed" event above.
    source.onerror = () => {
      finish(() => reject(new Error('Lost connection to the scraper. Try again.')));
    };
  });
}

export async function fetchListings(params: FetchListingsParams): Promise<void> {
  const apiUrl = import.meta.env.VITE_TOOLS_API_URL as string | undefined;
  if (!apiUrl) return fetchListingsDemo(params);
  return fetchListingsLive(params, apiUrl);
}

export const isLiveMode = Boolean(import.meta.env.VITE_TOOLS_API_URL);
