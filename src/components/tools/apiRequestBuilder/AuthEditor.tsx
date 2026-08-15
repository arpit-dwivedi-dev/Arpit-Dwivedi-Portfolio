import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AUTH_TYPES, type Authentication, type ApiKeyLocation } from '../../../tools/apiRequestBuilder/types';
import { fieldClass, labelClass } from './sharedClasses';

const AUTH_LABELS: Record<Authentication['type'], string> = {
  none: 'No Auth',
  bearer: 'Bearer Token',
  basic: 'Basic Auth',
  'api-key': 'API Key',
};

interface AuthEditorProps {
  auth: Authentication;
  onChange: (auth: Authentication) => void;
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

export const AuthEditor = ({ auth, onChange }: AuthEditorProps) => (
  <div className="space-y-4 max-w-md">
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
