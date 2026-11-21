import { Link } from 'react-router-dom';
import { api } from '../lib/api/client';
import { useAsync } from '../lib/use-async';
import { Button } from '../components/button';
import { EmptyState } from '../components/empty-state';
import { ErrorState } from '../components/error-state';
import { Skeleton } from '../components/skeleton';

export function HomeSelected() {
  const { data, error, loading, reload } = useAsync(async () => {
    const page = await api.listPoems({ per_page: 6 });
    return page.data.slice(0, 5);
  }, []);

  return (
    <section aria-label="مختارات" className="panel flex h-full flex-col">
      <div className="panel-head">
        <span className="micro-label">مختارات</span>
        <Link
          to="/poems"
          className="font-ui text-[12px] text-ink-2 underline-offset-[6px] transition-colors duration-150 hover:text-accent hover:underline"
        >
          الكل
        </Link>
      </div>

      {loading ? (
        <div className="p-3">
          <Skeleton rows={5} />
        </div>
      ) : error || !data ? (
        <ErrorState message={error ?? undefined} onRetry={reload} />
      ) : data.length === 0 ? (
        <EmptyState message="لا توجد قصائد في هذه المختارة." />
      ) : (
        <ul className="m-0 list-none p-0">
          {data.map((poem) => (
            <li key={poem.id} className="border-b border-rule last:border-b-0">
              <div className="row-hover group flex items-center gap-3 px-4 py-2.5">
                <Link to={`/poems/${poem.id}`} className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate font-ui text-[15px] font-medium leading-snug text-ink">
                      {poem.title}
                    </span>
                    <span className="shrink-0 font-ui text-[12px] text-ink-3">{poem.poet.name}</span>
                  </span>
                  <span className="mt-0.5 block truncate font-ui text-[13px] leading-snug text-ink-2">
                    {poem.excerpt.replace(/\s*۞\s*/g, '  ')}
                  </span>
                </Link>
                <Button
                  as="link"
                  to={`/studio/${poem.id}`}
                  variant="ghost"
                  size="sm"
                  className="shrink-0 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
                >
                  صمّم
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
