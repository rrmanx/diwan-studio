import { useState } from 'react';
import { applyTheme, nextTheme, readTheme, type Theme } from '../lib/theme';
import { AutoIcon, MoonIcon, SunIcon } from './icons';

const LABELS: Record<Theme, string> = {
  light: 'فاتح',
  dark: 'داكن',
  auto: 'تلقائي',
};

const ICONS = {
  light: SunIcon,
  dark: MoonIcon,
  auto: AutoIcon,
};

interface ThemeToggleProps {
  variant?: 'text' | 'icon';
}

export function ThemeToggle({ variant = 'text' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(readTheme);

  const toggle = () => {
    const upcoming = nextTheme(theme);
    applyTheme(upcoming);
    setTheme(upcoming);
  };

  const label = `السمة الحالية: ${LABELS[theme]}. اضغط للتبديل إلى ${LABELS[nextTheme(theme)]}.`;

  if (variant === 'icon') {
    const Icon = ICONS[theme];
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        title={LABELS[theme]}
        className="font-ui inline-flex h-7 w-7 items-center justify-center rounded-[2px] border border-transparent text-ink-2 transition-colors duration-150 hover:border-rule hover:text-ink focus-visible:outline-offset-0"
      >
        <Icon size={14} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="font-ui inline-flex h-10 min-w-10 items-center justify-center border border-transparent px-2 text-xs text-ink-2 transition-colors duration-150 hover:border-rule hover:text-ink"
    >
      {LABELS[theme]}
    </button>
  );
}
