import { useState } from 'react';
import { applyTheme, nextTheme, readTheme, type Theme } from '../lib/theme';

const LABELS: Record<Theme, string> = {
  light: 'فاتح',
  dark: 'داكن',
  auto: 'تلقائي',
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  const toggle = () => {
    const upcoming = nextTheme(theme);
    applyTheme(upcoming);
    setTheme(upcoming);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`السمة الحالية: ${LABELS[theme]}. اضغط للتبديل إلى ${LABELS[nextTheme(theme)]}.`}
      className="inline-flex h-10 min-w-10 items-center justify-center border border-transparent px-2 text-xs text-ink-2 transition-colors duration-150 hover:border-rule hover:text-ink"
    >
      {LABELS[theme]}
    </button>
  );
}
