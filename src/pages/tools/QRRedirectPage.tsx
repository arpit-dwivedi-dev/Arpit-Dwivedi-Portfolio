import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// Transient utility URL — this is what a "Multi-URL" or dual-platform "App"
// QR code actually points at. All routing data lives in the query string, so
// resolving it needs no backend: pick a random URL, or pick by user-agent,
// entirely client-side at scan time. Not a content page, so it deliberately
// isn't wired into LanguageContext's ROUTE_META/canonical/hreflang machinery
// — it sets its own noindex tag below instead.
export const QRRedirectPage = () => {
  const [searchParams] = useSearchParams();
  const [manualChoice, setManualChoice] = useState<{ ios?: string; android?: string } | null>(null);

  useEffect(() => {
    document.title = 'Redirecting… | 101 Tech Labs';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    const urlsParam = searchParams.get('urls');
    if (urlsParam) {
      const urls = urlsParam.split(',').map((u) => decodeURIComponent(u)).filter(Boolean);
      if (urls.length > 0) {
        const pick = urls[Math.floor(Math.random() * urls.length)];
        window.location.replace(pick);
        return;
      }
    }

    const ios = searchParams.get('ios') ?? undefined;
    const android = searchParams.get('android') ?? undefined;
    if (ios || android) {
      const ua = navigator.userAgent;
      const isIos = /iPhone|iPad|iPod/i.test(ua);
      const isAndroid = /Android/i.test(ua);

      if (isIos && ios) {
        window.location.replace(ios);
        return;
      }
      if (isAndroid && android) {
        window.location.replace(android);
        return;
      }
      if (ios && !android) {
        window.location.replace(ios);
        return;
      }
      if (android && !ios) {
        window.location.replace(android);
        return;
      }
      // Desktop or an unrecognized user agent with both links set — don't
      // guess, let the visitor pick.
      setManualChoice({ ios, android });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-bg-pure flex items-center justify-center px-6">
      <div className="text-center space-y-4">
        {manualChoice ? (
          <>
            <p className="text-ink font-medium">Choose where to go</p>
            <div className="flex flex-col gap-3 items-center">
              {manualChoice.ios && (
                <a
                  href={manualChoice.ios}
                  className="px-5 py-3 bg-accent-blue text-bg-pure font-bold rounded-xl hover:glow-blue transition-all"
                >
                  Open iOS link
                </a>
              )}
              {manualChoice.android && (
                <a
                  href={manualChoice.android}
                  className="px-5 py-3 bg-ink/5 text-ink font-bold rounded-xl hover:bg-ink/10 transition-all"
                >
                  Open Android link
                </a>
              )}
            </div>
          </>
        ) : (
          <>
            <div
              className="mx-auto w-8 h-8 rounded-full border-2 border-ink/10 border-t-accent-blue animate-spin"
              role="status"
              aria-label="Redirecting"
            />
            <p className="text-secondary-text text-sm">Redirecting…</p>
          </>
        )}
      </div>
    </div>
  );
};
