import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api/client';
import { formatCount } from '../lib/format';
import { useAsync } from '../lib/use-async';
import { useTopbar } from '../components/app-shell';
import { Button } from '../components/button';
import { EmptyState } from '../components/empty-state';
import { ErrorState } from '../components/error-state';
import { FilterSelect, FilterToolbar } from '../components/filter-toolbar';
import { ChevronLeftIcon } from '../components/icons';
import { Skeleton } from '../components/skeleton';

export function PoetsPage() {
  useTopbar('الشعراء');
  const [era, setEra] = useState<string | null>(null);
  const poets = useAsync(() => api.listPoets({ per_page: 50 }), []);
  const eras = useAsync(() => api.listEras(), []);

  const loading = poets.loading || eras.loading;
  const error = poets.error ?? eras.error;
  const all = poets.data?.data ?? [];
  const shown = era ? all.filter((poet) => poet.era.name === era) : all;

  return (
    <div>
      <FilterToolbar count={`${formatCount(shown.length)} شاعر`} label="تصفية الشعراء">
        <FilterSelect id="filter-era" label="تصفية حسب الفترة" value={era ?? ''} onChange={(value) => setEra(value || null)}>
          <option value="">كل الفترات</option>
          {(eras.data ?? []).map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </FilterSelect>
        {era && (
          <Button variant="ghost" size="sm" onClick={() => setEra(null)}>
            مسح
          </Button>
        )}
      </FilterToolbar>

      {loading ? (
        <Skeleton rows={8} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => { poets.reload(); eras.reload(); }} />
      ) : shown.length === 0 ? (
        <EmptyState message="لا يوجد شعراء في هذه الفترة." />
      ) : (
        <div className="panel">
          {shown.map((poet) => (
            <Link
              key={poet.id}
              to={`/poets/${poet.id}`}
              className="row-hover group flex min-h-[54px] items-center justify-between gap-3 border-b border-rule px-4 last:border-b-0"
            >
              <span className="min-w-0">
                <span className="block truncate font-ui text-[15px] font-medium leading-snug text-ink">
                  {poet.name}
                </span>
                <span className="mt-0.5 block font-ui text-[12px] leading-snug text-ink-3">
                  {poet.era.name}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                {poet.poem_count !== undefined && (
                  <span className="font-mono text-[11px] text-ink-3">{formatCount(poet.poem_count)}</span>
                )}
                <ChevronLeftIcon
                  size={14}
                  className="text-ink-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
