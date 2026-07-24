import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
  onNavigate?: () => void;
  // Pass -1 when this switcher lives in a mobile menu that's currently
  // closed but still in the DOM (translated off-screen), so it can't be
  // tabbed into — mirrors the pattern used for the other mobile nav links.
  tabIndex?: number;
  // 'lg' gives each link a real 44px touch target — used in the mobile menu,
  // where links are spaced out and tapped with a thumb. 'sm' (default) keeps
  // the compact footprint needed in the desktop navbar.
  size?: 'sm' | 'lg';
}

export const LanguageSwitcher = ({ className = '', onNavigate, tabIndex, size = 'sm' }: LanguageSwitcherProps) => {
  const { lang, content, toPath } = useLanguage();
  const { nav } = content;

  const activeClass = 'bg-ink/10 text-ink';
  const inactiveClass = 'text-secondary-text hover:text-ink';
  const linkSizeClass = size === 'lg' ? 'px-4 py-3 text-sm' : 'px-2 py-1 text-xs';

  return (
    <div role="group" aria-label={nav.ariaLanguage} className={`flex items-center gap-1 font-mono ${size === 'sm' ? 'text-xs' : ''} ${className}`}>
      <Link
        to={toPath('en')}
        onClick={onNavigate}
        tabIndex={tabIndex}
        aria-current={lang === 'en' ? 'true' : undefined}
        className={`${linkSizeClass} rounded-md transition-colors ${lang === 'en' ? activeClass : inactiveClass}`}
      >
        <span lang="en">{nav.langEnglishNative}</span>
      </Link>
      <Link
        to={toPath('hi')}
        onClick={onNavigate}
        tabIndex={tabIndex}
        aria-current={lang === 'hi' ? 'true' : undefined}
        className={`${linkSizeClass} rounded-md transition-colors ${lang === 'hi' ? activeClass : inactiveClass}`}
      >
        <span lang="hi">{nav.langHindiNative}</span>
        <span className="sr-only" lang="en"> ({nav.langHindiGloss})</span>
      </Link>
    </div>
  );
};
