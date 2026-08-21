import type { ComponentType } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { TOOLS, toolTitle, toolDescription } from '../tools/registry';
import { Reveal } from './ui/Reveal';
import { SectionRule } from './ui/SectionRule';

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
 * tool itself. A bay with nothing concrete to show falls back to a plain one
 * (see the `stage` lookup), because the whole section works best when each
 * tool has a recognizable artifact instead of a generic illustration.
 *
 * This is also the only place on the site that spends cyan across a whole
 * band. Everywhere else it is reserved for focus and live state, which is
 * what makes it mean something here.
 */

const StageInvoice = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300" width="100%" height="100%" role="img" aria-label="Animated invoice preview">
    <defs>
      <filter id="inv-neon" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <style>
      {`
        .inv-rev { opacity: 0; animation: invUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .inv-d1 { animation-delay: 0.2s; }
        .inv-d2 { animation-delay: 0.4s; }
        .inv-d3 { animation-delay: 0.6s; }
        .inv-d4 { animation-delay: 0.8s; }
        .inv-d5 { animation-delay: 1.0s; }
        @keyframes invUpFade {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .inv-pulse {
          animation: invNeonPulse 2s ease-in-out infinite alternate;
          animation-delay: 1.5s;
        }
        @keyframes invNeonPulse {
          0% { opacity: 0.8; filter: brightness(1); }
          100% { opacity: 1; filter: brightness(1.3); }
        }
      `}
    </style>

    <rect width="500" height="300" rx="10" fill="#090C10" />

    <g style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Roboto Mono', Consolas, monospace", fontSize: '16px' }}>
      <g className="inv-rev inv-d1">
        <text x="50" y="80" fill="#94A3B8">Design retainer</text>
        <text x="450" y="80" fill="#F8FAFC" textAnchor="end">40,000.00</text>
      </g>
      <g className="inv-rev inv-d2">
        <text x="50" y="135" fill="#94A3B8">Build sprint</text>
        <text x="450" y="135" fill="#F8FAFC" textAnchor="end">65,000.00</text>
      </g>
      <g className="inv-rev inv-d3">
        <text x="50" y="190" fill="#94A3B8">GST 18%</text>
        <text x="450" y="190" fill="#F8FAFC" textAnchor="end">18,900.00</text>
      </g>
      <g className="inv-rev inv-d4">
        <line x1="50" y1="225" x2="450" y2="225" stroke="#334155" strokeWidth="1.5" />
      </g>
      <g className="inv-rev inv-d5">
        <text x="50" y="265" fill="#94A3B8" fontWeight="600" letterSpacing="1">TOTAL INR</text>
        <g className="inv-pulse">
          <text x="450" y="265" fill="#00E5FF" fontSize="22px" fontWeight="700" textAnchor="end" filter="url(#inv-neon)">123,900.00</text>
        </g>
      </g>
    </g>
  </svg>
);

const StageQr = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300" width="100%" height="100%" role="img" aria-label="Animated QR code preview">
    <defs>
      <filter id="qr-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <clipPath id="qr-clip">
        <rect x="175" y="75" width="150" height="150" />
      </clipPath>
    </defs>
    <style>
      {`
        .qr-fade { opacity: 0; animation: qrFadeIn 0.8s ease-out forwards; animation-delay: 0.3s; }
        @keyframes qrFadeIn { to { opacity: 1; } }
        .qr-scan { animation: qrScanAnim 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate; }
        @keyframes qrScanAnim {
          0% { transform: translateY(0); }
          100% { transform: translateY(150px); }
        }
      `}
    </style>

    <rect width="500" height="300" rx="10" fill="#090C10" />

    <g className="qr-fade">
      <rect x="175" y="75" width="150" height="150" fill="#F8FAFC" rx="4" />
      <g fill="#090C10">
        <rect x="185" y="85" width="35" height="35" rx="3" />
        <rect x="195" y="95" width="15" height="15" fill="#F8FAFC" />
        <rect x="199" y="99" width="7" height="7" rx="1" />
        <rect x="280" y="85" width="35" height="35" rx="3" />
        <rect x="290" y="95" width="15" height="15" fill="#F8FAFC" />
        <rect x="294" y="99" width="7" height="7" rx="1" />
        <rect x="185" y="180" width="35" height="35" rx="3" />
        <rect x="195" y="190" width="15" height="15" fill="#F8FAFC" />
        <rect x="199" y="194" width="7" height="7" rx="1" />
        <path d="M230 85 h10 v20 h-10 z M250 95 h20 v10 h-20 z M230 115 h40 v10 h-40 z M185 135 h35 v10 h-35 z M230 135 h10 v35 h-10 z M250 135 h40 v10 h-40 z M295 135 h20 v20 h-20 z M250 155 h30 v10 h-30 z M230 180 h15 v35 h-15 z M255 180 h20 v15 h-20 z M285 170 h30 v15 h-30 z M285 195 h10 v20 h-10 z M305 195 h10 v20 h-10 z" />
      </g>
      <g clipPath="url(#qr-clip)">
        <line x1="175" y1="75" x2="325" y2="75" stroke="#00E5FF" strokeWidth="3" filter="url(#qr-glow)" className="qr-scan" />
      </g>
    </g>
  </svg>
);

const StageApi = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300" width="100%" height="100%" role="img" aria-label="Animated API request preview">
    <style>
      {`
        .api-rev { opacity: 0; animation: apiSlideRight 0.5s ease-out forwards; }
        .api-d1 { animation-delay: 0.2s; }
        .api-d2 { animation-delay: 0.5s; }
        .api-d3 { animation-delay: 0.8s; }
        @keyframes apiSlideRight {
          0% { opacity: 0; transform: translateX(-15px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}
    </style>

    <rect width="500" height="300" rx="10" fill="#090C10" />

    <g style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Roboto Mono', Consolas, monospace", fontSize: '14px' }}>
      <g className="api-rev api-d1">
        <rect x="40" y="50" width="48" height="26" fill="#CBD5E1" rx="4" />
        <text x="64" y="68" fill="#0F172A" fontSize="13" fontWeight="700" textAnchor="middle">GET</text>
        <text x="100" y="68" fill="#F8FAFC">api.github.com/repos/react</text>
        <line x1="40" y1="95" x2="460" y2="95" stroke="#1E293B" strokeWidth="1.5" />
      </g>

      <g className="api-rev api-d2">
        <rect x="40" y="115" width="62" height="26" fill="transparent" stroke="#00E5FF" strokeWidth="1.5" rx="4" />
        <text x="71" y="133" fill="#00E5FF" fontSize="12" fontWeight="700" textAnchor="middle">200 OK</text>
        <text x="115" y="133" fill="#94A3B8">application/json</text>
        <line x1="40" y1="160" x2="460" y2="160" stroke="#1E293B" strokeWidth="1.5" />
      </g>

      <g className="api-rev api-d3">
        <text x="40" y="200" fill="#94A3B8">{'{'}</text>
        <text x="60" y="225" fill="#F8FAFC">"name": <tspan fill="#A78BFA">"react"</tspan></text>
        <text x="40" y="250" fill="#94A3B8">{'}'}</text>
      </g>
    </g>
  </svg>
);

const StageSchema = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300" width="100%" height="100%" role="img" aria-label="Animated DBML diagram preview">
    <style>
      {`
        .db-rev { opacity: 0; animation: dbFadeUp 0.5s ease-out forwards; animation-delay: 0.1s; }
        .db-row { opacity: 0; animation: dbSlideIn 0.4s ease-out forwards; }
        .db-d1 { animation-delay: 0.5s; }
        .db-d2 { animation-delay: 0.7s; }
        .db-d3 { animation-delay: 0.9s; }

        @keyframes dbFadeUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes dbSlideIn {
          0% { opacity: 0; transform: translateX(-10px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}
    </style>

    <rect width="500" height="300" rx="10" fill="#090C10" />

    <g className="db-rev">
      <rect x="50" y="50" width="400" height="200" fill="#0B0F19" stroke="#1E293B" strokeWidth="1" rx="8" />
      <path d="M50 58 A 8 8 0 0 1 58 50 L 442 50 A 8 8 0 0 1 450 58 L 450 90 L 50 90 Z" fill="#3B0764" />
      <text x="70" y="75" fill="#F8FAFC" fontFamily="'Inter', -apple-system, sans-serif" fontWeight="700" fontSize="13" letterSpacing="1.5">USERS</text>

      <g style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Roboto Mono', monospace", fontSize: '14px' }}>
        <g className="db-row db-d1">
          <text x="70" y="130" fill="#F8FAFC">id</text>
          <text x="430" y="130" fill="#94A3B8" textAnchor="end">bigint <tspan fill="#C084FC">PK</tspan></text>
        </g>
        <g className="db-row db-d2">
          <text x="70" y="175" fill="#F8FAFC">email</text>
          <text x="430" y="175" fill="#94A3B8" textAnchor="end">varchar <tspan fill="#38BDF8">UQ</tspan></text>
        </g>
        <g className="db-row db-d3">
          <text x="70" y="220" fill="#F8FAFC">created_at</text>
          <text x="430" y="220" fill="#94A3B8" textAnchor="end">timestamp</text>
        </g>
      </g>
    </g>
  </svg>
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
        {/* auto-rows-fr so the two-column layout's rows are equal height too.
            Without it row 2 sized to its own content and sat 21px taller than
            row 1, which is correct grid behaviour but reads as the same
            mismatched-height problem the rack was built to fix. */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 auto-rows-fr">
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
                  {/* Reserves two lines whether the title needs them or not.
                      "DBML Diagram Builder" wraps at four columns while the
                      others do not, which pushed that bay's whole stack down
                      relative to its neighbours. */}
                  <div className="flex items-baseline gap-2.5 pb-2 xl:min-h-[3.05rem]">
                    <span className="font-mono text-[0.6875rem] text-secondary-text tracking-wider">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="t-dm text-[1.0625rem] text-ink group-hover:text-accent-blue transition-colors">
                      {toolTitle(tool)}
                    </h3>
                  </div>
                  {/* grow, so the slack from four differing description lengths
                      collects ABOVE the stage rather than below it. The stages
                      are the row's visual anchor: bays are equal height, and
                      the stage and link below it are fixed, so growing here is
                      what puts every stage's top edge on the same line. */}
                  <p className="grow text-[0.8125rem] text-secondary-text leading-relaxed pb-5">{toolDescription(tool)}</p>

                  {Stage && (
                    <div className="min-h-[180px] flex items-center justify-center rounded-[3px] bg-bg-pure border border-hairline border-t-[color:var(--hairline-lit)] p-3.5">
                      <Stage />
                    </div>
                  )}

                  <span className="pt-6 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink group-hover:text-accent-blue transition-colors">
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
