import { Link } from 'react-router-dom';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  action?: { to: string; label: string };
}

export function SectionHeading({ eyebrow, title, action }: SectionHeadingProps) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b border-rule pb-3">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="font-display text-[26px] font-normal leading-tight text-ink">{title}</h2>
      </div>
      {action && (
        <Link
          to={action.to}
          className="font-ui shrink-0 text-sm text-ink-2 underline-offset-[6px] transition-colors duration-150 hover:text-accent hover:underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
