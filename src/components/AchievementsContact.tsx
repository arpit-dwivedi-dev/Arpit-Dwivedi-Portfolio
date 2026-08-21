import { Mail, Send, ArrowRight } from 'lucide-react';
import { FaLinkedin } from 'react-icons/fa';
import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import metadata from '../../metadata.json';
import { useLanguage } from '../i18n/LanguageContext';
import { trackEvent } from '../monitoring';
import { Reveal } from './ui/Reveal';
import { SectionRule } from './ui/SectionRule';

// Achievements component deleted 2026-08-12 — its five impact-metric stats
// (99.9% performance, 95% AI automation, etc.) were never measured; confirmed
// invented placeholders with the founder during the content-rewrite project.
// Never commented back in without real, measured numbers. See positioning.md.

/**
 * DevOps & Architecture — kept asymmetric, since it already was.
 *
 * This was the only section on the original page that wasn't a centred
 * heading over a card grid, so the rework refines it rather than replacing
 * it: the checklist becomes a mono ledger, and the diagram is redrawn in the
 * new surface language with violet doing the structural work.
 *
 * The dashed spinning ring behind the diagram is gone. It referenced an
 * `animate-spin-slow` class that was never defined anywhere in the codebase,
 * so it had been rendering as a static dashed circle — decoration that
 * described nothing about the architecture.
 */
export const DevOpsArchitecture = () => {
  const { content } = useLanguage();
  const { devops, architecture } = content;

  return (
    <section className="relative py-24 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <SectionRule label={devops.label} />
        <div className="pt-6 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-start">
          <div>
            <Reveal>
              <h2 className="t-dl text-ink pb-7">
                {devops.title} {devops.titleAccent}
              </h2>
            </Reveal>
            <Reveal index={1}>
              <p className="text-base sm:text-lg text-secondary-text leading-[1.7] max-w-[58ch]">{devops.description}</p>
            </Reveal>
            <Reveal index={2} className="pt-9">
              <ul className="list-none flex flex-col">
                <li className="h-px hairline" aria-hidden="true" />
                {devops.list.map((item) => (
                  <li key={item}>
                    <div className="py-4">
                      <span className="t-label text-secondary-text">{item}</span>
                    </div>
                    <div className="h-px hairline" />
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal from="right" className="surface rounded-[3px] p-6 sm:p-8">
            {/* Architecture diagram: load balancer fans out to app nodes,
                all backed by one database cluster — the shape described in
                the copy on the left, not a generic box drawing. */}
            <div className="flex flex-col items-center gap-0" role="img" aria-label={`${architecture.loadBalancer} to three ${architecture.nodeApp} instances to ${architecture.database}`}>
              <div className="t-label text-[0.625rem] text-accent-blue border border-accent-blue/40 rounded-[3px] px-4 py-2.5 text-center">
                {architecture.loadBalancer}
              </div>
              <div className="w-px h-7 bg-accent-blue/30" aria-hidden="true" />
              <div className="grid grid-cols-3 gap-3 w-full">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex flex-col items-center gap-2 surface-raised rounded-[3px] py-4 px-2">
                    <span className="font-mono text-[0.5625rem] text-secondary-text tracking-wider text-center">
                      {architecture.nodeApp} {n}
                    </span>
                  </div>
                ))}
              </div>
              <div className="w-px h-7 bg-accent-purple/40" aria-hidden="true" />
              <div className="t-label text-[0.625rem] text-accent-purple-text border border-accent-purple/45 rounded-[3px] px-4 py-2.5 text-center">
                {architecture.database}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

// Clients component ("Real Clients, Real Work") deleted 2026-08-12 — it
// presented SA Ethics Biotech (an unpaid demo, never adopted by the client)
// as equal to Rashtriya Swasthya Sangathan (real, paid, delivered work), and
// sat in prominent above-the-fold homepage position — exactly what
// positioning.md's PORTFOLIO rule says to demote. The honest, bucketed
// version of this content now lives on /projects. localTrust data deleted
// with it — nothing else referenced it. See positioning.md.

// Web3Forms access key — safe to expose client-side, it only lets people submit
// mail to the inbox that generated it. Get one free at https://web3forms.com/.
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined;

interface ContactProps {
  /** Cuts the section's own top padding — used on the standalone /contact
   *  page, where the page wrapper already clears the fixed navbar, so the
   *  homepage's full top padding just adds a redundant gap on top of it. */
  compact?: boolean;
  /** Where the visitor arrived from (e.g. a tool id like "invoice-generator"
   *  forwarded via ?source= from a tool page's CTA). Tags both the GA4
   *  submission event and the outbound form payload so leads can be
   *  attributed back to the page that drove them, not just counted as one
   *  undifferentiated "contact" bucket. */
  source?: string;
}

const FIELD_CLASS =
  'w-full bg-ink/[0.03] border border-hairline rounded-[3px] px-3.5 py-3 text-ink placeholder:text-secondary-text focus:border-accent-blue focus:outline-none transition-colors';

export const Contact = ({ compact = false, source }: ContactProps = {}) => {
  const { content } = useLanguage();
  const { contact } = content;
  const [values, setValues] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const leadSource = source ?? (compact ? 'contact_page' : 'homepage');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!values.name.trim()) nextErrors.name = contact.form.errors.nameRequired;
    if (!values.email.trim()) {
      nextErrors.email = contact.form.errors.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = contact.form.errors.emailInvalid;
    }
    if (!values.message.trim()) nextErrors.message = contact.form.errors.messageRequired;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus('idle');
      return;
    }

    const subject = contact.mailSubjectTemplate.replace('{name}', values.name);

    if (!WEB3FORMS_KEY) {
      // No access key configured (e.g. local dev without .env) — fall back to
      // opening the visitor's own mail client rather than silently failing.
      const mailtoSubject = encodeURIComponent(subject);
      const body = encodeURIComponent(`${values.message}\n\nFrom: ${values.name} (${values.email})\nSource: ${leadSource}`);
      window.location.href = `mailto:${contact.email}?subject=${mailtoSubject}&body=${body}`;
      setStatus('sent');
      trackEvent('contact_form_submit', { source: leadSource });
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject,
          name: values.name,
          email: values.email,
          message: values.message,
          source: leadSource,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('sent');
        setValues({ name: '', email: '', message: '' });
        trackEvent('contact_form_submit', { source: leadSource });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="contact" className={`relative ${compact ? 'pt-4 pb-24' : 'py-24 sm:py-28'}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <SectionRule label={contact.label} />
        <div className="pt-6 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20">
          <div>
            <Reveal>
              {/* The accent gradient that used to sit on titleAccent here is
                  gone, along with the flat cyan on the other eight headings —
                  cyan now marks live software and focus only. */}
              <h2 className="t-dl text-ink pb-7 max-w-[20ch]">
                {contact.title} {contact.titleAccent}
              </h2>
            </Reveal>
            <Reveal index={1}>
              <p className="text-base sm:text-lg text-secondary-text leading-[1.7] max-w-[52ch]">{contact.description}</p>
            </Reveal>
            <Reveal index={2} className="pt-10">
              <div className="flex flex-col">
                <div className="h-px hairline" />
                <a href={`mailto:${contact.email}`} className="group flex items-center gap-4 py-5">
                  <Mail size={17} className="text-secondary-text group-hover:text-accent-blue transition-colors shrink-0" aria-hidden="true" />
                  <span className="t-label text-secondary-text w-20 shrink-0">{contact.form.email}</span>
                  <span className="text-sm sm:text-base font-medium text-ink group-hover:text-accent-blue transition-colors truncate">
                    {contact.email}
                  </span>
                </a>
                <div className="h-px hairline" />
                <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" className="group flex items-center gap-4 py-5">
                  <span className="text-secondary-text group-hover:text-accent-blue transition-colors shrink-0 flex" aria-hidden="true">
                    <FaLinkedin size={17} />
                  </span>
                  <span className="t-label text-secondary-text w-20 shrink-0">LinkedIn</span>
                  <span className="text-sm sm:text-base font-medium text-ink group-hover:text-accent-blue transition-colors truncate">
                    {contact.linkedin}
                  </span>
                </a>
                <div className="h-px hairline" />
              </div>
            </Reveal>
          </div>

          <Reveal from="right" className="surface rounded-[3px] p-5 sm:p-7">
            <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-name" className="t-label text-secondary-text">{contact.form.name}</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    aria-required="true"
                    aria-invalid={errors.name ? true : undefined}
                    aria-describedby={errors.name ? 'contact-name-error' : undefined}
                    value={values.name}
                    onChange={(e) => setValues(v => ({ ...v, name: e.target.value }))}
                    className={FIELD_CLASS}
                    placeholder={contact.form.namePlaceholder}
                  />
                  {errors.name && <p id="contact-name-error" role="alert" className="text-red-400 light:text-red-600 text-xs">{errors.name}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-email" className="t-label text-secondary-text">{contact.form.email}</label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    aria-required="true"
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? 'contact-email-error' : undefined}
                    value={values.email}
                    onChange={(e) => setValues(v => ({ ...v, email: e.target.value }))}
                    className={FIELD_CLASS}
                    placeholder={contact.form.emailPlaceholder}
                  />
                  {errors.email && <p id="contact-email-error" role="alert" className="text-red-400 light:text-red-600 text-xs">{errors.email}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="contact-message" className="t-label text-secondary-text">{contact.form.message}</label>
                <textarea
                  id="contact-message"
                  rows={5}
                  required
                  aria-required="true"
                  aria-invalid={errors.message ? true : undefined}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  value={values.message}
                  onChange={(e) => setValues(v => ({ ...v, message: e.target.value }))}
                  className={FIELD_CLASS}
                  placeholder={contact.form.messagePlaceholder}
                />
                {errors.message && <p id="contact-message-error" role="alert" className="text-red-400 light:text-red-600 text-xs">{errors.message}</p>}
              </div>
              <button
                type="submit"
                disabled={status === 'sending'}
                className="group w-full h-13 bg-ink text-bg-pure font-semibold rounded-[3px] flex items-center justify-center gap-2.5 hover:bg-accent-blue transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? contact.form.sending : contact.form.button}
                <Send size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
              </button>
              {status === 'sent' && (
                <p role="status" className="text-accent-blue text-sm text-center">{contact.statusSent}</p>
              )}
              {status === 'error' && (
                <p role="alert" className="text-red-400 light:text-red-600 text-sm text-center">{contact.statusError.replace('{email}', contact.email)}</p>
              )}
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

/**
 * Footer.
 *
 * Same links, organised into labelled columns instead of two dense
 * centre-aligned rows of uppercase mono. The old bottom bar put nine links of
 * identical weight on one line, which is where the floating action buttons
 * used to land on top of them; see App.tsx for the clearance fix.
 */
export const Footer = () => {
  const { content } = useLanguage();
  const { footer } = content;

  // Real, individually-crawlable pages — distinct from the homepage-anchor
  // nav, which only makes sense on "/". Every one of these needs its own URL
  // for Google (and AdSense review) to find independent of the one-page
  // scroll experience.
  const siteLinks = [
    { name: footer.navTools, href: '/tools' },
    { name: footer.navGuides, href: '/guides' },
    { name: footer.navBlog, href: '/blog' },
  ];
  const companyLinks = [
    { name: footer.navAbout, href: '/about' },
    { name: footer.navServices, href: '/services' },
    { name: footer.navContact, href: '/contact' },
  ];
  const legalLinks = [
    { name: footer.navPrivacyPolicy, href: '/privacy-policy' },
    { name: footer.navTerms, href: '/terms' },
    { name: footer.navEditorialPolicy, href: '/editorial-policy' },
  ];

  const columns = [
    { heading: 'Tools', links: siteLinks },
    { heading: 'Company', links: companyLinks },
    { heading: 'Legal', links: legalLinks },
  ];

  return (
    <footer className="border-t border-hairline bg-bg-pure">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-14 pb-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10">
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <div className="t-dm text-[1.0625rem] text-ink">
            {metadata.name}
            <span className="text-accent-blue">.</span>
          </div>
          <p className="text-[0.8125rem] text-secondary-text pt-2 max-w-[30ch]">{footer.techNote}</p>
        </div>

        {columns.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <p className="t-label text-secondary-text pb-4">{col.heading}</p>
            <ul className="list-none flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-secondary-text hover:text-ink transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 pb-10">
        <div className="h-px hairline" />
        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="font-mono text-[0.6875rem] text-secondary-text">
            © {new Date().getFullYear()} {metadata.name}. {footer.rights}
          </p>
          <Link
            to="/#contact"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-accent-blue transition-colors"
          >
            {footer.navContact}
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </footer>
  );
};
