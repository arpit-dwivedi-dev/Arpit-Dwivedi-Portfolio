import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Reveal } from './ui/Reveal';
import { SectionRule } from './ui/SectionRule';

/**
 * What we do now, and what's next.
 *
 * Sits directly after the hero, before the tools: the positioning has to land
 * before the proof does, otherwise a visitor reads four free tools and
 * concludes we're a tools site.
 *
 * The two panels carry equal visual weight on purpose — same width, same
 * heading step, same measure — because they're a pair, not a promotion and a
 * teaser. All of the difference lives in the status indicator and in what
 * each panel is allowed to say. Active is filled, cyan and haloed; Coming
 * Soon is a hollow ring in muted grey with nothing to click. Two identical
 * pills in two colors would have made "coming soon" look like a feature.
 *
 * The Products copy is deliberately two sentences and stops. No product name,
 * no category hint, no date, no waitlist, no email capture — there is nothing
 * true to say yet, and saying more would be the one thing on this page a
 * visitor could later find out was invented.
 */
export const NowNext = () => {
  const { content } = useLanguage();
  const { nowNext } = content;

  return (
    <section id="next" className="relative pt-20 pb-0 sm:pt-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <SectionRule label={nowNext.label} />
        <Reveal className="pt-6 pb-10">
          <h2 className="t-dl text-ink max-w-[24ch]">{nowNext.title}</h2>
        </Reveal>
      </div>

      {/* Full-bleed band: the two panels read as halves of one slab rather
          than as two cards floating on the page. */}
      <Reveal from="none" className="surface border-x-0 rounded-none">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_1px_1fr]">
          <article className="flex flex-col px-5 sm:px-6 py-9 md:py-11 md:pr-12">
            <p className="t-label flex items-center gap-2.5 text-accent-blue mb-5">
              <span
                aria-hidden="true"
                className="w-2 h-2 rounded-full bg-accent-blue shadow-[0_0_10px_2px_color-mix(in_srgb,var(--color-accent-blue)_70%,transparent)]"
              />
              {nowNext.active.status}
            </p>
            <h3 className="t-ds text-ink mb-4">{nowNext.active.title}</h3>
            <p className="text-secondary-text leading-relaxed max-w-[42ch]">{nowNext.active.description}</p>
            <div className="mt-7 md:mt-auto md:pt-9">
              <Link
                to="/#experience"
                className="inline-flex items-center gap-2 h-11 text-sm font-semibold text-ink border-b border-accent-blue/40 hover:border-accent-blue hover:text-accent-blue transition-colors"
              >
                {nowNext.active.linkLabel}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </article>

          <div className="hairline h-px md:h-auto md:w-px mx-5 md:mx-0 sm:mx-6" aria-hidden="true" />

          <article className="flex flex-col px-5 sm:px-6 py-9 md:py-11 md:pl-12">
            <p className="t-label flex items-center gap-2.5 text-secondary-text mb-5">
              {/* Hollow, unfilled, unlit — the visual opposite of the dot
                  above rather than the same shape in another color. */}
              <span aria-hidden="true" className="w-2 h-2 rounded-full border border-secondary-text/70" />
              {nowNext.next.status}
            </p>
            <h3 className="t-ds text-ink mb-4">{nowNext.next.title}</h3>
            <p className="text-secondary-text leading-relaxed max-w-[42ch]">{nowNext.next.description}</p>
            <div className="mt-7 md:mt-auto md:pt-9 flex items-center gap-3 h-11">
              <span aria-hidden="true" className="w-6 h-px bg-accent-purple-text/45" />
              <span className="t-label text-[0.5625rem] text-secondary-text">{nowNext.next.progressLabel}</span>
            </div>
          </article>
        </div>
      </Reveal>
    </section>
  );
};
