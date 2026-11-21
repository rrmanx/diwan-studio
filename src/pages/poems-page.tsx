import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api/client';
import { useAsync } from '../lib/use-async';
import { useTopbar } from '../components/app-shell';
import { Button } from '../components/button';
import { EmptyState } from '../components/empty-state';
import { ErrorState } from '../components/error-state';
import { FilterSelect, FilterToolbar } from '../components/filter-toolbar';
import { Pagination } from '../components/pagination';
import { PoemCard } from '../components/poem-card';
import { Skeleton } from '../components/skeleton';

type FilterKey = 'era' | 'meter' | 'rhyme';

export function PoemsPage() {
  useTopbar('القصائد');
  const [params, setParams] = useSearchParams();
  const era = params.get('era') ?? '';
  const meter = params.get('meter') ?? '';
  const rhyme = params.get('rhyme') ?? '';
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [era, meter, rhyme]);

  const filters = {
    era_id: era || undefined,
    meter: meter || undefined,
    rhyme: rhyme || undefined,
  };
  const vocab = useAsync(async () => {
    const [eras, meters, rhymes] = await Promise.all([
      api.listEras(),
      api.listMeters(),
      api.listRhymes(),
    ]);
    return { eras, meters, rhymes };
  }, []);
  const list = useAsync(() => api.listPoems({ ...filters, page, per_page: 12 }), [era, meter, rhyme, page]);
  const count = useAsync(() => api.countPoems(filters), [era, meter, rhyme]);

  const setFilter = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };
  const clear = () => setParams(new URLSearchParams());
  const hasFilters = Boolean(era || meter || rhyme);
  const total = count.data?.count ?? list.data?.meta.total;

  return (
    <div>
      <FilterToolbar count={total !== undefined ? `${total} قصيدة` : '—'}>
        <FilterSelect id="filter-era" label="تصفية حسب الفترة" value={era} onChange={(value) => setFilter('era', value)}>
          <option value="">الفترة</option>
          {(vocab.data?.eras ?? []).map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect id="filter-meter" label="تصفية حسب البحر" value={meter} onChange={(value) => setFilter('meter', value)}>
          <option value="">البحر</option>
          {(vocab.data?.meters ?? []).map((item) => (
            <option key={item.name} value={item.name}>
              {item.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect id="filter-rhyme" label="تصفية حسب القافية" value={rhyme} onChange={(value) => setFilter('rhyme', value)}>
          <option value="">القافية</option>
          {(vocab.data?.rhymes ?? []).map((item) => (
            <option key={item.letter} value={item.letter}>
              {item.letter}
            </option>
          ))}
        </FilterSelect>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clear}>
            مسح
          </Button>
        )}
      </FilterToolbar>

      {vocab.error && <ErrorState message={vocab.error} onRetry={vocab.reload} />}

      {list.loading || count.loading ? (
        <Skeleton rows={7} />
      ) : list.error || !list.data ? (
        <ErrorState message={list.error ?? undefined} onRetry={list.reload} />
      ) : list.data.data.length === 0 ? (
        <EmptyState message="لا توجد قصائد بهذه التصفية. جرّب فترة أو بحرًا آخر." />
      ) : (
        <>
          <div className="panel">
            {list.data.data.map((poem) => (
              <PoemCard key={poem.id} poem={poem} />
            ))}
          </div>
          <Pagination page={list.data.meta.current_page} lastPage={list.data.meta.last_page} onChange={setPage} />
        </>
      )}
    </div>
  );
}
