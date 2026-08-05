import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

// Injects the GA4 tag as static <script> elements in the page's initial HTML.
// This matters, not just style: gtag.js's own bootstrap only ever dispatched
// collect requests when its <script> tag was present in the initial parse —
// a `document.createElement('script')` + appendChild (what this used to do
// from src/monitoring.ts, matching the pattern used to lazy-load @sanity/client)
// loaded the script and processed the dataLayer queue (gtm.dom/gtm.load fired)
// but never sent a single hit, in dozens of reproducions. Because this only
// runs at build/dev-server time (not in the browser), the "disabled when the
// env var is unset" behavior still works: the tags are simply omitted from
// the HTML entirely rather than checked at runtime.
const gtagPlugin = (measurementId: string | undefined): Plugin => ({
  name: 'inject-gtag',
  transformIndexHtml(html) {
    if (!measurementId) return html;
    return html.replace(
      '</head>',
      `    <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){ window.dataLayer.push(arguments); }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', '${measurementId}', { send_page_view: false });
    </script>
  </head>`,
    );
  },
});

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    plugins: [react(), tailwindcss(), gtagPlugin(env.VITE_GA_MEASUREMENT_ID)],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          // Splits the animation/icon/QR libraries out of the main bundle —
          // they're sizeable and change far less often than app code, so a
          // separate chunk means a redeploy doesn't force revisitors to
          // re-download them. Matters more now that content paints from the
          // prerendered HTML (see scripts/prerender.mjs) rather than waiting
          // on this bundle to hydrate.
          manualChunks: {
            sentry: ['@sentry/react'],
            motion: ['motion'],
            icons: ['lucide-react', 'react-icons'],
            qrcode: ['qrcode.react'],
          },
        },
      },
    },
  };
});
