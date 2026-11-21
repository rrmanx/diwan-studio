import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api/client';
import type { Quote } from '../lib/types';
import { errorMessage, useAsync } from '../lib/use-async';
import { useTopbar } from '../components/app-shell';
import { Button } from '../components/button';
import { EmptyState } from '../components/empty-state';
import { ErrorState } from '../components/error-state';
import { Skeleton } from '../components/skeleton';
import { QuoteCard } from './quote-card';

export function QuotesPage() {
  const [page, setPage] = useState(1);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [featured, setFeatured] = useState<Quote | null>(null);
  const [randomError, setRandomError] = useState<string | null>(null);
  const appended = useRef(0);
  const mounted = useRef(true);

  const { data, error, loading } = useAsync(() => api.listQuotes({ page, per_page: 12 }), [page]);

  const random = async () => {
    try {
      const quote = await api.randomQuote();
      if (mounted.current) {
        setFeatured(quote);
        setRandomError(null);
      }
    } catch (cause) {
      if (mounted.current) setRandomError(errorMessage(cause));
    }
  };

  const topbarActions = useTopbar(
    'الاقتباسات',
    <Button variant="secondary" size="sm" onClick={random}>
      اقتباس عشوائي
    </Button>,
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!data || data.meta.current_page <= appended.current) return;
    appended.current = data.meta.current_page;
    setQuotes((previous) => [...previous, ...data.data]);
  }, [data]);

  return (
    <div>
      {topbarActions}
      <div className="mb-3 flex min-[960px]:hidden">
        <Button variant="secondary" size="sm" onClick={random}>
          اقتباس عشوائي
        </Button>
      </div>
      {randomError && <ErrorState message={randomError} />}

      {featured && (
        <section aria-label="اقتباس عشوائي" className="panel mb-4">
          <div className="panel-head">
            <span className="micro-label">اقتباس عشوائي</span>
            <button
              type="button"
              onClick={random}
              className="font-ui text-[12px] text-ink-2 underline-offset-[6px] hover:text-accent hover:underline"
            >
              آخر
            </button>
          </div>
          <div className="px-4 py-4">
            <QuoteCard quote={featured} calligraphic />
          </div>
        </section>
      )}

      {loading && quotes.length === 0 ? (
        <Skeleton rows={6} />
      ) : error && quotes.length === 0 ? (
        <ErrorState message={error} />
      ) : quotes.length === 0 ? (
        <EmptyState message="لا توجد اقتباسات في المعاينة." />
      ) : (
        <>
          <div className="panel">
            {quotes.map((quote, index) => (
              <QuoteCard key={`${quote.id}-${index}`} quote={quote} calligraphic={index === 0} />
            ))}
          </div>
          {data && page < data.meta.last_page && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" size="sm" disabled={loading} onClick={() => setPage((value) => value + 1)}>
                المزيد
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
