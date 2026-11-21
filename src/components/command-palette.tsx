import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from './icons';
import { readRecent, type RecentEntry } from './recents';

interface Destination {
  label: string;
  to: string;
  hint: string;
}

const DESTINATIONS: Destination[] = [
  { label: 'اكتشف', to: '/', hint: '/' },
  { label: 'البحث', to: '/search', hint: '/search' },
  { label: 'الشعراء', to: '/poets', hint: '/poets' },
  { label: 'القصائد', to: '/poems', hint: '/poems' },
  { label: 'الاقتباسات', to: '/quotes', hint: '/quotes' },
  { label: 'الاستوديو', to: '/studio', hint: '/studio' },
  { label: 'التكامل', to: '/api', hint: '/api' },
  { label: 'عن المشروع', to: '/about', hint: '/about' },
];

interface Row {
  key: string;
  group: string;
  label: string;
  hint?: string;
  to: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const listId = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [recents, setRecents] = useState<RecentEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    previousFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQuery('');
    setActive(0);
    setRecents(readRecent());
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(timer);
      previousFocus.current?.focus();
    };
  }, [open]);

  const trimmed = query.trim();
  const needle = trimmed.toLowerCase();

  const rows = useMemo<Row[]>(() => {
    const next: Row[] = DESTINATIONS.filter((destination) => {
      if (!needle) return true;
      return (
        destination.label.toLowerCase().includes(needle) ||
        destination.to.toLowerCase().includes(needle) ||
        destination.hint.toLowerCase().includes(needle)
      );
    }).map((destination) => ({
      key: `go-${destination.to}`,
      group: 'انتقل إلى',
      label: destination.label,
      hint: destination.hint,
      to: destination.to,
    }));

    if (trimmed) {
      next.push({
        key: 'search',
        group: `ابحث عن «${trimmed}»`,
        label: 'افتح نتائج البحث',
        hint: '/search',
        to: `/search?q=${encodeURIComponent(trimmed)}`,
      });
    }

    for (const entry of recents) {
      if (needle && !`${entry.title} ${entry.meta ?? ''}`.toLowerCase().includes(needle)) {
        continue;
      }
      next.push({
        key: `recent-${entry.href}`,
        group: 'آخر ما قرأت',
        label: entry.title,
        hint: entry.meta ?? entry.href,
        to: entry.href,
      });
    }

    return next;
  }, [needle, trimmed, recents]);

  useEffect(() => {
    if (!open) return;
    const node = document.getElementById(`${listId}-${active}`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [active, listId, open]);

  if (!open) return null;

  const choose = (row: Row | undefined) => {
    if (!row) return;
    onClose();
    navigate(row.to);
  };

  const trapTab = (event: KeyboardEvent<HTMLDivElement>) => {
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>('input, button');
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === 'Tab') {
      trapTab(event);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((current) => (rows.length === 0 ? 0 : (current + 1) % rows.length));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => (rows.length === 0 ? 0 : (current - 1 + rows.length) % rows.length));
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setActive(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActive(Math.max(0, rows.length - 1));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      choose(rows[active]);
    }
  };

  let currentGroup = '';

  return createPortal(
    <div
      className="palette-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="لوحة الأوامر"
        className="palette-panel"
        onKeyDown={onKeyDown}
      >
        <div className="palette-input-row">
          <SearchIcon size={16} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder="ابحث أو انتقل…"
            aria-label="ابحث أو انتقل"
            aria-controls={listId}
            aria-activedescendant={active >= 0 && rows[active] ? `${listId}-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="keycap">esc</kbd>
        </div>

        <div id={listId} role="listbox" aria-label="نتائج لوحة الأوامر" className="palette-list">
          {rows.length === 0 ? (
            <p className="palette-empty">لا وجهة بهذا النص. جرّب اسم شاعر أو صفحة.</p>
          ) : (
            rows.map((row, index) => {
              const heading = row.group !== currentGroup ? row.group : null;
              currentGroup = row.group;
              return (
                <div key={row.key} role="presentation">
                  {heading && (
                    <div className="palette-group-label" role="presentation">
                      {heading}
                    </div>
                  )}
                  <button
                    type="button"
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === active}
                    data-active={index === active || undefined}
                    className="palette-row"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(row)}
                    onFocus={() => setActive(index)}
                  >
                    <span>{row.label}</span>
                    {row.hint && (
                      <span className="palette-hint" dir="auto">
                        {row.hint}
                      </span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="palette-foot">
          <span>↑↓ تنقّل</span>
          <span>↵ اختيار</span>
          <span>esc إغلاق</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
