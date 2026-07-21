import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

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

// Google Analytics 4 — the gtag.js tag itself is injected as static <script>
// tags into index.html at build time (see the inject-gtag plugin in
// vite.config.ts) rather than loaded here at runtime; only when a Measurement
// ID is configured. GA4's own Realtime report shows active-users-right-now
// without any extra code.
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
