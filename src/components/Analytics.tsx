import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../monitoring';

// Fires a GA4 page_view on every client-side route change — gtag.js only
// sends one automatically, on initial script load, so SPA navigation would
// otherwise be invisible in Analytics.
export const Analytics = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    trackPageView(pathname, document.title);
  }, [pathname]);

  return null;
};
