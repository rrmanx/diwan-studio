import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';

interface Shared {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

type Props = Shared &
  (
    | { as?: 'button'; to?: never; disabled?: boolean; type?: 'button' | 'submit'; onClick?: () => void }
    | { as: 'link'; to: string; disabled?: never; type?: never; onClick?: () => void }
  );

const BASE =
  'font-ui inline-flex items-center justify-center rounded-[2px] leading-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50';

const SIZES: Record<Size, string> = {
  sm: 'min-h-8 px-3 text-[12px]',
  md: 'min-h-11 px-5 text-sm',
};

const GHOST_SIZES: Record<Size, string> = {
  sm: 'min-h-7 px-0 text-[12px]',
  md: 'min-h-8 px-0 text-sm',
};

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary-bg text-primary-ink hover:bg-accent hover:text-paper',
  secondary: 'border border-rule bg-transparent text-ink hover:border-rule-strong hover:bg-hover',
  ghost: 'bg-transparent text-ink underline-offset-[6px] hover:text-accent hover:underline',
};

export function Button(props: Props) {
  const { variant = 'primary', size = 'md', children, className = '', ariaLabel } = props;
  const sizing = variant === 'ghost' ? GHOST_SIZES[size] : SIZES[size];
  const classes = `${BASE} ${sizing} ${VARIANTS[variant]} ${className}`.trim();

  if (props.as === 'link') {
    return (
      <Link
        to={props.to}
        onClick={props.onClick}
        aria-label={ariaLabel}
        className={classes}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? 'button'}
      disabled={props.disabled}
      onClick={props.onClick}
      aria-label={ariaLabel}
      className={classes}
    >
      {children}
    </button>
  );
}
