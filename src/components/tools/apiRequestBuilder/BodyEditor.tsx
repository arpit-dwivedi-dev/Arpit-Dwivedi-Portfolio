import { AlertCircle, CheckCircle2, Code2, Minimize2 } from 'lucide-react';
import { BODY_MODES, type BodyMode, type FormField, type HttpMethod, type RequestBody } from '../../../tools/apiRequestBuilder/types';
import { formatJson, minifyJson, validateJson } from '../../../tools/apiRequestBuilder/jsonUtils';
import { FormFieldsEditor } from './FormFieldsEditor';
import { smallButtonClass } from './sharedClasses';

const MODE_LABELS: Record<BodyMode, string> = {
  none: 'None',
  json: 'JSON',
  text: 'Text',
  'form-urlencoded': 'Form URL Encoded',
  multipart: 'Multipart Form Data',
};

interface BodyEditorProps {
  body: RequestBody;
  method: HttpMethod;
  onModeChange: (mode: BodyMode) => void;
  onRawChange: (raw: string) => void;
  onAddField: () => void;
  onUpdateField: (id: string, patch: Partial<FormField>) => void;
  onRemoveField: (id: string) => void;
}

export const BodyEditor = ({ body, method, onModeChange, onRawChange, onAddField, onUpdateField, onRemoveField }: BodyEditorProps) => {
  const bodyDisallowed = method === 'GET' || method === 'HEAD';
  const validation = body.mode === 'json' ? validateJson(body.raw) : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 mb-3" role="radiogroup" aria-label="Body type">
        {BODY_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={body.mode === mode}
            onClick={() => onModeChange(mode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
              body.mode === mode
                ? 'border-accent-blue text-accent-blue bg-accent-blue/10'
                : 'border-ink/10 text-secondary-text hover:border-ink/20 hover:text-ink'
            }`}
          >
            {MODE_LABELS[mode]}
          </button>
        ))}
      </div>

      {bodyDisallowed && (
        <p className="text-xs text-amber-400/90 mb-3 flex items-center gap-1.5">
          <AlertCircle size={13} aria-hidden="true" />
          {method} requests are sent without a body — this configuration is saved but won't be included when sent.
        </p>
      )}

      {body.mode === 'none' && <p className="text-sm text-secondary-text py-2">This request has no body.</p>}

      {(body.mode === 'json' || body.mode === 'text') && (
        <div>
          {body.mode === 'json' && (
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                className={smallButtonClass}
                onClick={() => {
                  const result = validateJson(body.raw);
                  if (result.valid) onRawChange(formatJson(body.raw));
                }}
              >
                <Code2 size={13} aria-hidden="true" />
                Format
              </button>
              <button
                type="button"
                className={smallButtonClass}
                onClick={() => {
                  const result = validateJson(body.raw);
                  if (result.valid) onRawChange(minifyJson(body.raw));
                }}
              >
                <Minimize2 size={13} aria-hidden="true" />
                Minify
              </button>
              {validation && body.raw.trim() !== '' && (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-mono ml-auto ${
                    validation.valid ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {validation.valid ? <CheckCircle2 size={13} aria-hidden="true" /> : <AlertCircle size={13} aria-hidden="true" />}
                  {validation.valid ? 'Valid JSON' : 'Invalid JSON'}
                </span>
              )}
            </div>
          )}

          <textarea
            value={body.raw}
            onChange={(e) => onRawChange(e.target.value)}
            spellCheck={false}
            aria-label={body.mode === 'json' ? 'JSON request body' : 'Text request body'}
            aria-invalid={body.mode === 'json' && validation ? !validation.valid : undefined}
            placeholder={body.mode === 'json' ? '{\n  "key": "value"\n}' : 'Raw request body…'}
            className="w-full min-h-[220px] resize-y bg-ink/[0.03] border border-ink/10 hover:border-ink/20 focus:border-accent-blue focus:bg-ink/5 rounded-lg px-3 py-2.5 text-[13px] font-mono text-ink placeholder:text-secondary-text/50 focus:outline-none transition-colors leading-relaxed"
          />

          {body.mode === 'json' && validation && !validation.valid && body.raw.trim() !== '' && (
            <p className="mt-2 text-xs font-mono text-red-400 flex items-start gap-1.5">
              <AlertCircle size={13} aria-hidden="true" className="shrink-0 mt-0.5" />
              <span>
                {validation.error}
                {validation.line !== undefined && ` (line ${validation.line}, column ${validation.column})`}
              </span>
            </p>
          )}
        </div>
      )}

      {(body.mode === 'form-urlencoded' || body.mode === 'multipart') && (
        <FormFieldsEditor
          fields={body.formFields}
          allowFiles={body.mode === 'multipart'}
          onAdd={onAddField}
          onUpdate={onUpdateField}
          onRemove={onRemoveField}
        />
      )}
    </div>
  );
};
