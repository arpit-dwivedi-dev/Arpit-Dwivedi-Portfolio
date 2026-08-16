import { useState } from 'react';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import {
  AUTH_TYPES,
  CREDENTIALS_MODES,
  type Authentication,
  type ApiKeyLocation,
  type RequestHeader,
} from '../../../tools/apiRequestBuilder/types';
import { hasEnabledCookieHeader } from '../../../tools/apiRequestBuilder/resolveRequest';
import { fieldClass, labelClass } from './sharedClasses';

const AUTH_LABELS: Record<Authentication['type'], string> = {
  none: 'No Auth',
  bearer: 'Bearer Token',
  basic: 'Basic Auth',
  'api-key': 'API Key',
};

const CREDENTIALS_LABELS: Record<RequestCredentials, string> = {
  'same-origin': 'Same-origin',
  include: 'Include',
  omit: 'Omit',
};

const CREDENTIALS_COPY: Record<RequestCredentials, string> = {
  'same-origin': 'Browser cookies are sent only when the request URL shares your origin — the default fetch() behavior.',
  include: "Sends browser cookies even cross-origin, but only if the target server opts in with matching CORS headers (Access-Control-Allow-Credentials: true and a specific, non-wildcard Access-Control-Allow-Origin). It doesn't bypass CORS, and third-party cookie blocking in the browser can still prevent cookies from going out.",
  omit: 'Never sends browser cookies, even same-origin.',
};

interface AuthEditorProps {
  auth: Authentication;
  onChange: (auth: Authentication) => void;
  credentials: RequestCredentials;
  onCredentialsChange: (credentials: RequestCredentials) => void;
  headers: RequestHeader[];
  /** True when this request currently routes through any CORS proxy (custom, or auto's public-pool
   *  fallback) — surfaced only to explain why `include`'s cookie behavior may not hold through a proxy. */
  routesThroughProxy: boolean;
}

const SecretInput = ({
  id,
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        className={`${fieldClass} pr-9`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide value' : 'Show value'}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-secondary-text hover:text-ink transition-colors"
      >
        {visible ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
      </button>
    </div>
  );
};

export const AuthEditor = ({ auth, onChange, credentials, onCredentialsChange, headers, routesThroughProxy }: AuthEditorProps) => {
  const cookieHeaderPresent = hasEnabledCookieHeader(headers);

  return (
  <div className="space-y-5 max-w-md">
    <div>
      <span className={`${labelClass} block mb-1.5`}>Credentials</span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Credentials mode">
        {CREDENTIALS_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={credentials === mode}
            onClick={() => onCredentialsChange(mode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
              credentials === mode
                ? 'border-accent-blue text-accent-blue bg-accent-blue/10'
                : 'border-ink/10 text-secondary-text hover:border-ink/20 hover:text-ink'
            }`}
          >
            {CREDENTIALS_LABELS[mode]}
          </button>
        ))}
      </div>
      <p className="text-xs text-secondary-text mt-1.5 leading-snug">{CREDENTIALS_COPY[credentials]}</p>

      {credentials === 'include' && routesThroughProxy && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-400/25 bg-amber-400/5 p-2 sm:p-2.5 mt-2 text-xs text-amber-400/90 leading-snug">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            This request currently routes through a CORS proxy. Cookie/credential behavior through a proxy depends on that
            proxy's own handling, not just this setting — it may not match a direct browser request.
          </p>
        </div>
      )}

      {cookieHeaderPresent && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-400/25 bg-amber-400/5 p-2 sm:p-2.5 mt-2 text-xs text-amber-400/90 leading-snug">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            A <code className="font-mono text-amber-300">Cookie</code> header is set on the Headers tab. Browsers block scripts
            from setting this header directly, so it will likely be silently ignored when sent from here. For cookies to go
            out, use <strong className="text-amber-300">Include</strong> above with a server that allows credentialed CORS.
          </p>
        </div>
      )}
    </div>

    <div>
      <label htmlFor="auth-type" className={`${labelClass} block mb-1.5`}>
        Type
      </label>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Authentication type" id="auth-type">
        {AUTH_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={auth.type === type}
            onClick={() => onChange({ ...auth, type })}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
              auth.type === type
                ? 'border-accent-blue text-accent-blue bg-accent-blue/10'
                : 'border-ink/10 text-secondary-text hover:border-ink/20 hover:text-ink'
            }`}
          >
            {AUTH_LABELS[type]}
          </button>
        ))}
      </div>
    </div>

    {auth.type === 'none' && <p className="text-sm text-secondary-text">No authentication will be added to this request.</p>}

    {auth.type === 'bearer' && (
      <div>
        <label htmlFor="bearer-token" className={`${labelClass} block mb-1.5`}>
          Token
        </label>
        <SecretInput
          id="bearer-token"
          value={auth.bearerToken}
          onChange={(bearerToken) => onChange({ ...auth, bearerToken })}
          placeholder="Token"
          ariaLabel="Bearer token"
        />
        <p className="text-xs text-secondary-text mt-1.5">Sent as an Authorization: Bearer header.</p>
      </div>
    )}

    {auth.type === 'basic' && (
      <div className="space-y-3">
        <div>
          <label htmlFor="basic-username" className={`${labelClass} block mb-1.5`}>
            Username
          </label>
          <input
            id="basic-username"
            type="text"
            value={auth.basicUsername}
            onChange={(e) => onChange({ ...auth, basicUsername: e.target.value })}
            placeholder="Username"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="basic-password" className={`${labelClass} block mb-1.5`}>
            Password
          </label>
          <SecretInput
            id="basic-password"
            value={auth.basicPassword}
            onChange={(basicPassword) => onChange({ ...auth, basicPassword })}
            placeholder="Password"
            ariaLabel="Basic auth password"
          />
        </div>
        <p className="text-xs text-secondary-text">Sent as a base64-encoded Authorization: Basic header.</p>
      </div>
    )}

    {auth.type === 'api-key' && (
      <div className="space-y-3">
        <div>
          <label htmlFor="api-key-name" className={`${labelClass} block mb-1.5`}>
            Key
          </label>
          <input
            id="api-key-name"
            type="text"
            value={auth.apiKeyName}
            onChange={(e) => onChange({ ...auth, apiKeyName: e.target.value })}
            placeholder="X-API-Key"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="api-key-value" className={`${labelClass} block mb-1.5`}>
            Value
          </label>
          <SecretInput
            id="api-key-value"
            value={auth.apiKeyValue}
            onChange={(apiKeyValue) => onChange({ ...auth, apiKeyValue })}
            placeholder="Value"
            ariaLabel="API key value"
          />
        </div>
        <div>
          <span className={`${labelClass} block mb-1.5`}>Add to</span>
          <div className="flex gap-1.5" role="radiogroup" aria-label="API key location">
            {(['header', 'query'] as ApiKeyLocation[]).map((loc) => (
              <button
                key={loc}
                type="button"
                role="radio"
                aria-checked={auth.apiKeyLocation === loc}
                onClick={() => onChange({ ...auth, apiKeyLocation: loc })}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                  auth.apiKeyLocation === loc
                    ? 'border-accent-blue text-accent-blue bg-accent-blue/10'
                    : 'border-ink/10 text-secondary-text hover:border-ink/20 hover:text-ink'
                }`}
              >
                {loc === 'header' ? 'Header' : 'Query Parameter'}
              </button>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
  );
};
