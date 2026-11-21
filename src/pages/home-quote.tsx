import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api/client';
import { useAsync } from '../lib/use-async';
import { ErrorState } from '../components/error-state';
import { RefreshIcon } from '../components/icons';
import { Skeleton } from '../components/skeleton';

function QuoteLine({ text }: { text: string }) {
  const line = useRef<HTMLParagraphElement>(null);
  const [compact, setCompact] = useState(false);
  const [smaller, setSmaller] = useState(0);
  const [, setFontEpoch] = useState(0);

  useLayoutEffect(() => {
    const node = line.current;
    if (!node) return;
    const style = window.getComputedStyle(node);
    const lineHeight = Number.parseFloat(style.lineHeight) || 1.95 * Number.parseFloat(style.fontSize);
    const lines = Math.round(node.scrollHeight / lineHeight);
    if (!compact && lines > 2) {
      setCompact(true);
    } else if (compact && lines > 4 && smaller < 6) {
      setSmaller((value) => value + 1);
    }
  }, [text, compact, smaller]);

  useLayoutEffect(() => {
    let live = true;
    void document.fonts.ready.then(() => { if (live) setFontEpoch((epoch) => epoch + 1); });
    return () => { live = false; };
  }, []);

  const base = 'clamp(22px, 2.4vw, 34px)';
  const fontSize = compact ? `calc(24px - ${smaller}px)` : base;

  return (
    <p
      ref={line}
      className="m-0 whitespace-pre-line text-center font-poem text-ink"
      style={{ paddingBlock: '1.1em', lineHeight: 1.95, overflow: 'visible', fontSize }}
      dir="rtl"
    >
      {text}
    </p>
  );
}

export function HomeQuote() {
  const { data: quote, error, loading, reload } = useAsync(() => api.randomQuote(), []);

  return (
    <section aria-label="اقتباس" className="panel flex h-full flex-col">
      <div className="panel-head">
        <span className="micro-label">اقتباس</span>
        <button
          type="button"
          onClick={reload}
          aria-label="اقتباس آخر"
          title="اقتباس آخر"
          className="inline-flex h-7 w-7 items-center justify-center rounded-[2px] border border-transparent text-ink-2 transition-colors duration-150 hover:border-rule hover:text-ink"
        >
          <RefreshIcon size={14} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 p-4">
          <Skeleton rows={3} />
        </div>
      ) : error || !quote ? (
        <div className="flex-1 p-2">
          <ErrorState message={error ?? undefined} onRetry={reload} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-between p-4">
          <blockquote className="m-0">
            <QuoteLine key={quote.id} text={quote.text} />
            <footer className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-ui text-[12px] text-ink-3">
              <span>{quote.author.name}</span>
              {quote.topic && <span className="text-ink-3">· {quote.topic}</span>}
            </footer>
          </blockquote>

          <div className="mt-4 flex items-center gap-3">
            <Link
              to={`/studio?quote=${quote.id}`}
              className="font-ui text-[12px] text-ink-2 underline-offset-[6px] transition-colors duration-150 hover:text-accent hover:underline"
            >
              صمّم الاقتباس
            </Link>
            <Link
              to="/quotes"
              className="font-ui text-[12px] text-ink-3 underline-offset-[6px] transition-colors duration-150 hover:text-accent hover:underline"
            >
              كل الاقتباسات
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
