import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchEngineeringPosts, POSTS_PER_PAGE } from '../lib/engineeringPosts';
import type { EngineeringPost } from '../content/blog/types';

interface State {
  posts: EngineeringPost[];
  page: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
}

const INITIAL_STATE: State = {
  posts: [],
  page: 0,
  isLoading: true,
  isLoadingMore: false,
  error: null,
  hasMore: true,
};

// Pagination + dedup + loading/error/end-of-results bookkeeping for the
// dev.to feed on /blog. seenIds persists across pages (a ref, not state)
// because dev.to can return the same article twice across adjacent pages
// when new posts publish mid-scroll and shift the ordering.
export const useEngineeringPosts = () => {
  const [state, setState] = useState<State>(INITIAL_STATE);
  const seenIds = useRef(new Set<string>());
  const inFlight = useRef(false);

  const loadPage = useCallback(async (page: number) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setState((s) => ({ ...s, isLoading: page === 1, isLoadingMore: page > 1, error: null }));

    try {
      const fetched = await fetchEngineeringPosts(page);
      const fresh = fetched.filter((post) => !seenIds.current.has(post.id));
      fresh.forEach((post) => seenIds.current.add(post.id));

      setState((s) => ({
        ...s,
        posts: [...s.posts, ...fresh],
        page,
        isLoading: false,
        isLoadingMore: false,
        hasMore: fetched.length >= POSTS_PER_PAGE,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        isLoadingMore: false,
        error: err instanceof Error ? err.message : 'Failed to load posts.',
      }));
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(() => {
    if (!inFlight.current && state.hasMore && !state.error) loadPage(state.page + 1);
  }, [loadPage, state.hasMore, state.error, state.page]);

  // Retries the failed page rather than restarting from page 1, so a
  // transient network blip during infinite scroll doesn't discard posts
  // already on screen.
  const retry = useCallback(() => {
    loadPage(state.posts.length === 0 ? 1 : state.page + 1);
  }, [loadPage, state.page, state.posts.length]);

  return { ...state, loadMore, retry };
};
