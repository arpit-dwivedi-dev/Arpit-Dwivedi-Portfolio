import type { ComponentType } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { TOOLS, toolTitle, toolDescription } from '../tools/registry';
import { Reveal } from './ui/Reveal';
import { SectionRule } from './ui/SectionRule';
import { QR_TOOL_PATH, QR_TOOL_MODULES } from './workbenchQr';

/**
 * The Workbench — the site's signature section.
 *
 * This was four rounded cards in a 2x2 grid, each with an icon, a blurb and a
 * "why it's built this way" footnote. The differentiator this shop actually
 * has is that the free tools are real working software, and a card grid is the
 * one layout that communicates none of that.
 *
 * So the section is a single instrument rack instead: one continuous surface,
 * four bays divided by hairlines, and inside each bay a live fragment of the
 * tool itself. Every fragment has to be TRUE — the QR is a real scannable
 * code for the tool's own page, the invoice line items really do sum to the
 * total shown, the schema node is valid DBML. A bay with nothing true to show
 * falls back to a plain one (see the `stage` lookup), because a decorative
 * approximation of working software on a page whose whole argument is "we
 * ship working software" is worse than an honest card.
 *
 * This is also the only place on the site that spends cyan across a whole
 * band. Everywhere else it is reserved for focus and live state, which is
 * what makes it mean something here.
 */

/** Invoice figures that actually add up: 40,000 + 65,000 = 105,000, +18% GST. */
const INVOICE_ROWS = [
  { label: 'Design retainer', amount: '40,000.00' },
  { label: 'Build sprint', amount: '65,000.00' },
  { label: 'GST 18%', amount: '18,900.00' },
];
const INVOICE_TOTAL = '123,900.00';

const StageInvoice = () => (
  <div className="w-full font-mono text-[0.6875rem]">
    {INVOICE_ROWS.map((row) => (
      <div key={row.label} className="flex justify-between gap-3 pb-2">
        <span className="text-secondary-text">{row.label}</span>
        <span className="text-ink">{row.amount}</span>
      </div>
    ))}
    <div className="h-px hairline mt-1" />
    <div className="flex justify-between items-baseline gap-3 pt-2.5">
      <span className="t-label text-[0.5625rem] text-secondary-text">Total INR</span>
      <span className="text-accent-blue font-bold text-[0.9375rem] tracking-tight">{INVOICE_TOTAL}</span>
    </div>
  </div>
);

const StageQr = () => (
  <svg
    viewBox={`0 0 ${QR_TOOL_MODULES} ${QR_TOOL_MODULES}`}
    className="w-[104px] h-[104px] text-ink"
    shapeRendering="crispEdges"
    role="img"
    aria-label="QR code linking to the QR code generator"
  >
    <path fill="currentColor" d={QR_TOOL_PATH} />
  </svg>
);

const StageApi = () => (
  <div className="w-full font-mono text-[0.6875rem] flex flex-col gap-2.5">
    <div className="flex items-stretch border border-hairline rounded-[3px] overflow-hidden">
      <span className="t-label text-[0.5rem] text-bg-pure bg-secondary-text px-2 flex items-center">GET</span>
      <span className="text-ink px-2 py-1.5 truncate">api.github.com/repos/react</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="t-label text-[0.5rem] text-accent-blue border border-accent-blue/40 rounded-[2px] px-1.5 py-1">200 OK</span>
      <span className="text-secondary-text">application/json</span>
    </div>
    <div className="h-px hairline" />
    <pre className="text-secondary-text leading-relaxed m-0">
      <span className="text-secondary-text">{'{'}</span>
      {'\n  '}
      <span className="text-ink">"name"</span>
      <span className="text-secondary-text">: </span>
      <span className="text-accent-purple-text">"react"</span>
      {'\n'}
      <span className="text-secondary-text">{'}'}</span>
    </pre>
  </div>
);

const SCHEMA_COLUMNS = [
  { name: 'id', type: 'bigint', flag: 'PK' },
  { name: 'email', type: 'varchar', flag: 'UQ' },
  { name: 'created_at', type: 'timestamp', flag: null },
];

const StageSchema = () => (
  <div className="w-full border border-hairline rounded-[3px] overflow-hidden font-mono text-[0.6875rem]">
    <div className="t-label text-[0.625rem] text-ink bg-accent-purple/25 border-b border-hairline px-2.5 py-1.5">users</div>
    <div className="px-2.5 py-2 flex flex-col gap-1.5">
      {SCHEMA_COLUMNS.map((col) => (
        <div key={col.name} className="flex gap-2 items-baseline">
          <span className="text-ink grow">{col.name}</span>
          <span className="text-secondary-text">{col.type}</span>
          {col.flag && <span className="t-label text-[0.5rem] text-accent-purple-text">{col.flag}</span>}
        </div>
      ))}
    </div>
  </div>
);

/** Bay contents keyed by tool id — an unmatched tool renders without a stage. */
const STAGES: Record<string, ComponentType> = {
  'invoice-generator': StageInvoice,
  'qr-code-generator': StageQr,
  'api-request-builder': StageApi,
  'dbml-diagram-builder': StageSchema,
};

/**
 * Hairlines BETWEEN bays only — never on the rack's outer edges, which the
 * band's own border already draws. Written out per index rather than as
 * nth-child variants because the divider that belongs on a bay changes with
 * the column count (1 / 2 / 4), and the responsive nth-child soup that
 * expresses that is unreadable and quietly wrong at one breakpoint.
 */
const bayDividers = (i: number) =>
  [
    'border-hairline',
    // 1 column: a rule above every bay but the first.
    i > 0 ? 'border-t' : '',
    // 2 columns: rule left of the right-hand bay, above the second row.
    'sm:border-t-0',
    i % 2 === 1 ? 'sm:border-l' : '',
    i >= 2 ? 'sm:border-t' : '',
    // 4 columns: one rule left of every bay but the first.
    'xl:border-t-0',
    i > 0 ? 'xl:border-l' : 'xl:border-l-0',
  ]
    .filter(Boolean)
    .join(' ');

export const FreeTools = () => {
  const { content } = useLanguage();
  const t = content.freeToolsSection;
  const visibleTools = TOOLS.filter((tool) => !tool.hidden);

  return (
    <section className="relative pt-24 sm:pt-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <SectionRule
          label="Four tools · free · no signup"
          trailing={
            <span className="hidden sm:flex items-center gap-2 whitespace-nowrap">
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-full bg-accent-blue shadow-[0_0_8px_1px_color-mix(in_srgb,var(--color-accent-blue)_70%,transparent)]"
              />
              <span className="t-label text-[0.5625rem] text-accent-blue">Running on this page</span>
            </span>
          }
        />
        <Reveal className="pt-6 pb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-16">
          <h2 className="t-dl text-ink max-w-[20ch]">
            {t.title} {t.titleAccent}
          </h2>
          <p className="text-secondary-text leading-relaxed max-w-[44ch] lg:pb-1.5">{t.description}</p>
        </Reveal>
      </div>

      <Reveal from="none" className="surface border-x-0 rounded-none">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {visibleTools.map((tool, idx) => {
            const Stage = STAGES[tool.id];
            return (
              <Reveal key={tool.id} index={idx} className={`h-full ${bayDividers(idx)}`}>
                <a
                  href={`/tools/${tool.category}/${tool.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group h-full flex flex-col px-5 sm:px-6 py-8 hover:bg-ink/[0.02] transition-colors"
                >
                  <div className="flex items-baseline gap-2.5 pb-2">
                    <span className="font-mono text-[0.6875rem] text-secondary-text tracking-wider">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="t-dm text-[1.0625rem] text-ink group-hover:text-accent-blue transition-colors">
                      {toolTitle(tool)}
                    </h3>
                  </div>
                  <p className="text-[0.8125rem] text-secondary-text leading-relaxed pb-5">{toolDescription(tool)}</p>

                  {Stage && (
                    <div className="min-h-[168px] flex items-center justify-center rounded-[3px] bg-bg-pure border border-hairline border-t-[color:var(--hairline-lit)] p-3.5">
                      <Stage />
                    </div>
                  )}

                  <span className="mt-auto pt-6 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink group-hover:text-accent-blue transition-colors">
                    Open
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
                  </span>
                </a>
              </Reveal>
            );
          })}
        </div>
      </Reveal>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-10">
        <Reveal>
          <Link
            to="/tools"
            className="group inline-flex items-center gap-2 h-11 text-sm font-semibold text-ink border-b border-accent-blue/40 hover:border-accent-blue hover:text-accent-blue transition-colors"
          >
            {t.viewAll}
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
};
