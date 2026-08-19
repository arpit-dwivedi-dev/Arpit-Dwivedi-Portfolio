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

// Injects the Microsoft Clarity tag (session recordings + heatmaps) the same
// way as the GA4 tag above: statically, at build/dev-server time, so no tag is
// present at all when VITE_CLARITY_ID is unset. Clarity's own snippet is an
// async loader, but it still has to run during the initial parse for it to
// capture the first paint's DOM — a later runtime injection misses the start
// of the session, which is exactly the part worth replaying.
const clarityPlugin = (projectId: string | undefined): Plugin => ({
  name: 'inject-clarity',
  transformIndexHtml(html) {
    if (!projectId) return html;
    return html.replace(
      '</head>',
      `    <script>
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${projectId}");
    </script>
  </head>`,
    );
  },
});

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    plugins: [
      react(),
      tailwindcss(),
      gtagPlugin(env.VITE_GA_MEASUREMENT_ID),
      clarityPlugin(env.VITE_CLARITY_ID),
    ],
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
