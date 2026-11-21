import { Link } from 'react-router-dom';
import { api } from '../lib/api/client';
import { useAsync } from '../lib/use-async';
import { ChevronLeftIcon } from '../components/icons';
import { EmptyState } from '../components/empty-state';
import { ErrorState } from '../components/error-state';
import { Skeleton } from '../components/skeleton';

export function HomePoets() {
  const { data, error, loading, reload } = useAsync(() => api.listPoets({ per_page: 6 }), []);

  return (
    <section aria-label="شعراء" className="panel flex h-full flex-col">
      <div className="panel-head">
        <span className="micro-label">شعراء</span>
        <Link
          to="/poets"
          className="font-ui text-[12px] text-ink-2 underline-offset-[6px] transition-colors duration-150 hover:text-accent hover:underline"
        >
          الكل
        </Link>
      </div>

      {loading ? (
        <div className="p-3">
          <Skeleton rows={6} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState message="لا يوجد شعراء في المعاينة." />
      ) : (
        <ul className="m-0 list-none p-0">
          {data.data.map((poet) => (
            <li key={poet.id} className="border-b border-rule last:border-b-0">
              <Link
                to={`/poets/${poet.id}`}
                className="row-hover group flex h-12 items-center justify-between gap-3 px-4"
              >
                <span className="flex min-w-0 items-baseline gap-2.5">
                  <span className="truncate font-ui text-[15px] font-medium text-ink">
                    {poet.name}
                  </span>
                  <span className="shrink-0 font-ui text-[11.5px] text-ink-3">{poet.era.name}</span>
                </span>
                <ChevronLeftIcon
                  size={14}
                  className="shrink-0 text-ink-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
