import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Plus, Minus } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { Reveal } from './ui/Reveal';
import { SectionRule } from './ui/SectionRule';

/**
 * Why Choose Us — a tight, dense band.
 *
 * Deliberately the most compressed section on the page. It sits between two
 * spacious ones (the services ledger above, the founder block below), and
 * that contrast is the whole job: four short claims, four columns, vertical
 * hairlines, no cards and no icons. Density is the variation here, which is
 * why it carries no top rule of its own — the band edge is its framing.
 */
export const WhyChooseUs = () => {
  const { content } = useLanguage();
  const { whyChooseUs } = content;

  return (
    <section className="relative pt-24 sm:pt-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 pb-10">
        <Reveal>
          <h2 className="t-ds text-ink max-w-[26ch]">
            {whyChooseUs.title} {whyChooseUs.titleAccent}
          </h2>
        </Reveal>
      </div>

      <Reveal from="none" className="surface border-x-0 rounded-none">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {whyChooseUs.reasons.map((reason, idx) => (
            <Reveal
              key={reason.title}
              index={idx}
              className={[
                'border-hairline py-8 sm:py-10',
                idx > 0 ? 'border-t' : '',
                'sm:border-t-0',
                idx % 2 === 1 ? 'sm:border-l sm:pl-6' : '',
                idx >= 2 ? 'sm:border-t' : '',
                'lg:border-t-0',
                idx > 0 ? 'lg:border-l lg:pl-6' : 'lg:border-l-0 lg:pl-0',
                idx < 3 ? 'lg:pr-6' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <h3 className="t-dm text-[1.0625rem] text-ink pb-3">{reason.title}</h3>
              <p className="text-sm text-secondary-text leading-relaxed">{reason.description}</p>
            </Reveal>
          ))}
        </div>
      </Reveal>
    </section>
  );
};

// Industries component deleted 2026-08-12 — 3 of its 4 categories rested on
// zero real evidence: "Enterprise HR & Operations" was a disguised reference
// to the off-site-only HRMS design work, "Manufacturing & Equipment" was
// built entirely on the unpaid SA Ethics Biotech demo, and "Local Businesses
// & Hospitality" had no supporting project at all. Only "Nonprofits & NGOs"
// (Rashtriya Swasthya Sangathan) is real — too thin on its own to justify an
// "Industries We Serve" grid. See positioning.md's industry-vertical note.

// Testimonials component deleted 2026-08-12 — it rendered quotes that were
// never actually said or sent by either named client (confirmed with the
// founder during the content-rewrite project). Never commented back in
// without real, verifiable quotes. See positioning.md.

/**
 * FAQ — a ledger accordion.
 *
 * Each question used to be its own rounded glass card, which meant five
 * stacked containers doing the work one set of hairlines does better. Rows on
 * rules read as a list of questions; cards read as five unrelated widgets.
 */
export const FAQ = () => {
  const { content } = useLanguage();
  const { faq } = content;
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <section id="faq" className="relative py-24 sm:py-28">
      <div className="max-w-3xl mx-auto px-5 sm:px-6">
        <SectionRule label={faq.label} />
        <Reveal className="pt-6 pb-10">
          <h2 className="t-ds text-ink">
            {faq.title} {faq.titleAccent}
          </h2>
        </Reveal>

        <div className="flex flex-col">
          <div className="h-px hairline" />
          {faq.items.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={item.question}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                    className="group w-full flex items-center justify-between gap-5 py-5 text-left"
                  >
                    <span className={`text-base font-medium transition-colors ${isOpen ? 'text-ink' : 'text-secondary-text group-hover:text-ink'}`}>
                      {item.question}
                    </span>
                    <span className="shrink-0 text-secondary-text group-hover:text-accent-blue transition-colors">
                      {isOpen ? <Minus size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
                    </span>
                  </button>
                </h3>
                {/* Height is animated here rather than transformed because a
                    collapsing panel has to actually stop occupying space; it
                    is a click-driven, one-off change on a small element, not
                    something running during scroll. Reduced motion skips
                    straight to the final state. */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${idx}`}
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={reduce ? { height: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 0.61, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-secondary-text leading-relaxed pb-6 max-w-[62ch]">{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="h-px hairline" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
