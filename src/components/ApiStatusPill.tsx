import { Link } from 'react-router-dom';

export function ApiStatusPill() {
  return (
    <Link
      to="/api"
      className="font-ui inline-flex h-8 items-center gap-2 border border-rule px-3 text-[11px] tracking-[.08em] text-ink-2 transition-colors duration-150 hover:border-ink hover:text-ink"
    >
      <span className="dot" aria-hidden="true" />
      <span>API</span>
    </Link>
  );
}
