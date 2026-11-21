import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api/client';
import { useAsync } from '../lib/use-async';
import { useTopbar } from '../components/app-shell';
import { Button } from '../components/button';
import { ErrorState } from '../components/error-state';
import { MetaRow } from '../components/meta-row';
import { PoemBlock } from '../components/poem-block';
import { recordRecent } from '../components/recents';
import { Skeleton } from '../components/skeleton';
import { Toast } from '../components/toast';

export function PoemPage() {
  const { id = '' } = useParams();
  const { data: poem, error, loading, reload } = useAsync(() => api.getPoem(id), [id]);
  const [toast, setToast] = useState<string | null>(null);
  const mounted = useRef(true);
  useTopbar(poem?.title);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!poem) return;
    recordRecent({
      href: `/poems/${poem.id}`,
      title: poem.title,
      meta: `${poem.poet.name} · ${poem.era.name}`,
    });
  }, [poem]);

  const show = (message: string) => {
    setToast(message);
    window.setTimeout(() => {
      if (mounted.current) setToast(null);
    }, 2200);
  };

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (mounted.current) show(message);
    } catch {
      if (mounted.current) show('تعذّر النسخ. تحقّق من أذونات المتصفح.');
    }
  };

  if (loading) return <Skeleton rows={7} />;
  if (error || !poem) {
    const missing = error !== null && /not found/i.test(error);
    return (
      <ErrorState
        title="القصيدة غير موجودة"
        message={
          missing
            ? 'لم نجد هذه القصيدة في الديوان. تحقّق من الرابط أو ابدأ من فهرس القصائد.'
            : (error ?? undefined)
        }
        onRetry={error && !missing ? reload : undefined}
      />
    );
  }

  const rightsLine =
    poem.source === 'live'
      ? 'المصدر: الديوان API'
      : 'نصّ تراثي من الملك العام — بيانات معاينة';

  return (
    <>
      <div className="poem-actions">
        <Button as="link" to={`/studio/${poem.id}`} size="sm">
          صمّم
        </Button>
        <Button variant="secondary" size="sm" onClick={() => copy(poem.text, 'تم نسخ النص.')}>
          انسخ النص
        </Button>
        <Button variant="ghost" size="sm" onClick={() => copy(window.location.href, 'تم نسخ رابط القصيدة.')}>
          شارك
        </Button>
      </div>

      <article>
        <nav aria-label="مسار التنقل" className="font-ui mb-3 flex flex-wrap items-center gap-1.5 text-[12px] text-ink-3">
          <Link to="/poets" className="underline-offset-[6px] hover:text-accent hover:underline">
            الشعراء
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            to={`/poets/${poem.poet.id}`}
            className="underline-offset-[6px] hover:text-accent hover:underline"
          >
            {poem.poet.name}
          </Link>
          <span aria-hidden="true">/</span>
          <span>{poem.title}</span>
        </nav>

        <header className="mb-6 border-b border-rule pb-4">
          <h2 className="font-display text-[24px] font-normal leading-tight text-ink">{poem.title}</h2>
          <div className="mt-2">
            <MetaRow
              poet={poem.poet.name}
              poetHref={`/poets/${poem.poet.id}`}
              era={poem.era.name}
              meter={poem.meter}
              rhyme={poem.rhyme}
              className="text-[12px]"
            />
          </div>
        </header>

        <div className="reading-column mx-auto py-1">
          <PoemBlock
            text={poem.text}
            layout={poem.display_layout}
            verses={poem.verses}
            fontSize="clamp(21px, 2vw, 26px)"
            lineHeight="2.05"
          />
          <div className="mt-10 border-t border-rule pt-3 font-mono text-[11px] text-ink-3">
            ورقة {poem.id}
          </div>
        </div>

        <footer className="mt-10 border-t border-rule pt-4 text-[12.5px] text-ink-2">
          <p className="m-0">{poem.attribution.text}</p>
          <div className="font-ui mt-2 flex flex-wrap gap-x-5 gap-y-1">
            <a
              href={poem.attribution.url}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-[6px] hover:text-accent hover:underline"
            >
              المصدر
            </a>
            <span className="text-ink-3">{rightsLine}</span>
          </div>
        </footer>
      </article>
      <Toast message={toast} />
    </>
  );
}
