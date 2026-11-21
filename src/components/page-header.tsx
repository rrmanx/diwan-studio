import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, lede, actions }: PageHeaderProps) {
  return (
    <header className="mb-10 border-b border-rule pb-6">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h1 className="font-display text-[clamp(32px,3.75vw,45px)] font-normal leading-tight text-ink">
            {title}
          </h1>
        </div>
        {actions}
      </div>
      {lede && <p className="mt-4 max-w-2xl text-base text-ink-2">{lede}</p>}
    </header>
  );
}
