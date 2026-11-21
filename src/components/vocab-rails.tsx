import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api/client';
import { useAsync } from '../lib/use-async';
import { Button } from './button';
import { Chip } from './chip';
import { ErrorState } from './error-state';
import { Skeleton } from './skeleton';

interface Rail {
  key: 'era' | 'meter' | 'rhyme';
  title: string;
  items: string[];
}

/** The home page stays scannable: the rest live behind the /poems toolbar. */
const VISIBLE = 8;

export function VocabRails({ title = 'الأروقة', hint }: { title?: string; hint?: string }) {
  const [params, setParams] = useSearchParams();
  const { data, error, loading, reload } = useAsync(async () => {
    const [eras, meters, rhymes] = await Promise.all([
      api.listEras(),
      api.listMeters(),
      api.listRhymes(),
    ]);
    return [
      { key: 'era', title: 'الفترات', items: eras.map((era) => era.name) },
      { key: 'meter', title: 'البحور', items: meters.map((meter) => meter.name) },
      { key: 'rhyme', title: 'القوافي', items: rhymes.map((rhyme) => rhyme.letter) },
    ] satisfies Rail[];
  }, []);

  const hasFilters = ['era', 'meter', 'rhyme'].some((key) => params.get(key));

  const clear = () => {
    const next = new URLSearchParams(params);
    for (const key of ['era', 'meter', 'rhyme']) next.delete(key);
    setParams(next);
  };

  if (loading) return <Skeleton rows={4} />;
  if (error || !data) return <ErrorState message={error ?? undefined} onRetry={reload} />;

  return (
    <section aria-label={title}>
      <div className="panel">
        <div className="panel-head">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-display text-[17px] font-normal leading-tight text-ink">{title}</h2>
            {hint && <span className="font-ui text-[11.5px] text-ink-3">{hint}</span>}
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clear}>
              مسح
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 divide-y divide-rule sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {data.map((rail) => (
            <div key={rail.key} className="min-w-0 p-3.5">
              <h3 className="micro-label mb-2.5">{rail.title}</h3>
              <div className="flex flex-wrap gap-1.5">
                {rail.items.slice(0, VISIBLE).map((item) => (
                  <Chip
                    key={item}
                    as="link"
                    to={`/poems?${rail.key}=${encodeURIComponent(item)}`}
                    ariaLabel={`تصفية القصائد: ${item}`}
                  >
                    {item}
                  </Chip>
                ))}
                {rail.items.length > VISIBLE && (
                  <Chip as="link" to="/poems" ariaLabel={`عرض كل ${rail.title}`}>
                    +{rail.items.length - VISIBLE}
                  </Chip>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
