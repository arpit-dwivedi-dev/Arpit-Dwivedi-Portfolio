import { useRef, useState } from 'react';
import { fetchListings } from './dataSource';
import type { MapsListing } from './sampleListings';

// Compliance guardrails — not just a notice, actual caps enforced below.
// Mirrors the anti-bot pacing model from the scraper skill (low volume,
// sequential, small delays) so wiring in a real backend later doesn't
// change these numbers, just what fetchListings() does internally.
export const MAX_RESULTS_PER_SEARCH = 20;
export const MAX_SEARCHES_PER_SESSION = 5;

// After Stop, the button swaps back to "Run search" in the same spot —
// a rapid extra click there (thinking it's still Stop) would otherwise
// fire a brand-new session instantly. Hold it disabled for a beat so the
// swap is visible before it's clickable again.
const RESTART_COOLDOWN_MS = 600;

export function useMapsScraper() {
  const [results, setResults] = useState<MapsListing[]>([]);
  const [running, setRunning] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchesUsed, setSearchesUsed] = useState(0);
  const [targetCount, setTargetCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const remainingSearches = Math.max(0, MAX_SEARCHES_PER_SESSION - searchesUsed);
  const sessionLimitReached = remainingSearches <= 0;

  const run = async (query: string, count: number) => {
    if (running || stopping || sessionLimitReached) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Enter a search term, like "coffee shops in Austin, TX".');
      return;
    }

    // Defensive: a previous session's abort() may not have unwound yet
    // (its 'abort' listeners fire synchronously but the fetchListings
    // promise settles asynchronously). Never let two sessions overlap.
    abortControllerRef.current?.abort();

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
        onRow: (row) => {
          // Guard against a row event that was already queued before abort()
          // fired from landing in state after the user hit Stop.
          if (controller.signal.aborted) return;
          setResults((prev) => [...prev, row]);
        },
      });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError('Something went wrong fetching results. Try again.');
      }
    } finally {
      // Only the session that's still current may flip `running` off — a
      // stale run's finally block finishing late must not clobber the UI
      // for whatever session (if any) started after it.
      if (abortControllerRef.current === controller) {
        setRunning(false);
      }
    }
  };

  const cancel = () => {
    abortControllerRef.current?.abort();
    // Flip the UI immediately instead of waiting on the reject/finally
    // round-trip — that gap is what let a fast re-click of "Run search"
    // look like the old session never stopped.
    setRunning(false);
    setStopping(true);
    setTimeout(() => setStopping(false), RESTART_COOLDOWN_MS);
  };

  return {
    results,
    running,
    stopping,
    error,
    run,
    cancel,
    searchesUsed,
    remainingSearches,
    sessionLimitReached,
    targetCount,
  };
}
