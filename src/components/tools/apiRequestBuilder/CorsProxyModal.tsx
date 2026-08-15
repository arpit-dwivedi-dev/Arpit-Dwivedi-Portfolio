import { AlertTriangle, ExternalLink } from 'lucide-react';
import {
  CORS_PROXY_POOL,
  SELF_HOSTABLE_PROXIES,
  type CorsProxyMode,
  type CorsProxySettings,
} from '../../../tools/apiRequestBuilder/corsProxy';
import { Modal } from './Modal';
import { fieldClass, labelClass } from './sharedClasses';

interface CorsProxyModalProps {
  open: boolean;
  onClose: () => void;
  settings: CorsProxySettings;
  onChange: (settings: CorsProxySettings) => void;
}

const MODE_COPY: Record<CorsProxyMode, string> = {
  off: 'Only sends directly. If the target API blocks it (CORS), you just see the error.',
  auto: 'Sends directly first. Only retries through a public proxy if that gets blocked — always shown when it happens.',
  custom: 'Every request goes through the proxy URL below from the start — use this for a proxy you run yourself.',
};

export const CorsProxyModal = ({ open, onClose, settings, onChange }: CorsProxyModalProps) => (
  <Modal open={open} onClose={onClose} titleId="cors-proxy-heading" title="CORS proxy" maxWidthClassName="max-w-xl">
    <div className="flex items-start gap-2 rounded-lg border border-amber-400/25 bg-amber-400/5 p-2.5 mb-3 text-xs text-amber-400/90 leading-snug">
      <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
      <p>
        <strong className="text-amber-300">Use your own private proxy for real credentials.</strong> Any proxy — including the
        automatic public fallback in Auto mode — can see this request's URL, headers, and body, including tokens in the{' '}
        <strong>Auth tab</strong>. Free public proxies can also be slow or go down without notice (it happened during our testing).
        Don't rely on one for anything sensitive; self-host instead (options below).
      </p>
    </div>

    <fieldset>
      <legend className={`${labelClass} block mb-1.5`}>Mode</legend>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="CORS proxy mode">
        {(
          [
            ['off', 'Off'],
            ['auto', 'Auto (recommended)'],
            ['custom', 'Custom URL'],
          ] as Array<[CorsProxyMode, string]>
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={settings.mode === mode}
            onClick={() => onChange({ ...settings, mode })}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
              settings.mode === mode
                ? 'border-accent-blue text-accent-blue bg-accent-blue/10'
                : 'border-ink/10 text-secondary-text hover:border-ink/20 hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-secondary-text mt-1.5 leading-snug">{MODE_COPY[settings.mode]}</p>
    </fieldset>

    {settings.mode === 'auto' && (
      <div className="mt-3">
        <p className={`${labelClass} mb-1.5`}>Fallback order</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {CORS_PROXY_POOL.map((proxy, idx) => (
            <div key={proxy.id} className="p-2.5 rounded-lg border border-ink/10">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink">
                  <span className="text-secondary-text font-mono text-xs mr-1">{idx + 1}.</span>
                  {proxy.label}
                </span>
                <a
                  href={proxy.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${proxy.label} source`}
                  className="shrink-0 text-secondary-text hover:text-accent-blue"
                >
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              </div>
              <p className="text-xs text-secondary-text mt-0.5 leading-snug">{proxy.note}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {settings.mode === 'custom' && (
      <div className="mt-3">
        <label htmlFor="cors-proxy-custom-url" className={`${labelClass} block mb-1.5`}>
          Proxy URL template
        </label>
        <input
          id="cors-proxy-custom-url"
          type="text"
          value={settings.customTemplate}
          onChange={(e) => onChange({ ...settings, customTemplate: e.target.value })}
          placeholder="https://your-proxy.example.com/?url={url}"
          spellCheck={false}
          className={fieldClass}
        />
        <p className="text-xs text-secondary-text mt-1.5 leading-snug">
          <code className="font-mono text-ink">{'{url}'}</code> is replaced with the encoded target URL. Assumed to forward your
          method, headers, and body.
        </p>

        <div className="mt-2.5 pt-2.5 border-t border-ink/10">
          <p className={`${labelClass} mb-1.5`}>Self-host for free</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {SELF_HOSTABLE_PROXIES.map((proxy) => (
              <div key={proxy.label} className="px-2.5 py-2 rounded-lg border border-ink/10">
                <a
                  href={proxy.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-ink font-medium hover:text-accent-blue"
                >
                  {proxy.label} <ExternalLink size={11} aria-hidden="true" />
                </a>
                <p className="text-xs text-secondary-text mt-0.5 leading-snug">{proxy.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    <div className="flex justify-end mt-4">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 rounded-lg text-sm font-bold bg-accent-blue text-bg-pure hover:glow-blue transition-all"
      >
        Done
      </button>
    </div>
  </Modal>
);
