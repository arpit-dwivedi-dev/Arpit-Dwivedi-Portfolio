import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { buildApiExampleUrl, summarizeApiExampleRequest, type ApiExample } from '../../tools/apiRequestBuilder/example';
import { METHOD_COLORS } from '../tools/apiRequestBuilder/sharedClasses';

interface ApiExampleCardProps {
  example: ApiExample;
}

// Reusable "Open in API Request Builder" CTA for guide content (see PART 5 of the
// content brief). This card is a summary + link only — it never sends the example
// request itself (PART 13) and never duplicates the tool's own editor (PART 5); the
// full request is encoded entirely in `href`, computed synchronously below so it's
// present as a real anchor href in both a live render and the Puppeteer prerender
// snapshot (see scripts/prerender.mjs), satisfying PART 10 without any client-side-only
// navigation step. buildApiExampleUrl throws for an unencodable example (oversized, per
// PART 12) rather than ever rendering a dead link — that failure surfaces immediately
// during development/prerender instead of silently.
export const ApiExampleCard = ({ example }: ApiExampleCardProps) => {
  const href = buildApiExampleUrl(example.request);
  const [requestLine, ...detailLines] = summarizeApiExampleRequest(example.request);
  const methodPrefix = `${example.request.method} `;

  return (
    <div className="rounded-2xl border border-ink/10 bg-bg-secondary/60 p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-secondary-text mb-2">Example request</p>
      <p className="font-bold text-ink mb-1">{example.title}</p>
      {example.description && <p className="text-sm text-secondary-text mb-3 leading-relaxed">{example.description}</p>}

      <pre className="rounded-xl border border-ink/10 bg-ink/5 p-3 text-xs font-mono overflow-x-auto mb-4">
        <code>
          <span className={`font-bold ${METHOD_COLORS[example.request.method]}`}>{example.request.method}</span>
          <span className="text-ink break-all"> {requestLine.slice(methodPrefix.length)}</span>
          {detailLines.map((line) => (
            <span key={line} className="block text-secondary-text mt-0.5">
              {line}
            </span>
          ))}
        </code>
      </pre>

      <Link
        to={href}
        aria-label={`Open "${example.title}" in API Request Builder`}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-bg-pure font-bold text-sm rounded-xl hover:glow-blue transition-all"
      >
        Open in API Request Builder
        <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
};
