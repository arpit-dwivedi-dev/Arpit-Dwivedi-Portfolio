import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';
import { initErrorAndPerformanceMonitoring, initVisitorAnalytics } from './monitoring';

initErrorAndPerformanceMonitoring();
initVisitorAnalytics();

history.scrollRestoration = 'manual';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');
createRoot(rootElement).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg-pure text-white text-center px-6">
          <div>
            <p className="text-xl font-bold mb-2">Something went wrong.</p>
            <p className="text-secondary-text text-sm">Please refresh the page. Our team has been notified.</p>
          </div>
        </div>
      }
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
