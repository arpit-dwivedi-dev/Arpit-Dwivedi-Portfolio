import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

export const isAnalyticsEnabled = Boolean(GA_MEASUREMENT_ID);

// Error tracking + performance tracing + session replay, all via one Sentry
// project. No-op with a console notice if VITE_SENTRY_DSN isn't set (e.g. local
// dev), so the app never silently tries to report to a project that doesn't exist.
export const initErrorAndPerformanceMonitoring = () => {
  if (!SENTRY_DSN) {
    if (import.meta.env.DEV) {
      console.info('[monitoring] VITE_SENTRY_DSN not set — error/performance/replay tracking disabled.');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 1.0,
    // Record 10% of all sessions, but always record a session that hits an error.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
};

// Google Analytics 4 — loaded via gtag.js only when a Measurement ID is configured.
// GA4's own Realtime report shows active-users-right-now without any extra code.
export const initVisitorAnalytics = () => {
  if (!GA_MEASUREMENT_ID) {
    if (import.meta.env.DEV) {
      console.info('[monitoring] VITE_GA_MEASUREMENT_ID not set — visitor analytics disabled.');
    }
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  function gtag(...args: unknown[]) { window.dataLayer.push(args); }
  window.gtag = gtag;
  gtag('js', new Date());
  // send_page_view disabled here — the SPA sends its own page_view on each
  // route change (see trackPageView below) since GA's default only fires once
  // on initial script load and would miss all client-side navigation.
  gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
};

export const trackPageView = (path: string, title?: string) => {
  if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
    page_location: window.location.href,
  });
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
