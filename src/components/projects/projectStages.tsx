import type { ComponentType } from 'react';

/**
 * The stage fragments — one per project, keyed by `project.stage` in STAGES.
 *
 * These are the projects-page counterpart to components/tools/toolStages.tsx,
 * and they answer a different question. A tool's stage shows the tool's real
 * output, because the claim that page makes is "this runs". A project's stage
 * cannot do that: the artefact is somebody else's live website, and a
 * screenshot of it would go stale the first time the client edits a page.
 *
 * So these are STRUCTURAL abstractions — what was built, in wireframe — and
 * they carry no numbers at all. That is deliberate rather than lazy: the
 * registry has no metrics for either project, and a stage panel is exactly the
 * place a plausible-looking invented statistic would end up.
 *
 * Unlike the tool stages these are drawn in theme tokens rather than hardcoded
 * slate, so they re-tone in light mode along with the panel behind them.
 *
 * Each is a 500x300 viewBox at 100%/100%, matching the tool stages, so both
 * kinds of fragment drop into the same 16.25rem stage column.
 */

/**
 * Rashtriya Swasthya Sangathan — the donation and outreach flow: two cause
 * rows above the give/join actions. Cyan on the primary action because the
 * site is live; violet on the second cause row for the same reason the build
 * note is violet.
 */
export const StageDonation = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 500 300"
    width="100%"
    height="100%"
    role="img"
    aria-label="Wireframe of the donation flow: two cause entries above a donate and a join action"
  >
    <style>
      {`
        .pd-rev { opacity: 0; animation: pdUpFade 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) forwards; }
        .pd-d1 { animation-delay: 0.12s; }
        .pd-d2 { animation-delay: 0.24s; }
        .pd-d3 { animation-delay: 0.36s; }
        @media (prefers-reduced-motion: reduce) {
          .pd-rev { opacity: 1; animation: none; }
        }
        @keyframes pdUpFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}
    </style>

    {/* Two cause rows */}
    <g className="pd-rev pd-d1">
      <rect x="20" y="30" width="460" height="72" rx="4" fill="none" stroke="var(--hairline)" />
      <rect x="36" y="48" width="7" height="36" rx="2" fill="var(--color-accent-blue)" />
      <rect x="58" y="52" width="290" height="9" rx="2" fill="var(--color-ink)" opacity="0.22" />
      <rect x="58" y="71" width="176" height="7" rx="2" fill="var(--color-ink)" opacity="0.1" />
    </g>

    <g className="pd-rev pd-d2">
      <rect x="20" y="116" width="460" height="72" rx="4" fill="none" stroke="var(--hairline)" />
      <rect x="36" y="134" width="7" height="36" rx="2" fill="var(--color-accent-purple-text)" opacity="0.6" />
      <rect x="58" y="138" width="238" height="9" rx="2" fill="var(--color-ink)" opacity="0.22" />
      <rect x="58" y="157" width="142" height="7" rx="2" fill="var(--color-ink)" opacity="0.1" />
    </g>

    {/* The two actions the page exists for */}
    <g className="pd-rev pd-d3">
      <rect x="20" y="212" width="330" height="52" rx="4" fill="var(--color-accent-blue)" />
      <text
        x="185"
        y="244"
        textAnchor="middle"
        fill="var(--color-bg-pure)"
        fontFamily="var(--font-mono)"
        fontSize="19"
        fontWeight="500"
        letterSpacing="2.4"
      >
        DONATE
      </text>
      <rect x="366" y="212" width="114" height="52" rx="4" fill="none" stroke="var(--hairline)" />
      <text
        x="423"
        y="244"
        textAnchor="middle"
        fill="var(--color-secondary-text)"
        fontFamily="var(--font-mono)"
        fontSize="19"
        fontWeight="500"
        letterSpacing="2.4"
      >
        JOIN
      </text>
    </g>
  </svg>
);

/**
 * SA Ethics Biotech — a certification grid over a copy block, the shape of the
 * corporate site that was drafted. Deliberately monochrome: no cyan anywhere,
 * because nothing here is running, and no animation, because this one is not
 * demonstrating that anything works.
 */
export const StageConcept = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 500 300"
    width="100%"
    height="100%"
    role="img"
    aria-label="Wireframe of the unadopted concept layout: a four-panel product grid above a copy block"
  >
    <g>
      <rect x="20" y="26" width="222" height="86" rx="4" fill="none" stroke="var(--hairline)" />
      <rect x="258" y="26" width="222" height="86" rx="4" fill="none" stroke="var(--hairline)" />
      <rect x="20" y="126" width="222" height="86" rx="4" fill="none" stroke="var(--hairline)" />
      <rect x="258" y="126" width="222" height="86" rx="4" fill="none" stroke="var(--hairline)" />
    </g>
    <g>
      <rect x="20" y="240" width="384" height="8" rx="2" fill="var(--color-ink)" opacity="0.13" />
      <rect x="20" y="262" width="262" height="8" rx="2" fill="var(--color-ink)" opacity="0.09" />
    </g>
  </svg>
);

/** Stage fragments keyed by `project.stage` — no entry renders no panel. */
export const PROJECT_STAGES: Record<string, ComponentType> = {
  donation: StageDonation,
  concept: StageConcept,
};
