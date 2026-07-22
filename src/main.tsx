import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './ErrorBoundary';

history.scrollRestoration = 'manual';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');
createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Off the critical rendering path: Sentry's chunk (tracing + session replay)
// is only fetched/initialized once the browser is idle after first paint.
const scheduleMonitoringInit = () => import('./monitoring').then((m) => m.initErrorAndPerformanceMonitoring());
if ('requestIdleCallback' in window) {
  requestIdleCallback(scheduleMonitoringInit);
} else {
  setTimeout(scheduleMonitoringInit, 200);
}
