import { NavLink } from 'react-router-dom';
import { ApiStatusPill } from './ApiStatusPill';
import { BrandMark } from './BrandMark';
import { SearchLink } from './SearchLink';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { to: '/', label: 'اكتشف' },
  { to: '/poets', label: 'الشعراء' },
  { to: '/poems', label: 'القصائد' },
  { to: '/quotes', label: 'الاقتباسات' },
  { to: '/studio', label: 'الاستوديو' },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `font-ui text-sm underline-offset-[6px] transition-colors duration-150 ${
    isActive ? 'text-accent underline decoration-accent decoration-1' : 'text-ink-2 hover:text-ink'
  }`;

export function Header() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-rule backdrop-blur-[8px]"
      style={{ backgroundColor: 'color-mix(in srgb, var(--paper) 92%, transparent)' }}
    >
      <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4">
        <NavLink
          to="/"
          className="flex items-center gap-2.5 whitespace-nowrap"
          aria-label="ستوديو الديوان — الرئيسية"
        >
          <BrandMark />
          <span
            className="text-ink"
            style={{
              fontFamily: "'Thmanyah Serif Display', serif",
              fontWeight: 500,
              fontSize: '21px',
              lineHeight: 1,
              letterSpacing: 0,
              whiteSpace: 'nowrap',
            }}
          >
            الدِّيوَان
          </span>
          <span className="font-mono text-[11px] tracking-[.28em] text-ink-2">STUDIO</span>
        </NavLink>

        <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-1.5">
          <ApiStatusPill />
          <ThemeToggle />
          <SearchLink />
        </div>
      </div>

      <nav aria-label="التنقل السريع" className="border-t border-rule md:hidden">
        <div className="container-page flex gap-6 overflow-x-auto py-2 text-sm whitespace-nowrap">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
