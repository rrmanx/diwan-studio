import { Link } from 'react-router-dom';

export function SearchLink() {
  return (
    <Link
      to="/search"
      className="inline-flex h-10 items-center gap-2 px-2 text-sm text-ink-2 transition-colors duration-150 hover:text-ink"
    >
      <span>بحث</span>
      <kbd className="font-mono text-[11px] text-ink-3">⌘K</kbd>
    </Link>
  );
}
