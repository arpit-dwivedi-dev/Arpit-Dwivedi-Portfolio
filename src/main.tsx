import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

history.scrollRestoration = 'manual';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
