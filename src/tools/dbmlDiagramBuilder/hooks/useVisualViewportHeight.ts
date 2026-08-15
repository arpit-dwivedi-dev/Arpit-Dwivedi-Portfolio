import { useEffect, useState } from 'react';

/**
 * Height (px) of the *visual* viewport, or null when it can't be measured.
 *
 * Matters for the on-screen keyboard. Android shrinks the layout viewport when
 * the keyboard opens, so `100dvh` follows it — iOS Safari does not: it keeps
 * the page at full height and scrolls it instead, which pushes this tool's
 * header, tab bar and status bar off screen while the user types in the
 * editor. Sizing the app to `visualViewport.height` (and undoing the scroll
 * iOS applies) keeps the whole chrome inside the visible area on both.
 *
 * Only worth doing on touch layouts — on desktop it would also react to
 * pinch-zoom, which should not resize the app.
 */
export function useVisualViewportHeight(enabled: boolean): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.visualViewport) {
      setHeight(null);
      return;
    }
    const viewport = window.visualViewport;
    const update = () => {
      setHeight(Math.round(viewport.height));
      // The app is pinned to the visible viewport, so any document scroll iOS
      // added to reveal the caret only hides the header — undo it.
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, [enabled]);

  return height;
}
