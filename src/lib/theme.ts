export type Theme = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'diwan:theme';
const ORDER: Theme[] = ['light', 'dark', 'auto'];

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'auto' ? stored : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable in private browsing; the in-memory theme still applies.
  }
}

export function applyStoredTheme(): void {
  document.documentElement.dataset.theme = readTheme();
}

export function nextTheme(theme: Theme): Theme {
  return ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
}
