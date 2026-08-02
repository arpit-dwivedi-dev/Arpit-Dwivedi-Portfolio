const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined;

export const getAdsenseClientId = () => ADSENSE_CLIENT_ID;

let scriptPromise: Promise<boolean> | null = null;

// Loads Google's AdSense script once per page load, sharing one promise
// across every AdSlot instance so the tag is never injected twice.
// Resolves false (never rejects) on missing client ID or script load failure
// (network error, ad blocker) so callers can fail gracefully.
export const loadAdsenseScript = (): Promise<boolean> => {
  if (!ADSENSE_CLIENT_ID) return Promise.resolve(false);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    if (document.querySelector('script[data-adsense-loader]')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
    script.crossOrigin = 'anonymous';
    script.dataset.adsenseLoader = 'true';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return scriptPromise;
};

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}
