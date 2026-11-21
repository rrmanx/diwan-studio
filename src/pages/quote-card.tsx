import type { Quote } from '../lib/types';
import { Button } from '../components/button';

interface QuoteCardProps {
  quote: Quote;
  calligraphic?: boolean;
}

export function QuoteCard({ quote, calligraphic = false }: QuoteCardProps) {
  return (
    <article className="row-hover group flex items-start gap-4 border-b border-rule px-4 py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p
          className={`m-0 whitespace-pre-line text-ink ${
            calligraphic
              ? 'text-center font-poem text-[clamp(22px,2.4vw,34px)]'
              : 'font-poem text-[18px] leading-[1.9]'
          }`}
          style={calligraphic ? { paddingBlock: '1.1em', lineHeight: 1.95, overflow: 'visible' } : undefined}
          dir="rtl"
        >
          {quote.text}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-ui text-[12px] text-ink-3">
          <span>{quote.author.name}</span>
          {quote.topic && <span>· {quote.topic}</span>}
        </div>
      </div>
      <Button
        as="link"
        to={`/studio?quote=${quote.id}`}
        variant="ghost"
        size="sm"
        className="shrink-0 opacity-100 transition-opacity duration-150 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
      >
        صمّم
      </Button>
    </article>
  );
}
