import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

interface SectionRuleProps {
  /** The section's existing eyebrow string. */
  label: string;
  /** Optional right-hand status, e.g. the tools section's live indicator. */
  trailing?: ReactNode;
}

/**
 * A labelled boundary at the top of a section.
 *
 * This replaces the centered eyebrow pill that used to sit above every
 * heading. Nine sections carried the identical treatment — same mono label,
 * same tracking, same centered stack — which is why it had stopped reading as
 * emphasis and started reading as a tic.
 *
 * The label is the same string as before; what changed is that it now marks a
 * real edge instead of floating above a centered heading, which also fixes
 * the separate problem of sections dissolving into each other for want of any
 * visible boundary.
 *
 * Deliberately NOT used on every section — the editorial ones (About,
 * Founder) open straight onto type, and the full-bleed ones (Hero, the tool
 * rack) carry their own framing. Applying it everywhere would just be a new
 * uniform.
 */
export const SectionRule = ({ label, trailing }: SectionRuleProps) => (
  <Reveal from="none" className="flex items-center gap-5">
    <span className="t-label text-secondary-text whitespace-nowrap">{label}</span>
    <span className="grow h-px hairline" aria-hidden="true" />
    {trailing}
  </Reveal>
);
