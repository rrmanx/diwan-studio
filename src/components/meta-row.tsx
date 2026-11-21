import { Fragment } from 'react';
import { Link } from 'react-router-dom';

interface MetaRowProps {
  poet?: string | null;
  era?: string | null;
  meter?: string | null;
  rhyme?: string | null;
  poetHref?: string;
  eraHref?: string;
  className?: string;
}

export function MetaRow({ poet, era, meter, rhyme, poetHref, eraHref, className = '' }: MetaRowProps) {
  const items = [
    { value: poet, href: poetHref },
    { value: era, href: eraHref },
    { value: meter },
    { value: rhyme },
  ].filter((item): item is { value: string; href?: string } => Boolean(item.value));

  return (
    <div className={`font-ui flex flex-wrap items-center gap-x-2 text-[13px] text-ink-2 ${className}`.trim()}>
      {items.map((item, index) => (
        <Fragment key={`${item.value}-${index}`}>
          {index > 0 && (
            <span aria-hidden="true" className="text-ink-3">
              ·
            </span>
          )}
          {item.href ? (
            <Link
              to={item.href}
              className="underline-offset-[6px] transition-colors duration-150 hover:text-accent hover:underline"
            >
              {item.value}
            </Link>
          ) : (
            <span>{item.value}</span>
          )}
        </Fragment>
      ))}
    </div>
  );
}
