import { Link } from 'react-router-dom';
import { api } from '../lib/api/client';
import { useAsync } from '../lib/use-async';
import { ErrorState } from '../components/error-state';
import { RefreshIcon } from '../components/icons';
import { Skeleton } from '../components/skeleton';

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
            <p className="whitespace-pre-line font-calligraphic text-[clamp(20px,2vw,24px)] leading-[1.9] text-ink">
              {quote.text}
            </p>
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
