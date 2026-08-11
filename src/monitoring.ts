import type { ErrorInfo } from 'react';
import type * as SentryReact from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

// Dynamically imported (rather than a static top-level import) so the Sentry
// chunk's fetch/parse never sits on the critical path that gates first paint —
// it loads once the browser is idle instead. Cached after the first call so
// reportError() below can reuse the same initialized SDK.
let sentryPromise: Promise<typeof SentryReact> | null = null;
const loadSentry = () => {
  if (!sentryPromise) sentryPromise = import('@sentry/react');
  return sentryPromise;
};

// Error tracking + performance tracing + session replay, all via one Sentry
// project. No-op with a console notice if VITE_SENTRY_DSN isn't set (e.g. local
// dev), so the app never silently tries to report to a project that doesn't exist.
export const initErrorAndPerformanceMonitoring = async () => {
  if (!SENTRY_DSN) {
    if (import.meta.env.DEV) {
      console.info('[monitoring] VITE_SENTRY_DSN not set — error/performance/replay tracking disabled.');
    }
    return;
  }

  const Sentry = await loadSentry();
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

// Used by ErrorBoundary — reports a caught render error to Sentry if it's
// configured, loading the SDK on demand if monitoring init hasn't reached it yet.
export const reportError = async (error: Error, info: ErrorInfo) => {
  if (!SENTRY_DSN) return;
  const Sentry = await loadSentry();
  Sentry.captureException(error, { contexts: { react: { componentStack: info.componentStack } } });
};

// Google Analytics 4 — the gtag.js tag itself is injected as static <script>
// tags into index.html at build time (see the inject-gtag plugin in
// vite.config.ts) rather than loaded here at runtime; only when a Measurement
// ID is configured. GA4's own Realtime report shows active-users-right-now
// without any extra code.
export const trackPageView = (path: string, title?: string) => {
  trackEvent('page_view', {
    page_path: path,
    page_title: title,
    page_location: window.location.href,
  });
};

// Generic GA4 custom-event dispatcher — used to attribute conversions (leads,
// tool usage) back to the specific tool/page that drove them, since page_view
// alone can't tell "traffic" apart from "traffic that actually did something".
export const trackEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
