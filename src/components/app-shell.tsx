import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { getMode, subscribeMode } from '../lib/api/client';
import { BrandMark } from './BrandMark';
import { CommandPalette } from './command-palette';
import { SearchIcon } from './icons';
import { ThemeToggle } from './ThemeToggle';

interface TopbarContextValue {
  slot: HTMLDivElement | null;
  setOverride: (title: string | null) => void;
}

const TopbarContext = createContext<TopbarContextValue | null>(null);

/**
 * Sets the topbar title for the current page and portals page actions into the
 * topbar slot. Returns the portal (render it somewhere in the page tree).
 */
export function useTopbar(title?: string, actions?: ReactNode) {
  const context = useContext(TopbarContext);
  const setOverride = context?.setOverride;

  useEffect(() => {
    if (!title || !setOverride) return;
    setOverride(title);
    return () => setOverride(null);
  }, [title, setOverride]);

  return actions && context?.slot ? createPortal(actions, context.slot) : null;
}

interface NavItem {
  to: string;
  label: string;
  hint: string;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'المكتبة',
    items: [
      { to: '/', label: 'اكتشف', hint: '/' },
      { to: '/search', label: 'البحث', hint: '/search' },
      { to: '/poets', label: 'الشعراء', hint: '/poets' },
      { to: '/poems', label: 'القصائد', hint: '/poems' },
      { to: '/quotes', label: 'الاقتباسات', hint: '/quotes' },
    ],
  },
  {
    label: 'الاستوديو',
    items: [
      { to: '/studio', label: 'الاستوديو', hint: '/studio' },
      { to: '/preview', label: 'معاينة', hint: '/preview' },
      { to: '/studio?panel=designs', label: 'تصاميمي', hint: '?panel=designs' },
    ],
  },
  {
    label: 'النظام',
    items: [
      { to: '/api', label: 'التكامل', hint: '/api' },
      { to: '/about', label: 'عن المشروع', hint: '/about' },
    ],
  },
];

const TABS = [
  { to: '/', label: 'اكتشف' },
  { to: '/poems', label: 'القصائد' },
  { to: '/poets', label: 'الشعراء' },
  { to: '/studio', label: 'الاستوديو' },
];

function isActive(to: string, pathname: string, search: string): boolean {
  const [path, query] = to.split('?');
  if (path === '/') return pathname === '/';
  if (path === '/studio') {
    const wantsDesigns = new URLSearchParams(query).get('panel') === 'designs';
    const hasDesigns = new URLSearchParams(search).get('panel') === 'designs';
    if (wantsDesigns) return pathname === '/studio' && hasDesigns;
    return (pathname === '/studio' || pathname.startsWith('/studio/')) && !hasDesigns;
  }
  if (path === '/poems') {
    return pathname === '/poems' || pathname.startsWith('/poems/') || pathname.startsWith('/poem/');
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

function routeTitle(pathname: string): string {
  if (pathname === '/') return 'اكتشف';
  if (pathname === '/search') return 'البحث';
  if (pathname === '/poets') return 'الشعراء';
  if (pathname.startsWith('/poets/')) return 'شاعر';
  if (pathname === '/poems') return 'القصائد';
  if (pathname.startsWith('/poems/') || pathname.startsWith('/poem/')) return 'القصيدة';
  if (pathname === '/quotes') return 'الاقتباسات';
  if (pathname.startsWith('/studio')) return 'الاستوديو';
  if (pathname === '/preview') return 'معاينة';
  if (pathname === '/api') return 'التكامل';
  if (pathname === '/about') return 'عن المشروع';
  return 'الديوان';
}

export function AppShell() {
  const location = useLocation();
  const mode = useSyncExternalStore(subscribeMode, getMode, getMode);
  const live = mode === 'live';
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [override, setOverride] = useState<string | null>(null);
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  const title = override ?? routeTitle(location.pathname);
  const contextValue = useMemo(() => ({ slot, setOverride }), [slot]);

  useEffect(() => {
    setPaletteOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <TopbarContext.Provider value={contextValue}>
      <div className="app-shell">
        <a
          href="#main"
          className="font-ui sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[120] focus:border focus:border-rule focus:bg-paper-raised focus:px-4 focus:py-2 focus:text-ink"
        >
          تجاوز إلى المحتوى
        </a>

        <aside className="app-rail" aria-label="شريط التنقل">
          <Link to="/" className="rail-brand" aria-label="ستوديو الديوان — الرئيسية">
            <BrandMark size={22} />
            <span className="rail-wordmark">الدِّيوَان</span>
            <span className="rail-studio">STUDIO</span>
          </Link>

          <div className="rail-search-wrap">
            <button
              type="button"
              className="rail-search"
              onClick={() => setPaletteOpen(true)}
              aria-label="ابحث في الديوان — افتح لوحة الأوامر"
              aria-haspopup="dialog"
            >
              <span>ابحث في الديوان…</span>
              <kbd className="keycap">⌘K</kbd>
            </button>
          </div>

          <div className="rail-nav">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="rail-group" role="group" aria-label={group.label}>
                <p className="rail-eyebrow">{group.label}</p>
                {group.items.map((item) => {
                  const active = isActive(item.to, location.pathname, location.search);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="rail-item"
                      data-active={active || undefined}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span>{item.label}</span>
                      <span className="rail-item-hint" aria-hidden="true" dir="ltr">
                        {item.hint}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="rail-foot">
            <Link to="/api" className="mode-pill">
              <span
                className="dot"
                aria-hidden="true"
                style={{ background: live ? 'var(--accent)' : 'var(--gold)' }}
              />
              <span>{live ? 'مباشر' : 'معاينة'}</span>
            </Link>
            <div className="rail-foot-row">
              <ThemeToggle variant="icon" />
              <span className="rail-version">v1.0</span>
            </div>
          </div>
        </aside>

        <main ref={mainRef} id="main" tabIndex={-1} className="app-main">
          <header className="topbar">
            <div className="topbar-inner">
              <div className="topbar-desktop">
                <h1 className="topbar-title">{title}</h1>
                <div ref={setSlot} className="topbar-actions" />
              </div>
              <div className="topbar-mobile">
                <Link to="/" className="mobile-brand" aria-label="ستوديو الديوان — الرئيسية">
                  <BrandMark size={20} />
                  <span>الدِّيوَان</span>
                </Link>
                <h1 className="topbar-title" style={{ fontSize: 13 }}>
                  {title}
                </h1>
                <button
                  type="button"
                  className="mobile-search"
                  onClick={() => setPaletteOpen(true)}
                  aria-label="ابحث في الديوان"
                  aria-haspopup="dialog"
                >
                  <SearchIcon size={17} />
                </button>
              </div>
            </div>
          </header>

          <div className="app-content">
            <Outlet />
          </div>
        </main>

        <nav className="app-tabbar" aria-label="التنقل السفلي">
          {TABS.map((tab) => {
            const active = isActive(tab.to, location.pathname, location.search);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className="tab-item"
                data-active={active || undefined}
                aria-current={active ? 'page' : undefined}
              >
                {tab.label}
              </Link>
            );
          })}
          <button
            type="button"
            className="tab-item"
            onClick={() => setPaletteOpen(true)}
            aria-label="المزيد — افتح لوحة الأوامر"
            aria-haspopup="dialog"
          >
            المزيد
          </button>
        </nav>

        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </div>
    </TopbarContext.Provider>
  );
}
