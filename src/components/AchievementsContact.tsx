import { motion } from 'motion/react';
import { Zap, Server, Mail, Send, Phone, MapPin, ExternalLink } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import metadata from '../../metadata.json';
import { useLanguage } from '../i18n/LanguageContext';
import { AdSlot } from './ads/AdSlot';

export const Achievements = () => {
  const { content } = useLanguage();
  const { impactMetrics, achievementsSection } = content;

  return (
    <section className="py-24 relative overflow-hidden bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{achievementsSection.label}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{achievementsSection.title} <span className="text-gradient">{achievementsSection.titleAccent}</span></h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {impactMetrics.map((metric, idx) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-3xl glass border-ink/5 hover:border-accent-blue/20 transition-all text-center group"
            >
              <div className="text-4xl font-extrabold text-ink mb-2 group-hover:text-accent-blue transition-colors tracking-tighter">
                {metric.value}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-secondary-text font-mono">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const DevOpsArchitecture = () => {
  const { content } = useLanguage();
  const { devops, architecture } = content;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <span className="text-accent-purple-text font-mono text-sm tracking-widest uppercase mb-2 block">{devops.label}</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-8">{devops.title} <span className="text-gradient">{devops.titleAccent}</span></h2>
            
            <div className="space-y-6 text-base md:text-lg text-secondary-text leading-relaxed">
              <p>
                {devops.description}
              </p>
              <ul className="space-y-4">
                {devops.list.map((item, idx) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full bg-accent-${idx % 2 === 0 ? 'blue' : 'purple'}/10 flex items-center justify-center text-accent-${idx % 2 === 0 ? 'blue' : 'purple'}`}>
                      <Zap size={14} aria-hidden="true" />
                    </div>
                    <span className="text-sm font-medium text-ink">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative p-8 rounded-3xl glass border-ink/10 glow-blue/10 overflow-hidden"
          >
            {/* Architecture Diagram Mockup */}
            <div className="relative z-10 grid grid-cols-3 gap-4">
              <div className="col-span-3 flex justify-center mb-8">
                <div className="px-6 py-3 rounded-xl glass border-accent-blue text-accent-blue font-bold text-sm glow-blue">
                  {architecture.loadBalancer}
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <div className="w-full p-4 rounded-xl glass border-ink/10 flex flex-col items-center gap-2">
                  <Server size={24} className="text-ink" aria-hidden="true" />
                  <span className="text-[10px] font-mono text-secondary-text">{architecture.nodeApp} 1</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="w-full p-4 rounded-xl glass border-ink/10 flex flex-col items-center gap-2">
                  <Server size={24} className="text-ink" aria-hidden="true" />
                  <span className="text-[10px] font-mono text-secondary-text">{architecture.nodeApp} 2</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="w-full p-4 rounded-xl glass border-ink/10 flex flex-col items-center gap-2">
                  <Server size={24} className="text-ink" aria-hidden="true" />
                  <span className="text-[10px] font-mono text-secondary-text">{architecture.nodeApp} 3</span>
                </div>
              </div>

              <div className="col-span-3 flex justify-center mt-8">
                <div className="px-6 py-3 rounded-xl glass border-accent-purple text-accent-purple font-bold text-sm glow-purple">
                  {architecture.database}
                </div>
              </div>
            </div>
            
            {/* Connecting Lines (Abstract) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
              <div className="w-full h-full border-2 border-dashed border-ink/10 rounded-full animate-spin-slow" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export const Clients = () => {
  const { content } = useLanguage();
  const { localTrust } = content;

  return (
    <section className="py-24 relative overflow-hidden bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{localTrust.label}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">{localTrust.title} <span className="text-gradient">{localTrust.titleAccent}</span></h2>
          <p className="text-secondary-text max-w-xl mx-auto">{localTrust.description}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <a href={`tel:+${localTrust.phone.replace(/\D/g, '')}`} className="p-6 rounded-2xl glass border-ink/5 flex items-center gap-4 group hover:border-accent-blue/20 transition-all">
            <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue">
              <Phone size={20} aria-hidden="true" />
            </div>
            <div>
              <div className="text-xs font-mono text-secondary-text uppercase tracking-widest">{localTrust.callLabel}</div>
              <div className="text-lg font-bold text-ink group-hover:text-accent-blue transition-colors">{localTrust.phone}</div>
            </div>
          </a>
          <div className="p-6 rounded-2xl glass border-ink/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center text-accent-purple">
              <MapPin size={20} aria-hidden="true" />
            </div>
            <div>
              <div className="text-xs font-mono text-secondary-text uppercase tracking-widest">{localTrust.serviceAreaLabel}</div>
              <div className="text-lg font-bold text-ink">{localTrust.serviceArea}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {localTrust.clients.map((client) => (
            <a
              key={client.name}
              href={client.url}
              target="_blank"
              rel="noreferrer"
              className="p-6 rounded-2xl glass border-ink/5 hover:border-accent-blue/20 transition-all group flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-bold text-ink group-hover:text-accent-blue transition-colors">{client.name}</div>
                <ExternalLink size={16} className="text-secondary-text shrink-0 group-hover:text-accent-blue transition-colors" aria-hidden="true" />
              </div>
              <p className="text-secondary-text text-sm leading-relaxed">{client.description}</p>
              <span className="text-[10px] font-mono text-accent-blue uppercase tracking-widest mt-auto">{localTrust.visitSite}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

// Web3Forms access key — safe to expose client-side, it only lets people submit
// mail to the inbox that generated it. Get one free at https://web3forms.com/.
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined;

interface ContactProps {
  /** Cuts the section's own top padding — used on the standalone /contact
   *  page, where the page wrapper already clears the fixed navbar, so the
   *  homepage's full py-24 top padding just adds a redundant gap on top of it. */
  compact?: boolean;
}

export const Contact = ({ compact = false }: ContactProps = {}) => {
  const { content } = useLanguage();
  const { contact } = content;
  const [values, setValues] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

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
      const body = encodeURIComponent(`${values.message}\n\nFrom: ${values.name} (${values.email})`);
      window.location.href = `mailto:${contact.email}?subject=${mailtoSubject}&body=${body}`;
      setStatus('sent');
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
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('sent');
        setValues({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="contact" className={`${compact ? 'pt-4 pb-24' : 'py-24'} relative overflow-hidden`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center lg:text-left"
          >
            <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{contact.label}</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-8">{contact.title} <span className="text-gradient">{contact.titleAccent}</span></h2>
            
            <p className="text-base md:text-lg text-secondary-text mb-12 leading-relaxed">
              {contact.description}
            </p>

            {/* PLACEHOLDER: contact.github below resolves to a placeholder URL (101techlabs) — confirm real profile exists before launch */}
            {/* items-start (not center): each link's width is just its own icon+text
                content, which varies (email address vs. "101 Tech Labs" vs.
                "101techlabs") — centering them independently put every row's icon at
                a different x-position instead of a straight left-aligned column. */}
            <div className="space-y-6 flex flex-col items-start">
              <a href={`mailto:${contact.email}`} className="flex items-center gap-4 group w-full max-w-sm lg:max-w-none">
                <div className="w-12 h-12 rounded-xl bg-ink/5 flex items-center justify-center text-ink group-hover:bg-accent-blue group-hover:text-bg-pure transition-all">
                  <Mail size={20} aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs font-mono text-secondary-text uppercase tracking-widest">{contact.form.email}</div>
                  <div className="text-lg font-bold text-ink group-hover:text-accent-blue transition-colors">{contact.email}</div>
                </div>
              </a>
              <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-ink/5 flex items-center justify-center text-ink group-hover:bg-accent-blue group-hover:text-bg-pure transition-all">
                  <FaLinkedin size={20} />
                </div>
                <div>
                  <div className="text-xs font-mono text-secondary-text uppercase tracking-widest">LinkedIn</div>
                  <div className="text-lg font-bold text-ink group-hover:text-accent-blue transition-colors">{contact.linkedin}</div>
                </div>
              </a>
              <a href={`https://github.com/${contact.github}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-ink/5 flex items-center justify-center text-ink group-hover:bg-accent-blue group-hover:text-bg-pure transition-all">
                  <FaGithub size={20} />
                </div>
                <div>
                  <div className="text-xs font-mono text-secondary-text uppercase tracking-widest">GitHub</div>
                  <div className="text-lg font-bold text-ink group-hover:text-accent-blue transition-colors">{contact.github}</div>
                </div>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-3xl glass border-ink/10 glow-blue/5"
          >
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="contact-name" className="text-xs font-mono text-secondary-text uppercase tracking-widest">{contact.form.name}</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    aria-required="true"
                    aria-invalid={errors.name ? true : undefined}
                    aria-describedby={errors.name ? 'contact-name-error' : undefined}
                    value={values.name}
                    onChange={(e) => setValues(v => ({ ...v, name: e.target.value }))}
                    className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-ink focus:border-accent-blue focus:outline-none transition-colors"
                    placeholder={contact.form.namePlaceholder}
                  />
                  {errors.name && <p id="contact-name-error" role="alert" className="text-red-400 light:text-red-600 text-xs">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="contact-email" className="text-xs font-mono text-secondary-text uppercase tracking-widest">{contact.form.email}</label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    aria-required="true"
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? 'contact-email-error' : undefined}
                    value={values.email}
                    onChange={(e) => setValues(v => ({ ...v, email: e.target.value }))}
                    className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-ink focus:border-accent-blue focus:outline-none transition-colors"
                    placeholder={contact.form.emailPlaceholder}
                  />
                  {errors.email && <p id="contact-email-error" role="alert" className="text-red-400 light:text-red-600 text-xs">{errors.email}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="contact-message" className="text-xs font-mono text-secondary-text uppercase tracking-widest">{contact.form.message}</label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  aria-required="true"
                  aria-invalid={errors.message ? true : undefined}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  value={values.message}
                  onChange={(e) => setValues(v => ({ ...v, message: e.target.value }))}
                  className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-ink focus:border-accent-blue focus:outline-none transition-colors"
                  placeholder={contact.form.messagePlaceholder}
                />
                {errors.message && <p id="contact-message-error" role="alert" className="text-red-400 light:text-red-600 text-xs">{errors.message}</p>}
              </div>
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-4 bg-accent-blue text-bg-pure font-bold rounded-xl flex items-center justify-center gap-2 hover:glow-blue transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? contact.form.sending : contact.form.button}
                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" aria-hidden="true" />
              </button>
              {status === 'sent' && (
                <p role="status" className="text-accent-blue text-sm text-center">{contact.statusSent}</p>
              )}
              {status === 'error' && (
                <p role="alert" className="text-red-400 light:text-red-600 text-sm text-center">{contact.statusError.replace('{email}', contact.email)}</p>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export const Footer = () => {
  const { lang, content } = useLanguage();
  const { navLinks, footer } = content;
  const homeHref = lang === 'hi' ? '/hi' : '/';
  const withLang = (path: string) => (lang === 'hi' ? `/hi${path}` : path);

  // Real, individually-crawlable pages — distinct from the homepage-anchor
  // nav above, which only makes sense on "/". Every one of these needs its
  // own URL for Google (and AdSense review) to find independent of the
  // one-page scroll experience.
  const siteLinks = [
    { name: 'Tools', href: withLang('/tools') },
    { name: 'About', href: withLang('/about') },
    { name: 'Services', href: withLang('/services') },
    { name: 'Contact', href: withLang('/contact') },
  ];
  const legalLinks = [
    { name: 'Privacy Policy', href: withLang('/privacy-policy') },
    { name: 'Terms', href: withLang('/terms') },
    { name: 'Editorial Policy', href: withLang('/editorial-policy') },
  ];

  return (
    <footer className="pt-12 pb-24 border-t border-ink/5 bg-bg-pure">
      <div className="max-w-7xl mx-auto px-6">
        <AdSlot slot={import.meta.env.VITE_ADSENSE_SLOT_FOOTER} className="mb-12" />
      </div>
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
        <div>
          <div className="text-xl font-bold tracking-tighter">
            {metadata.name}<span className="text-accent-blue">.</span>
          </div>
          <div className="text-[10px] font-mono text-secondary-text mt-1">{footer.techNote}</div>
        </div>
        <div className="text-secondary-text text-sm font-mono">
          © {new Date().getFullYear()} {metadata.name}. {footer.rights}
        </div>
        <nav aria-label="Footer" className="flex flex-wrap justify-center items-center gap-6">
          {navLinks.slice(0, 3).map(link => (
            <a key={link.name} href={link.href.startsWith('#') ? `${homeHref}${link.href}` : link.href} className="py-3 -my-3 text-secondary-text hover:text-ink transition-colors text-sm">{link.name}</a>
          ))}
        </nav>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-ink/5 flex flex-col md:flex-row justify-center items-center gap-x-8 gap-y-3">
        <nav aria-label="Site pages" className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
          {siteLinks.map((link) => (
            <Link key={link.name} to={link.href} className="py-3 -my-3 text-secondary-text hover:text-ink transition-colors text-xs font-mono uppercase tracking-widest">
              {link.name}
            </Link>
          ))}
        </nav>
        <nav aria-label="Legal" className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
          {legalLinks.map((link) => (
            <Link key={link.name} to={link.href} className="py-3 -my-3 text-secondary-text/70 hover:text-ink transition-colors text-xs font-mono uppercase tracking-widest">
              {link.name}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
};
