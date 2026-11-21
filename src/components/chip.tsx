import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Shared {
  children: ReactNode;
  active?: boolean;
  className?: string;
  ariaLabel?: string;
}

type Props = Shared &
  ({ as?: 'button'; to?: never; onClick?: () => void } | { as: 'link'; to: string; onClick?: () => void });

const BASE =
  'font-ui inline-flex h-7 items-center justify-center rounded-[2px] border px-2.5 text-xs leading-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

export function Chip(props: Props) {
  const { children, active = false, className = '', ariaLabel } = props;
  const tone = active
    ? 'border-primary-bg bg-primary-bg text-primary-ink'
    : 'border-rule bg-transparent text-ink-2 hover:border-rule-strong hover:bg-hover hover:text-ink';
  const classes = `${BASE} ${tone} ${className}`.trim();

  if (props.as === 'link') {
    return (
      <Link to={props.to} aria-label={ariaLabel} aria-current={active ? 'true' : undefined} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={classes}
    >
      {children}
    </button>
  );
}
