import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api/client';
import { formatCount } from '../lib/format';
import { linesFromText, linesFromVerses } from '../lib/studio/lines';
import { measureWithFont } from '../lib/studio/measure';
import type { VerseLine } from '../lib/studio/types';
import type { PoemSummary } from '../lib/types';
import { useAsync } from '../lib/use-async';
import { Button } from '../components/button';
import { EmptyState } from '../components/empty-state';
import { ErrorState } from '../components/error-state';
import { Skeleton } from '../components/skeleton';

type Candidate = PoemSummary & { verses?: string[][] };

const MAX_SIZE = 26;
const MIN_SIZE = 15;
const SINGLE_FLOOR = 17;
const NUMBER_WIDTH = 28;
const NUMBER_GAP = 12;
const COLUMN_GAP = 20;

function widestHemistich(rows: VerseLine[], size: number): number {
  const font = `400 ${size}px "Amiri"`;
  return rows.reduce(
    (longest, row) => Math.max(longest, ...row.map((part) => measureWithFont(part, font, size))),
    0,
  );
}

function fitSize(rows: VerseLine[], width: number, single: boolean): number {
  const column = (width - NUMBER_WIDTH - NUMBER_GAP - (single ? 0 : COLUMN_GAP)) / (single ? 1 : 2);
  let size = MAX_SIZE;
  while (size > MIN_SIZE && widestHemistich(rows, size) > column * 0.96) size -= 1;
  return size;
}

function fittedLayout(rows: VerseLine[], width: number): { size: number; single: boolean } {
  if (width <= 0 || rows.length === 0) return { size: MAX_SIZE, single: false };
  const size = fitSize(rows, width, false);
  if (size < SINGLE_FLOOR) return { size: Math.max(SINGLE_FLOOR, fitSize(rows, width, true)), single: true };
  return { size, single: false };
}

function FittedBayt({ text, verses }: { text: string; verses?: string[][] }) {
  const rows = useMemo<VerseLine[]>(
    () => (verses?.length ? linesFromVerses(verses) : linesFromText(text)).filter((row) => row.length > 0).slice(0, 2),
    [text, verses],
  );
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [, setFontEpoch] = useState(0); // refit once the web font changes the metrics
  const { size, single } = fittedLayout(rows, width);

  useLayoutEffect(() => {
    const node = box.current;
    if (!node) return;
    const measure = () => setWidth(Math.round(node.getBoundingClientRect().width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    let live = true;
    void document.fonts.ready.then(() => { if (live) setFontEpoch((epoch) => epoch + 1); });
    return () => { live = false; };
  }, []);

  return (
    <div ref={box} className="font-poem text-ink" style={{ fontSize: `${size}px`, lineHeight: single ? 1.85 : 2 }} dir="rtl">
      {rows.map((row, index) => (
        <div key={index} className="flex items-start gap-3">
          <span className="w-7 shrink-0 text-right font-mono text-[11px] leading-[2.2] text-ink-3" aria-hidden="true">
            {formatCount(index + 1)}
          </span>
          {single ? (
            <div className="min-w-0 flex-1">
              <div className="whitespace-nowrap text-right">{row[0]}</div>
              {row[1] && <div className="whitespace-nowrap text-right">{row[1]}</div>}
            </div>
          ) : (
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-5">
              <span className="whitespace-nowrap text-right">{row[0]}</span>
              <span className="whitespace-nowrap text-right">{row[1] ?? ''}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

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
          <FittedBayt text={body} verses={poem.verses} />
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
