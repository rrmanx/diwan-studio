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

export function Header() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-rule backdrop-blur-[8px]"
      style={{ backgroundColor: 'color-mix(in srgb, var(--paper) 92%, transparent)' }}
    >
      <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4">
        <NavLink to="/" className="flex items-center gap-2.5" aria-label="ستوديو الديوان — الرئيسية">
          <BrandMark />
          <span className="font-display text-lg tracking-[.04em] text-ink">ديوان</span>
          <span className="font-mono text-[11px] tracking-[.28em] text-ink-2">STUDIO</span>
        </NavLink>

        <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `text-sm underline-offset-[6px] transition-colors duration-150 ${
                  isActive
                    ? 'text-accent underline decoration-accent decoration-1'
                    : 'text-ink-2 hover:text-ink'
                }`
              }
            >
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
    </header>
  );
}
