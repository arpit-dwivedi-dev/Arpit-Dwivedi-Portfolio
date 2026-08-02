import { generateSampleListing, type MapsListing } from './sampleListings';

const THROTTLE_MS = 450;

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

// Demo data source: rows are generated locally and trickled in with the same
// pacing a real backend call would need. Signature is shaped like a real
// streamed API on purpose — query/count in, rows out one at a time via
// onRow, cancellable via signal — so wiring in an actual scraping backend
// later (fetch + SSE/NDJSON, or repeated polling) means replacing this
// function's body only. Nothing in useMapsScraper.ts or the page needs to
// change: same params, same cancellation, same one-row-at-a-time delivery.
export async function fetchListings({ query, count, signal, onRow }: FetchListingsParams): Promise<void> {
  for (let i = 0; i < count; i++) {
    await sleep(THROTTLE_MS, signal);
    onRow(generateSampleListing(query, i));
  }
}
