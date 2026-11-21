export type Theme = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'diwan:theme';
const ORDER: Theme[] = ['light', 'dark', 'auto'];
const THEME_COLOR: Record<'light' | 'dark', string> = {
  light: '#F4EEE3',
  dark: '#13110D',
};

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark' || value === 'auto';
}

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

function paint(theme: Theme): void {
  const root = document.documentElement;
  const resolved = theme === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  root.dataset.theme = theme;
  root.style.colorScheme = theme === 'auto' ? '' : resolved;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = THEME_COLOR[resolved];
}

export function applyTheme(theme: Theme): void {
  paint(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable in private browsing; the in-memory theme still applies.
  }
}

export function applyStoredTheme(): void {
  const url = new URL(window.location.href);
  const requested = url.searchParams.get('theme');
  if (isTheme(requested)) {
    url.searchParams.delete('theme');
    window.history.replaceState(window.history.state, '', url);
    applyTheme(requested);
    return;
  }
  paint(readTheme());
}

export function nextTheme(theme: Theme): Theme {
  return ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
}
