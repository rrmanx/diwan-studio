import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api/client';
import { useAsync } from '../lib/use-async';
import { useTopbar } from '../components/app-shell';
import { EmptyState } from '../components/empty-state';
import { ErrorState } from '../components/error-state';
import { Pagination } from '../components/pagination';
import { PoemCard } from '../components/poem-card';
import { Skeleton } from '../components/skeleton';

export function PoetPage() {
  const { id = '' } = useParams();
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [id]);

  const poet = useAsync(() => api.getPoet(id), [id]);
  const poems = useAsync(() => api.listPoetPoems(id, { per_page: 20, page }), [id, page]);
  useTopbar(poet.data?.name);

  if (poet.loading || poems.loading) return <Skeleton rows={6} />;
  if (poet.error) {
    return (
      <ErrorState title="الشاعر غير موجود" message={poet.error} onRetry={poet.reload} />
    );
  }
  if (poems.error || !poet.data || !poems.data) {
    return <ErrorState message={poems.error ?? undefined} onRetry={poems.reload} />;
  }

  return (
    <div>
      <nav aria-label="مسار التنقل" className="font-ui mb-3 flex flex-wrap items-center gap-1.5 text-[12px] text-ink-3">
        <Link to="/poets" className="underline-offset-[6px] hover:text-accent hover:underline">
          الشعراء
        </Link>
        <span aria-hidden="true">/</span>
        <span>{poet.data.name}</span>
      </nav>

      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-rule pb-3">
        <span className="font-ui text-[12px] text-ink-3">{poet.data.era.name}</span>
        <span className="font-mono text-[11px] text-ink-3">
          {poems.data.meta.total} قصيدة
        </span>
      </div>

      {poems.data.data.length === 0 ? (
        <EmptyState message="لا توجد قصائد لهذا الشاعر في المعاينة." />
      ) : (
        <>
          <div className="panel">
            {poems.data.data.map((poem) => (
              <PoemCard key={poem.id} poem={poem} />
            ))}
          </div>
          <Pagination
            page={poems.data.meta.current_page}
            lastPage={poems.data.meta.last_page}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
