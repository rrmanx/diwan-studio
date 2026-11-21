import { api } from '../lib/api/client';
import type { PoemSummary } from '../lib/types';
import { useAsync } from '../lib/use-async';
import { Button } from '../components/button';
import { EmptyState } from '../components/empty-state';
import { ErrorState } from '../components/error-state';
import { PoemBlock } from '../components/poem-block';
import { Skeleton } from '../components/skeleton';

type Candidate = PoemSummary & { verses?: string[][] };

export function HomeVerseCard() {
  const { data: poem, error, loading, reload } = useAsync(async () => {
    const page = await api.listPoems({ per_page: 6 });
    const items = page.data as Candidate[];
    return items.find((item) => (item.verses?.length ?? 0) >= 2) ?? items[0] ?? null;
  }, []);

  if (loading) {
    return (
      <section className="panel p-4">
        <Skeleton rows={5} />
      </section>
    );
  }
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!poem) return <EmptyState message="لا توجد قصائد في المعاينة." />;

  const body = poem.excerpt.replace(/\s*۞\s*/g, '\n');

  return (
    <section aria-label="بيت اليوم" className="panel flex h-full flex-col">
      <div className="panel-head">
        <span className="micro-label">بيت اليوم</span>
        <span className="font-mono text-[10px] text-ink-3">مختار</span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-[22px] font-normal leading-tight text-ink">
              {poem.title}
            </h2>
            <p className="mt-1 font-ui text-[12px] leading-snug text-ink-3">
              {poem.poet.name} · {poem.era.name}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button as="link" to={`/studio/${poem.id}`} size="sm">
              صمّم
            </Button>
            <Button as="link" to={`/poems/${poem.id}`} variant="ghost" size="sm">
              اقرأ
            </Button>
          </div>
        </div>

        <div className="mt-4 flex-1 border border-rule bg-paper px-4 py-5">
          <PoemBlock
            text={body}
            layout="hemistichs"
            verses={poem.verses?.slice(0, 2)}
            fontSize="24px"
            lineHeight="2"
          />
        </div>

        {(poem.meter || poem.rhyme) && (
          <p className="mt-3 font-mono text-[10.5px] text-ink-3">
            {[poem.meter, poem.rhyme].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </section>
  );
}
