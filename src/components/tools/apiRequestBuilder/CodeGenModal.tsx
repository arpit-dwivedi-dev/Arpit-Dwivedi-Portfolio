import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Modal } from './Modal';
import type { ApiRequest } from '../../../tools/apiRequestBuilder/types';
import {
  CODE_LANGUAGES,
  CODE_LANGUAGE_LABELS,
  generateCode,
  type CodeLanguage,
} from '../../../tools/apiRequestBuilder/codeGenerators';

interface CodeGenModalProps {
  open: boolean;
  onClose: () => void;
  request: ApiRequest;
  /** Active environment's variables, flat key→value — {} (a no-op) when no environment is active,
   *  same convention as everywhere else this is threaded through (send(), Copy as cURL). */
  variables: Record<string, string>;
}

/** Lets the user pick a language and copy runnable code for the current request. Generation is an
 *  in-memory, read-only view over the request — it's never written to history, saved requests, or
 *  localStorage, and only ever runs while this modal is open (see the `open` guard below), so it
 *  costs nothing while the user is just editing params/headers/body elsewhere in the tool. */
export const CodeGenModal = ({ open, onClose, request, variables }: CodeGenModalProps) => {
  const [language, setLanguage] = useState<CodeLanguage>('curl');
  const [copied, setCopied] = useState(false);

  const code = useMemo(
    () => (open ? generateCode(language, request, variables) : ''),
    [open, language, request, variables],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied — nothing else to do.
    }
  };

  return (
    <Modal open={open} onClose={onClose} titleId="code-gen-heading" title="Generate code" maxWidthClassName="max-w-2xl">
      <div className="flex flex-wrap items-center gap-1.5 mb-3" role="tablist" aria-label="Code generation language">
        {CODE_LANGUAGES.map((lang) => (
          <button
            key={lang}
            type="button"
            role="tab"
            aria-selected={language === lang}
            onClick={() => setLanguage(lang)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              language === lang ? 'text-accent-blue bg-accent-blue/10' : 'text-secondary-text hover:text-ink hover:bg-ink/5'
            }`}
          >
            {CODE_LANGUAGE_LABELS[lang]}
          </button>
        ))}
      </div>

      <div className="relative">
        <pre className="rounded-xl border border-ink/10 bg-ink/[0.03] p-4 pr-16 text-xs font-mono text-ink overflow-auto max-h-[55vh] scrollbar-thin whitespace-pre">
          <code>{code}</code>
        </pre>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="absolute top-2 right-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border border-ink/10 bg-bg-secondary/90 backdrop-blur hover:border-ink/20 hover:bg-ink/5 text-secondary-text hover:text-ink transition-colors"
        >
          {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <p className="text-[11px] text-secondary-text mt-3 leading-snug">
        Generated in your browser from the current request and active environment — never saved, logged, or sent anywhere.
      </p>
    </Modal>
  );
};
