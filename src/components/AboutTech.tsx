import { useLanguage } from '../i18n/LanguageContext';
import { Reveal } from './ui/Reveal';

/**
 * About — the page's one purely editorial section.
 *
 * No top rule, no eyebrow, no container: it opens straight onto type at a
 * reading measure, which is the point. Four of the eleven sections keep a
 * labelled rule and two open bare like this one; applying the same framing
 * everywhere is what made the original page read as one shape repeated.
 *
 * The right-hand summary card is gone, but none of its content is: EST. 2026,
 * the two expertise lines and the service area now sit in a compact mono
 * ledger under the prose, where they read as facts rather than as a graphic
 * standing in for facts. about.label is unused by design.
 */
export const About = () => {
  const { content } = useLanguage();
  const { about } = content;

  return (
    <section id="about" className="relative py-24 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 relative">
        {/* Fills the gutter max-w-3xl leaves open beside it on wide screens —
            a plain wireframe/nodes graphic with no fill behind it, so it has
            no hard edge to blend against the section. Only shows once that
            gutter is wide enough to hold it without crowding the text
            (max-w-7xl caps at 1280px, so the gap beyond the copy never grows
            past ~464px — sizing tighter than that keeps a comfortable gap). */}
        <img
          src="/purpose-illustration.svg"
          alt=""
          style={{'margin-right': '-10%' , width: '70%'}}
          className="hidden xl:block absolute top-1/2 -translate-y-1/2 right-0 z-0 w-[420px] opacity-90 pointer-events-none select-none"
        />

        <div className="relative z-10 max-w-3xl">
          <Reveal>
            <h2 className="t-ds text-ink pb-9 max-w-[26ch]">
              {about.title} {about.titleAccent}
            </h2>
          </Reveal>

          <div className="flex flex-col gap-6">
            {about.paragraphs.map((p, idx) => (
              <Reveal key={p} index={idx}>
                <p
                  className="text-base sm:text-lg text-secondary-text leading-[1.7] max-w-[62ch]"
                  // Bold runs in the source copy mark the closing thesis line.
                  dangerouslySetInnerHTML={{
                    __html: p.replaceAll(/\*\*(.+?)\*\*/g, (_m, phrase) => `<span class="text-ink font-medium">${phrase}</span>`),
                  }}
                />
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="relative z-10 pt-14 max-w-3xl">
          <dl className="flex flex-col">
            <div className="h-px hairline" />
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4">
              <dt className="t-label text-secondary-text w-32 shrink-0">Founded</dt>
              <dd className="text-sm text-ink">{about.card.est.replace('EST. ', '')}</dd>
            </div>
            {about.card.expertise.map((item) => (
              <div key={item.title}>
                <div className="h-px hairline" />
                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4">
                  <dt className="t-label text-secondary-text w-32 shrink-0">{item.title}</dt>
                  <dd className="text-sm text-secondary-text">{item.subtitle}</dd>
                </div>
              </div>
            ))}
            <div className="h-px hairline" />
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4">
              <dt className="t-label text-secondary-text w-32 shrink-0">{about.card.locationLabel}</dt>
              <dd className="text-sm text-ink">{about.card.location}</dd>
            </div>
            <div className="h-px hairline" />
          </dl>
        </Reveal>

        <Reveal className="relative z-10 pt-10">
          <ul className="flex flex-wrap gap-x-8 gap-y-3 list-none">
            {about.features.map((feature) => (
              <li key={feature} className="t-label text-secondary-text">
                {feature}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
};
