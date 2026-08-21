import { useLanguage } from '../i18n/LanguageContext';
import { Reveal } from './ui/Reveal';
import { SectionRule } from './ui/SectionRule';

/**
 * Services — a ledger, not a card grid.
 *
 * Five services on a 3+2 grid always left an awkward shape; the previous fix
 * was a six-column grid with column-start offsets to centre the orphan row.
 * A ledger has no orphan row to fix: each service is one line item, the count
 * can change freely, and the hairlines give the section a rhythm that five
 * rounded rectangles never did.
 *
 * No numbers here on purpose. Services are a set, not a sequence — only the
 * process steps are genuinely ordered, so only they are numbered.
 */
export const Services = () => {
  const { content } = useLanguage();
  const { services, servicesSection } = content;

  return (
    <section id="experience" className="relative py-24 sm:py-28 bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <SectionRule label={servicesSection.label} />
        <Reveal className="pt-6 pb-12">
          <h2 className="t-ds text-ink">
            {servicesSection.title} {servicesSection.titleAccent}
          </h2>
        </Reveal>

        <div className="flex flex-col">
          <div className="h-px hairline" />
          {services.map((service, idx) => (
            <Reveal key={service.title} index={idx}>
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,22rem)_1fr] gap-3 lg:gap-14 py-8">
                <h3 className="t-dm text-[1.25rem] text-ink lg:pt-0.5">{service.title}</h3>
                <div className="flex flex-col gap-5">
                  <p className="text-secondary-text leading-relaxed max-w-[62ch]">{service.description}</p>
                  <ul className="flex flex-wrap gap-x-6 gap-y-2 list-none">
                    {service.highlights.map((h) => (
                      <li key={h} className="t-label text-[0.625rem] text-secondary-text">
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="h-px hairline" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
