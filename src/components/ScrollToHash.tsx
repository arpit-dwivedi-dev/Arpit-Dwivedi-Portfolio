import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToHash = () => {
  const { pathname, hash } = useLocation();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
          if (!element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '-1');
          }
          element.focus({ preventScroll: true });
        }, 100);
      }
    } else if (prevPathname.current !== pathname) {
      // Only scroll to top on actual route navigation, not initial load.
      // This avoids competing with history.scrollRestoration = 'manual'
      // before the page layout has settled.
      window.scrollTo(0, 0);
    }
    prevPathname.current = pathname;
  }, [pathname, hash]);

  return null;
};
