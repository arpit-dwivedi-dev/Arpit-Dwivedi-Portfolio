import { useEffect, useState } from 'react';
import { getAdsenseClientId, loadAdsenseScript } from '../../lib/adsense';

interface AdSlotProps {
  /** AdSense ad unit slot ID from the dashboard. No slot, no render. */
  slot?: string;
  className?: string;
}

// Isolated, self-contained ad container. Renders nothing — no label, no
// empty box — if AdSense isn't configured, the slot ID is missing, the
// script fails to load (network error, ad blocker), or push() throws.
// A broken ad must never leave a visible gap in the layout.
export const AdSlot = ({ slot, className = '' }: AdSlotProps) => {
  const [failed, setFailed] = useState(false);
  const clientId = getAdsenseClientId();
  const willAttempt = Boolean(clientId && slot);

  useEffect(() => {
    if (!willAttempt) {
      setFailed(true);
      return;
    }
    let cancelled = false;
    loadAdsenseScript().then((ok) => {
      if (cancelled) return;
      if (!ok) {
        setFailed(true);
        return;
      }
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        setFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [willAttempt]);

  if (failed || !willAttempt) return null;

  return (
    // Reserved height while the ad is pending/loading — without it, the
    // <ins> jumps from ~0px to its real filled height the moment Google's
    // script sizes it, a directly measurable CLS event. Only the confirmed-
    // failure path above (ad blocked, script errored) collapses to nothing.
    <div className={`w-full ${className}`} style={{ minHeight: 250 }}>
      <span className="block text-[10px] font-mono text-secondary-text uppercase tracking-widest mb-2 text-center">
        Advertisement
      </span>
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};
