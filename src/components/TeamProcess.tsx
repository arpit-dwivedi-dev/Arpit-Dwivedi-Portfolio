import { useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { FaLinkedin } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Reveal } from './ui/Reveal';
import { SectionRule } from './ui/SectionRule';

/**
 * Founder — the site's trust instrument.
 *
 * On a one-person shop the person IS the product, and this was previously the
 * quietest thing on the page: a small centred card with a 20px avatar, set in
 * a narrower container than every section around it.
 *
 * It now gets the most space of any section, but presence comes from the type
 * scale and the whitespace rather than from a full-bleed slab or an oversized
 * portrait — at this size a hero treatment of one person reads as a
 * personality cult, which cuts against the trust it is supposed to build.
 *
 * The honesty note about paid versus concept work moved in here from a
 * free-floating strip further down the homepage. It is the single most
 * credibility-building sentence on the site, and it was styled as a
 * disclaimer footnote; as a peer element inside the founder block it reads as
 * the person telling you what is and isn't real.
 *
 * "Meet the founder" stays the h2 so heading order is unchanged; the name is
 * an h3 that simply outweighs it visually.
 */
export const Team = () => {
  const { content } = useLanguage();
  const { team, contact, homeProjectsNote } = content;
  const { founder } = team;
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <section className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-12 lg:gap-20">
          <div className="flex flex-col">
            <Reveal>
              <h2 className="t-dm text-[1.25rem] text-secondary-text pb-6">
                {team.title} {team.titleAccent}
              </h2>
            </Reveal>
            <Reveal index={1}>
              <h3 className="t-dl text-ink pb-3.5">{founder.name}</h3>
              <p className="t-label text-secondary-text pb-8">{founder.role}</p>
            </Reveal>
            <Reveal index={2}>
              <p className="text-lg sm:text-xl text-ink leading-[1.62] max-w-[50ch]">{founder.bio}</p>
            </Reveal>
            <Reveal index={3} className="mt-auto pt-10">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 h-11 text-sm font-semibold text-ink border-b border-hairline hover:border-accent-blue hover:text-accent-blue transition-colors"
                >
                  <FaLinkedin size={15} aria-hidden="true" /> LinkedIn
                </a>
                <Link
                  to="/projects"
                  className="inline-flex items-center gap-2.5 h-11 text-sm font-semibold text-ink border-b border-hairline hover:border-accent-blue hover:text-accent-blue transition-colors"
                >
                  {team.founderWorkLinkLabel}
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal index={2} from="right" className="flex flex-col">
            {/* Falls back to the initials tile if /founder.jpg 404s — never
                leaves a broken image in the most trust-sensitive spot. */}
            {photoFailed ? (
              <div className="w-[136px] h-[136px] sm:w-[152px] sm:h-[152px] surface rounded-[3px] flex items-center justify-center shrink-0">
                <span className="t-dl text-[3.25rem] text-ink">{founder.initials}</span>
              </div>
            ) : (
              <img
                src="/founder.jpg"
                alt={founder.name}
                width={152}
                height={152}
                onError={() => setPhotoFailed(true)}
                className="w-[136px] h-[136px] sm:w-[152px] sm:h-[152px] rounded-[3px] object-cover shrink-0 border border-hairline"
              />
            )}

            <ul className="list-none pt-9 flex flex-col">
              <li className="h-px hairline" aria-hidden="true" />
              {founder.highlights.map((h, idx) => (
                <li key={h}>
                  <div className="flex items-center gap-4 py-4">
                    <span className="font-mono text-[0.625rem] text-secondary-text tracking-wider">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm text-ink">{h}</span>
                  </div>
                  <div className="h-px hairline" />
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal className="pt-14 sm:pt-16">
          <div className="flex gap-5 max-w-[80ch]">
            {/* Violet is structural-only across the site; a 2px rule is
                exactly the kind of work it is allowed to do. */}
            <span className="w-0.5 shrink-0 bg-accent-purple/55" aria-hidden="true" />
            <div>
              <p className="t-label text-[0.625rem] text-accent-purple-text pb-2.5">On what&rsquo;s real</p>
              <p className="text-base text-secondary-text leading-relaxed">
                {homeProjectsNote.text}{' '}
                <Link
                  to="/projects"
                  className="text-ink font-medium border-b border-accent-blue/40 hover:border-accent-blue hover:text-accent-blue transition-colors inline-flex items-center gap-1"
                >
                  {homeProjectsNote.linkLabel}
                  <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

/**
 * Process — the one section where numbers are earned.
 *
 * 01 through 04 is a real sequence: discovery precedes proposal precedes
 * build precedes launch. Numbering appears nowhere else on the page for
 * exactly that reason.
 */
export const Process = () => {
  const { content } = useLanguage();
  const { process } = content;

  return (
    <section className="relative py-24 sm:py-28 bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <SectionRule label={process.label} />
        <Reveal className="pt-6 pb-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 lg:gap-16">
          <h2 className="t-ds text-ink">
            {process.title} {process.titleAccent}
          </h2>
          <p className="text-secondary-text leading-relaxed max-w-[42ch] lg:pb-1.5">{process.description}</p>
        </Reveal>

        <div className="flex flex-col">
          <div className="h-px hairline" />
          {process.steps.map((step, idx) => (
            <Reveal key={step.title} index={idx}>
              <div className="grid grid-cols-[auto_1fr] lg:grid-cols-[auto_minmax(0,18rem)_1fr] gap-x-6 gap-y-2 lg:gap-x-12 py-7">
                <span className="t-dm text-[1.5rem] text-secondary-text tabular-nums lg:pt-0.5">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <h3 className="t-dm text-[1.125rem] text-ink self-baseline lg:pt-1">{step.title}</h3>
                <p className="col-start-2 lg:col-start-3 text-secondary-text leading-relaxed max-w-[58ch]">
                  {step.description}
                </p>
              </div>
              <div className="h-px hairline" />
            </Reveal>
          ))}
        </div>

        <Reveal className="pt-12">
          <a
            href="#contact"
            className="group inline-flex items-center justify-center gap-2.5 h-13 px-7 bg-ink text-bg-pure font-semibold rounded-[3px] hover:bg-accent-blue transition-colors"
          >
            {process.cta}
            <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </a>
        </Reveal>
      </div>
    </section>
  );
};
