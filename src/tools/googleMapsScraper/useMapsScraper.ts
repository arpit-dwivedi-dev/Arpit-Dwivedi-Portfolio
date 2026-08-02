import { useRef, useState } from 'react';
import { fetchListings } from './dataSource';
import type { MapsListing } from './sampleListings';

// Compliance guardrails — not just a notice, actual caps enforced below.
// Mirrors the anti-bot pacing model from the scraper skill (low volume,
// sequential, small delays) so wiring in a real backend later doesn't
// change these numbers, just what fetchListings() does internally.
export const MAX_RESULTS_PER_SEARCH = 20;
export const MAX_SEARCHES_PER_SESSION = 5;

export function useMapsScraper() {
  const [results, setResults] = useState<MapsListing[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchesUsed, setSearchesUsed] = useState(0);
  const [targetCount, setTargetCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const remainingSearches = Math.max(0, MAX_SEARCHES_PER_SESSION - searchesUsed);
  const sessionLimitReached = remainingSearches <= 0;

  const run = async (query: string, count: number) => {
    if (running || sessionLimitReached) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Enter a search term, like "coffee shops in Austin, TX".');
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const capped = Math.min(count, MAX_RESULTS_PER_SEARCH);

    setError(null);
    setRunning(true);
    setResults([]);
    setTargetCount(capped);
    setSearchesUsed((n) => n + 1);

    try {
      await fetchListings({
        query: trimmed,
        count: capped,
        signal: controller.signal,
        onRow: (row) => setResults((prev) => [...prev, row]),
      });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError('Something went wrong fetching results. Try again.');
      }
    } finally {
      setRunning(false);
    }
  };

  const cancel = () => {
    abortControllerRef.current?.abort();
  };

  return {
    results,
    running,
    error,
    run,
    cancel,
    searchesUsed,
    remainingSearches,
    sessionLimitReached,
    targetCount,
  };
}
