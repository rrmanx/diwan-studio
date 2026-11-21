export interface RecentEntry {
  href: string;
  title: string;
  meta?: string;
  at: number;
}

const STORAGE_KEY = 'diwan:recent';
const LIMIT = 5;

function isEntry(value: unknown): value is RecentEntry {
  if (value === null || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.href === 'string' &&
    typeof record.title === 'string' &&
    (record.meta === undefined || typeof record.meta === 'string') &&
    typeof record.at === 'number'
  );
}

export function readRecent(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).slice(0, LIMIT);
  } catch {
    return [];
  }
}

export function recordRecent(entry: Omit<RecentEntry, 'at'>): void {
  try {
    const next: RecentEntry[] = [
      { ...entry, at: Date.now() },
      ...readRecent().filter((item) => item.href !== entry.href),
    ].slice(0, LIMIT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing or a full quota: recents are a convenience, not state.
  }
}
