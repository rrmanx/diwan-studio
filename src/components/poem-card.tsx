import { Link } from 'react-router-dom';
import type { PoemSummary } from '../lib/types';
import { Button } from './button';

interface PoemCardProps {
  poem: PoemSummary;
  showExcerpt?: boolean;
}

export function PoemCard({ poem, showExcerpt = true }: PoemCardProps) {
  const meta = [poem.poet.name, poem.era.name, poem.meter, poem.rhyme]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="row-hover group flex min-h-[56px] items-center gap-3 border-b border-rule px-3 py-2 last:border-b-0">
      <Link to={`/poems/${poem.id}`} className="min-w-0 flex-1">
        <span className="block truncate font-ui text-[15px] font-medium leading-snug text-ink transition-colors duration-150 group-hover:text-accent">
          {poem.title}
        </span>
        <span className="mt-0.5 block truncate font-ui text-[12px] leading-snug text-ink-3">
          {meta}
        </span>
      </Link>

      {showExcerpt && (
        <span className="hidden min-w-0 flex-1 truncate font-poem text-[13px] leading-normal text-ink-2 md:block">
          {poem.excerpt.replace(/\s*۞\s*/g, '  ')}
        </span>
      )}

      <Button
        as="link"
        to={`/studio/${poem.id}`}
        variant="ghost"
        size="sm"
        className="shrink-0 opacity-100 transition-opacity duration-150 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
      >
        صمّم
      </Button>
    </article>
  );
}
