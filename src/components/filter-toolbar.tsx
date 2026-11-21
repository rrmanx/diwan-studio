import type { ReactNode } from 'react';
import { ChevronDownIcon } from './icons';

interface FilterToolbarProps {
  count?: ReactNode;
  label?: string;
  children: ReactNode;
}

export function FilterToolbar({ count, label = 'أدوات التصفية', children }: FilterToolbarProps) {
  return (
    <div className="toolbar" role="group" aria-label={label}>
      {count !== undefined && <span className="toolbar-count">{count}</span>}
      {children}
    </div>
  );
}

interface FilterSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}

export function FilterSelect({ id, label, value, onChange, children }: FilterSelectProps) {
  return (
    <span className="filter-select">
      <select
        id={id}
        aria-label={label}
        value={value}
        data-active={value !== '' || undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      <ChevronDownIcon className="filter-select-icon" />
    </span>
  );
}
