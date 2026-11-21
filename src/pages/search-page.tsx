import { Link, useSearchParams } from 'react-router-dom';
import { api, type SearchType } from '../lib/api/client';
import { formatCount } from '../lib/format';
import { useAsync } from '../lib/use-async';
import { useTopbar } from '../components/app-shell';
import { EmptyState } from '../components/empty-state';
import { ErrorState } from '../components/error-state';
import { FilterToolbar } from '../components/filter-toolbar';
import { ChevronLeftIcon } from '../components/icons';
import { PoemCard } from '../components/poem-card';
import { SearchBox } from '../components/search-box';
import { Skeleton } from '../components/skeleton';
import { VocabRails } from '../components/vocab-rails';

const TYPES: { value: SearchType; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'poems', label: 'قصائد' },
  { value: 'poets', label: 'شعراء' },
];

export function SearchPage() {
  useTopbar('البحث');
  const [params, setParams] = useSearchParams();
  const query = params.get('q')?.trim() ?? '';
  const rawType = params.get('type');
  const type: SearchType = rawType === 'poems' || rawType === 'poets' ? rawType : 'all';

  const update = (next: { q?: string; type?: SearchType }) => {
    const updated = new URLSearchParams(params);
    if (next.q !== undefined) {
      if (next.q) updated.set('q', next.q);
      else updated.delete('q');
    }
    if (next.type !== undefined) {
      if (next.type === 'all') updated.delete('type');
      else updated.set('type', next.type);
    }
    setParams(updated);
  };

  const { data, error, loading, reload } = useAsync(
    async () => (query ? api.search(query, { type }) : null),
    [query, type],
  );

  const resultCount = data ? data.poems.length + data.poets.length : 0;

  return (
    <div>
      <div className="mb-4 max-w-2xl">
        <SearchBox initialQuery={query} onSubmit={(value) => update({ q: value })} />
      </div>

      {!query ? (
        <VocabRails hint="ابدأ باسم قصيدة أو شاعر، أو اختر مدخلًا من الأروقة." />
      ) : loading ? (
        <Skeleton rows={6} />
      ) : error || !data ? (
        <ErrorState message={error ?? undefined} onRetry={reload} />
      ) : (
        <>
          <FilterToolbar count={`${formatCount(resultCount)} نتيجة عن «${query}»`} label="نوع النتائج">
            {TYPES.map((item) => (
              <button
                key={item.value}
                type="button"
                className="segment-btn"
                data-active={type === item.value || undefined}
                aria-pressed={type === item.value}
                onClick={() => update({ type: item.value })}
              >
                {item.label}
              </button>
            ))}
          </FilterToolbar>

          {resultCount === 0 ? (
            <EmptyState action={{ to: '/poems', label: 'ابدأ من الأروقة' }} />
          ) : (
            <div className="space-y-4">
              {data.poems.length > 0 && (
                <section aria-label="القصائد المطابقة">
                  <div className="panel">
                    {data.poems.map((poem) => (
                      <PoemCard key={poem.id} poem={poem} />
                    ))}
                  </div>
                </section>
              )}

              {data.poets.length > 0 && (
                <section aria-label="الشعراء المطابقون">
                  <div className="panel">
                    {data.poets.map((poet) => (
                      <Link
                        key={poet.id}
                        to={`/poets/${poet.id}`}
                        className="row-hover group flex min-h-[54px] items-center justify-between gap-3 border-b border-rule px-4 last:border-b-0"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-ui text-[15px] font-medium text-ink">
                            {poet.name}
                          </span>
                          <span className="mt-0.5 block font-ui text-[12px] text-ink-3">
                            {poet.era.name}
                          </span>
                        </span>
                        <ChevronLeftIcon
                          size={14}
                          className="shrink-0 text-ink-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                        />
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
