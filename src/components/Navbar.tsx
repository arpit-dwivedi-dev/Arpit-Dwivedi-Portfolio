import { motion } from 'motion/react';
import { Menu, X, Sun, Moon, ArrowRight } from 'lucide-react';
import { FaLinkedin } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import metadata from '../../metadata.json';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { LanguageSwitcher } from './LanguageSwitcher';

/**
 * "Soon" marker beside the Products nav item.
 *
 * Outlined rather than filled, and violet rather than the brand cyan: cyan is
 * reserved site-wide for things that actually run (see index.css), and a
 * filled pill would read as a live badge on an item that goes nowhere yet.
 * The item itself is a real anchor to the Now/Next section, so it is never a
 * dead link and needs no aria-disabled.
 */
const SoonPill = ({ label }: { label: string }) => (
  <span
    aria-hidden="true"
    className="font-mono text-[8px] font-medium uppercase tracking-[0.12em] text-accent-purple-text border border-accent-purple-text/35 rounded-[2px] px-[5px] py-[2px] leading-none"
  >
    {label}
  </span>
);

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { lang, content } = useLanguage();
  const { navLinks, contact, nav } = content;
  const homeHref = lang === 'hi' ? '/hi' : '/';
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);

  const hrefFor = (href: string) => (href.startsWith('#') ? `${homeHref}${href}` : href);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    firstMobileLinkRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <nav aria-label="Primary" className="fixed top-0 left-0 w-full z-50">
      {/* Constant height across scroll states. The bar used to shrink from
          py-6 to py-4, which slid the logo and links upward mid-scroll for no
          informational gain; only the background and boundary change now. */}
      <div
        className={`h-[72px] flex items-center transition-[background-color,border-color,backdrop-filter] duration-300 ${
          scrolled
            ? 'bg-bg-pure/85 backdrop-blur-md border-b border-hairline'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl w-full mx-auto px-5 sm:px-6 flex items-center gap-4 lg:gap-6 xl:gap-8">
          {/* One entrance for the whole bar rather than a per-link stagger.
              The old version delayed each link by idx * 0.1s, which is seven
              independent fade-ins reading as a ripple, not an arrival. */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}>
            <Link to={homeHref} className="group flex items-center gap-2.5 whitespace-nowrap">
              <span className="relative block w-8 h-8 shrink-0">
                <picture>
                  <source srcSet="/logo-64.webp" type="image/webp" />
                  <img src="/logo-64.png" width={32} height={32} alt="101TechLabs" className="w-8 h-8 rounded-lg" />
                </picture>
                <span className="logo-sheen" aria-hidden="true">
                  <span className="logo-sheen-blade" />
                </span>
              </span>
              <span className="t-dm text-[1.0625rem] text-ink">
                {metadata.name.split(' ')[0]}
                <span className="text-accent-blue"> {metadata.name.split(' ').slice(1).join(' ')}</span>
              </span>
            </Link>
          </motion.div>

          {/* Desktop links */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 0.61, 0.36, 1] }}
            className="hidden lg:flex items-center gap-5 xl:gap-7 grow"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={hrefFor(link.href)}
                aria-label={link.soon ? nav.ariaProductsSoon : undefined}
                className={`group/link relative text-sm font-medium whitespace-nowrap inline-flex items-center gap-1.5 py-2 transition-colors ${
                  link.soon ? 'text-secondary-text/70 hover:text-secondary-text' : 'text-secondary-text hover:text-ink'
                }`}
              >
                {link.name}
                {link.soon && <SoonPill label={nav.soon} />}
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 w-0 h-px bg-accent-blue transition-[width] duration-300 group-hover/link:w-full"
                />
              </Link>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 0.61, 0.36, 1] }}
            className="hidden lg:flex items-center gap-4 shrink-0"
          >
            <div className="flex items-center gap-3.5 pr-4 border-r border-hairline">
              <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" aria-label={nav.ariaLinkedin} className="p-2 -m-2 text-secondary-text hover:text-accent-blue transition-colors">
                <FaLinkedin size={17} />
              </a>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? nav.ariaSwitchToLight : nav.ariaSwitchToDark}
                className="p-2 -m-2 text-secondary-text hover:text-accent-blue transition-colors"
              >
                {theme === 'dark' ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
              </button>
              <LanguageSwitcher />
            </div>
            {/* Contact left the link row and became the bar's one action. The
                page's single job is getting a stranger into this form, and it
                was previously the seventh of seven equal-weight text links. */}
            <Link
              to={hrefFor('#contact')}
              className="text-sm font-semibold text-bg-pure bg-ink hover:bg-accent-blue h-10 px-4 inline-flex items-center rounded-[3px] transition-colors whitespace-nowrap"
            >
              {nav.ctaQuote}
            </Link>
          </motion.div>

          {/* Mobile menu toggle */}
          <button
            aria-label={nav.ariaOpenMenu}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            className={`lg:hidden ml-auto text-ink relative z-50 p-2.5 -m-2.5 transition-opacity ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            onClick={() => setIsOpen(true)}
          >
            <Menu aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <motion.div
        id="mobile-menu"
        aria-hidden={!isOpen}
        initial={false}
        animate={isOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: '100%' }}
        transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
        className="lg:hidden fixed inset-0 z-40 bg-bg-pure/97 backdrop-blur-xl flex flex-col justify-center items-start gap-1 px-8 py-24 overflow-y-auto"
      >
        <button
          aria-label={nav.ariaCloseMenu}
          onClick={() => setIsOpen(false)}
          tabIndex={isOpen ? undefined : -1}
          className="absolute top-[18px] right-6 text-ink p-2.5 -m-2.5"
        >
          <X aria-hidden="true" />
        </button>

        {navLinks.map((link, idx) => (
          <Link
            key={link.name}
            ref={idx === 0 ? firstMobileLinkRef : undefined}
            to={hrefFor(link.href)}
            aria-label={link.soon ? nav.ariaProductsSoon : undefined}
            onClick={() => setIsOpen(false)}
            tabIndex={isOpen ? undefined : -1}
            className={`t-ds w-full py-3 border-b border-hairline flex items-center gap-3 transition-colors ${
              link.soon ? 'text-secondary-text' : 'text-ink hover:text-accent-blue'
            }`}
          >
            {link.name}
            {link.soon && <SoonPill label={nav.soon} />}
          </Link>
        ))}

        <Link
          to={hrefFor('#contact')}
          onClick={() => setIsOpen(false)}
          tabIndex={isOpen ? undefined : -1}
          className="mt-8 w-full h-14 rounded-[3px] bg-ink text-bg-pure font-semibold inline-flex items-center justify-center gap-2"
        >
          {nav.ctaQuote}
          <ArrowRight size={17} aria-hidden="true" />
        </Link>

        <div className="mt-8 flex items-center gap-7">
          <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" aria-label={nav.ariaLinkedin} tabIndex={isOpen ? undefined : -1} className="p-3 -m-3 text-secondary-text hover:text-accent-blue transition-colors">
            <FaLinkedin size={22} />
          </a>
          <button
            type="button"
            onClick={toggleTheme}
            tabIndex={isOpen ? undefined : -1}
            aria-label={theme === 'dark' ? nav.ariaSwitchToLight : nav.ariaSwitchToDark}
            className="p-3 -m-3 text-secondary-text hover:text-accent-blue transition-colors"
          >
            {theme === 'dark' ? <Sun size={22} aria-hidden="true" /> : <Moon size={22} aria-hidden="true" />}
          </button>
          <LanguageSwitcher size="lg" tabIndex={isOpen ? undefined : -1} onNavigate={() => setIsOpen(false)} />
        </div>
      </motion.div>
    </nav>
  );
};
