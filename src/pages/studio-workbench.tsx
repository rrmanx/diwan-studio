import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/button';
import { Chip } from '../components/chip';
import { ErrorState } from '../components/error-state';
import { Skeleton } from '../components/skeleton';
import { api } from '../lib/api/client';
import type { Poem, Quote } from '../lib/types';
import { errorMessage, useAsync } from '../lib/use-async';
import {
  ACCENT_SWATCHES,
  GROUND_SWATCHES,
  LIGHT_INKS,
  NIGHT_GROUND,
  NIGHT_INKS,
  TEMPLATE_DEFAULTS,
  TEMPLATE_LABELS,
  baseComposition,
  clamp,
  sanitizeComposition,
} from '../lib/studio/defaults';
import { exportPng } from '../lib/studio/export';
import { cssFamily, facesForComposition } from '../lib/studio/fonts';
import { linesFromText, linesFromVerses } from '../lib/studio/lines';
import { renderComposition } from '../lib/studio/render';
import { SIZE_IDS, SIZES } from '../lib/studio/sizes';
import type {
  Composition,
  FrameId,
  SizeId,
  StudioFontId,
  TemplateId,
  VerseLine,
} from '../lib/studio/types';

const SESSION_KEY = 'diwan:studio:current';
const DESIGNS_KEY = 'diwan:designs';
const MAX_VERSES = 6;

type SourceMode = 'diwan' | 'user';

interface SessionState {
  key: string;
  composition: Composition;
  userText: string;
  userTitle: string;
  sourceMode: SourceMode;
}

interface SavedDesign {
  id: string;
  savedAt: string;
  name: string;
  composition: Composition;
  lines: VerseLine[];
  title: string;
  poet: string;
  source: string;
  userText: string;
  userTitle: string;
  sourceMode: SourceMode;
}

interface SourceInfo {
  rows: VerseLine[];
  title: string;
  poet: string;
  source: string;
  rights: string;
  id: string;
  fixed: boolean;
}

type Loaded =
  | { kind: 'poem'; poem: Poem }
  | { kind: 'quote'; quote: Quote }
  | { kind: 'none' };

const FONT_CHIPS: { id: StudioFontId; label: string }[] = [
  { id: 'thmanyah-display', label: 'ثمانية ديسبلاي' },
  { id: 'thmanyah-text', label: 'ثمانية نصوص' },
  { id: 'amiri', label: 'أميري' },
  { id: 'aref', label: 'رقعة' },
];

const COLOR_NAMES: Record<string, string> = {
  '#F4EEE3': 'عاجي',
  '#FBF7EF': 'فاتح',
  '#EAE1D1': 'داكن',
  '#14110D': 'ليل',
  '#171410': 'أسود',
  '#2B2620': 'بني',
  '#4B4438': 'رمادي داكن',
  '#9C3A18': 'طيني',
  '#A98A3E': 'ذهبي',
  '#2F4A3E': 'أخضر',
};

const FRAME_OPTIONS: { id: FrameId; label: string }[] = [
  { id: 'none', label: 'بدون' },
  { id: 'rule', label: 'خط' },
  { id: 'double', label: 'مزدوج' },
  { id: 'corners', label: 'زوايا' },
];

function readSession(key: string): SessionState {
  const fresh: SessionState = {
    key,
    composition: baseComposition(),
    userText: '',
    userTitle: '',
    sourceMode: 'diwan',
  };
  if (typeof window === 'undefined') return fresh;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return fresh;
    const stored = JSON.parse(raw) as Partial<SessionState>;
    const composition = sanitizeComposition(stored.composition);
    if (stored.key !== key) composition.verseIndexes = [];
    return {
      key,
      composition,
      userText: typeof stored.userText === 'string' ? stored.userText : '',
      userTitle: typeof stored.userTitle === 'string' ? stored.userTitle : '',
      sourceMode: stored.sourceMode === 'user' ? 'user' : 'diwan',
    };
  } catch {
    return fresh;
  }
}

function readDesigns(): SavedDesign[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DESIGNS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
      .map((item): SavedDesign => ({
        id: String(item.id ?? crypto.randomUUID()),
        savedAt: String(item.savedAt ?? ''),
        name: String(item.name ?? 'تصميم بدون عنوان'),
        composition: sanitizeComposition(item.composition),
        lines: Array.isArray(item.lines) ? (item.lines as VerseLine[]) : [],
        title: String(item.title ?? ''),
        poet: String(item.poet ?? ''),
        source: String(item.source ?? ''),
        userText: String(item.userText ?? ''),
        userTitle: String(item.userTitle ?? ''),
        sourceMode: item.sourceMode === 'user' ? 'user' : 'diwan',
      }))
      .slice(0, 12);
  } catch {
    return [];
  }
}

function thumbnailSrc(design: SavedDesign): string {
  const svg = renderComposition({
    composition: { ...sanitizeComposition(design.composition), scale: 0.15 },
    lines: design.lines,
    title: design.title,
    poet: design.poet,
    source: design.source,
  });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function safeId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'user';
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="border-b border-rule px-5 py-5 last:border-b-0">
      <div className="mb-3">
        <h2 className="font-ui text-start text-[11px] tracking-[.14em] text-ink-3">{label}</h2>
        <div className="mt-3 h-px w-full bg-rule" aria-hidden="true" />
      </div>
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className = '',
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex overflow-hidden rounded-[2px] border border-rule ${className}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`font-ui h-9 flex-1 whitespace-nowrap border-s border-rule px-3 text-xs leading-none transition-colors duration-150 first:border-s-0 ${
              active ? 'bg-primary-bg text-primary-ink' : 'bg-transparent text-ink-2 hover:bg-hover hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function RangeControl({
  id,
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const filled = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="font-ui mb-1.5 flex items-center justify-between gap-3 text-xs text-ink-2">
        <label htmlFor={id} className="text-end">{label}</label>
        <span className="font-mono text-[11px] text-ink-3">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(event) => onChange(clamp(Number(event.target.value), min, max))}
        style={{ background: `linear-gradient(to left, var(--accent) ${filled}%, var(--rule) ${filled}%)` }}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[var(--accent)] [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-accent [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-accent"
      />
    </div>
  );
}

function Swatches({
  label,
  colors,
  value,
  onChange,
}: {
  label: string;
  colors: string[];
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="font-ui mb-2 text-end text-xs text-ink-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((color) => {
          const selected = value.toLowerCase() === color.toLowerCase();
          const name = COLOR_NAMES[color.toLowerCase()] ?? color;
          return (
            <button
              key={color}
              type="button"
              title={`${label}: ${name}`}
              aria-label={`${label}: ${name} (${color})`}
              aria-pressed={selected}
              onClick={() => onChange(color)}
              className={`h-7 w-7 rounded-[2px] border transition-none ${
                selected
                  ? 'border-focus ring-2 ring-focus ring-offset-1 ring-offset-rail-bg'
                  : 'border-rule'
              }`}
              style={{ backgroundColor: color }}
            >
              <span className="sr-only">{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="font-ui flex cursor-pointer items-center justify-between gap-3 py-1.5 text-sm text-ink">
      <span className="text-end">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[var(--ink)]"
      />
    </label>
  );
}

function useSourceInfo(data: Loaded | null, sourceMode: SourceMode, userText: string, userTitle: string): SourceInfo {
  return useMemo(() => {
    if (data?.kind === 'poem') {
      const poem = data.poem;
      return {
        rows: poem.verses?.length ? linesFromVerses(poem.verses) : linesFromText(poem.text),
        title: poem.title,
        poet: poem.poet.name,
        source: '',
        rights: poem.rights,
        id: String(poem.id),
        fixed: true,
      };
    }
    if (data?.kind === 'quote') {
      const quote = data.quote;
      return {
        rows: quote.text.trim() ? [[quote.text.trim()]] : [],
        title: quote.title,
        poet: quote.author.name,
        source: '',
        rights: quote.rights,
        id: String(quote.id),
        fixed: true,
      };
    }
    const rows = sourceMode === 'user' ? linesFromText(userText) : [];
    return {
      rows,
      title: sourceMode === 'user' ? userTitle : '',
      poet: '',
      source: '',
      rights: 'user',
      id: 'user',
      fixed: false,
    };
  }, [data, sourceMode, userText, userTitle]);
}

export function StudioWorkbench({ poemId, quoteId }: { poemId?: string; quoteId?: string }) {
  const storageKey = quoteId ? `quote:${quoteId}` : poemId ? `poem:${poemId}` : 'blank';
  const { data, loading, error, reload } = useAsync<Loaded>(() => {
    if (quoteId) return api.getQuote(quoteId).then((quote) => ({ kind: 'quote' as const, quote }));
    if (poemId) return api.getPoem(poemId).then((poem) => ({ kind: 'poem' as const, poem }));
    return Promise.resolve({ kind: 'none' as const });
  }, [poemId, quoteId]);

  const [initial] = useState(() => readSession(storageKey));
  const [loadedKey, setLoadedKey] = useState(storageKey);
  const [composition, setComposition] = useState<Composition>(initial.composition);
  const [userText, setUserText] = useState(initial.userText);
  const [userTitle, setUserTitle] = useState(initial.userTitle);
  const [sourceMode, setSourceMode] = useState<SourceMode>(initial.sourceMode);
  const [designs, setDesigns] = useState<SavedDesign[]>(readDesigns);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saveNote, setSaveNote] = useState('');
  const [exportError, setExportError] = useState('');

  const info = useSourceInfo(data, sourceMode, userText, userTitle);
  const size = SIZES[composition.size];
  const [fontEpoch, setFontEpoch] = useState(0);

  // Measurements taken before the web font arrives are stale; refit once it loads.
  useEffect(() => {
    let live = true;
    void Promise.all(
      facesForComposition(composition.font).map((face) =>
        document.fonts.load(`400 32px "${cssFamily(face)}"`, 'قِفا نَبْكِ'),
      ),
    )
      .then(() => { if (live) setFontEpoch((epoch) => epoch + 1); })
      .catch(() => { /* fallback metrics remain usable */ });
    return () => { live = false; };
  }, [composition.font]);

  useEffect(() => {
    if (loadedKey === storageKey) return;
    const next = readSession(storageKey);
    setComposition(next.composition);
    setUserText(next.userText);
    setUserTitle(next.userTitle);
    setSourceMode(next.sourceMode);
    setLoadedKey(storageKey);
  }, [storageKey, loadedKey]);

  useEffect(() => {
    if (loadedKey !== storageKey || typeof window === 'undefined') return;
    const state: SessionState = { key: storageKey, composition, userText, userTitle, sourceMode };
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    } catch {
      // Browsers in private mode may refuse storage; the editor still works.
    }
  }, [loadedKey, storageKey, composition, userText, userTitle, sourceMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(DESIGNS_KEY, JSON.stringify(designs));
    } catch {
      // A full or blocked localStorage must not stop the editor.
    }
  }, [designs]);

  useEffect(() => {
    if (info.rows.length === 0) return;
    setComposition((previous) => {
      const valid = previous.verseIndexes.filter((index) => index >= 0 && index < info.rows.length);
      if (valid.length) return previous;
      const defaults = Array.from({ length: Math.min(info.rows.length, MAX_VERSES) }, (_, index) => index);
      return { ...previous, verseIndexes: defaults };
    });
  }, [info.rows]);

  const selectedRows = useMemo(
    () =>
      composition.verseIndexes
        .filter((index) => Number.isInteger(index) && index >= 0 && index < info.rows.length)
        .slice(0, MAX_VERSES)
        .map((index) => info.rows[index]),
    [composition.verseIndexes, info.rows],
  );

  const svg = useMemo(
    () =>
      renderComposition({
        composition,
        lines: selectedRows,
        title: info.title,
        poet: info.poet,
        source: info.source,
      }),
    [composition, selectedRows, info.title, info.poet, info.source, fontEpoch],
  );

  const rightsBlocked = info.rights !== 'public-domain' && info.rights !== 'user';
  const canExport = !rightsBlocked && selectedRows.length > 0;
  const backTo = data?.kind === 'poem' ? `/poems/${data.poem.id}` : data?.kind === 'quote' ? '/quotes' : '/poems';

  const toggleVerse = (index: number) => {
    setComposition((previous) => {
      const selected = previous.verseIndexes.includes(index)
        ? previous.verseIndexes.filter((value) => value !== index)
        : previous.verseIndexes.length >= MAX_VERSES
          ? previous.verseIndexes
          : [...previous.verseIndexes, index].sort((a, b) => a - b);
      return { ...previous, verseIndexes: selected };
    });
  };

  const setTemplate = (template: TemplateId) =>
    setComposition((previous) => ({ ...previous, ...TEMPLATE_DEFAULTS[template], template }));

  const setGround = (ground: string) =>
    setComposition((previous) => {
      const wasNight = previous.ground === NIGHT_GROUND;
      const isNight = ground === NIGHT_GROUND;
      let ink = previous.ink;
      if (isNight && !wasNight && LIGHT_INKS.includes(ink)) ink = NIGHT_INKS[0];
      if (!isNight && wasNight && NIGHT_INKS.includes(ink)) ink = LIGHT_INKS[0];
      let accent = previous.accent;
      if (isNight && !wasNight && accent === '#9C3A18') accent = '#A98A3E';
      if (!isNight && wasNight && accent === '#A98A3E') accent = '#9C3A18';
      return { ...previous, ground, ink, accent };
    });

  const handleExport = async () => {
    if (!canExport) return;
    setExportError('');
    try {
      await exportPng(svg, size.width, size.height, `diwan-studio-${safeId(info.id)}-${composition.size}.png`);
    } catch (caught) {
      setExportError(errorMessage(caught));
    }
  };

  const saveDesign = () => {
    const design: SavedDesign = {
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      name: info.title || (info.poet ? `قصيدة ${info.poet}` : 'تصميم بدون عنوان'),
      composition,
      lines: selectedRows,
      title: info.title,
      poet: info.poet,
      source: info.source,
      userText,
      userTitle,
      sourceMode,
    };
    setDesigns((previous) => [design, ...previous].slice(0, 12));
    setSaveNote('تم حفظ التصميم.');
    window.setTimeout(() => setSaveNote(''), 2200);
  };

  const applyDesign = (design: SavedDesign) => {
    setComposition(sanitizeComposition(design.composition));
    setUserText(design.userText);
    setUserTitle(design.userTitle);
    if (!info.fixed) setSourceMode(design.sourceMode);
    setDrawerOpen(false);
  };

  if (loading) {
    return <div className="container-page py-14"><Skeleton rows={7} /></div>;
  }
  if (error) {
    return (
      <div className="container-page py-14">
        <ErrorState title="تعذّر فتح الاستوديو" message={error} onRetry={reload} />
      </div>
    );
  }

  const inkColors = composition.ground === NIGHT_GROUND ? NIGHT_INKS : LIGHT_INKS;
  const artboardMaxWidth = `min(100%, calc((100dvh - 260px) * ${(size.width / size.height).toFixed(4)}))`;

  return (
    <>
      <div className="sticky top-16 z-30 border-b border-rule bg-paper-raised/95 backdrop-blur-[8px]">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link to={backTo} className="font-ui shrink-0 text-sm text-ink-2 underline-offset-[6px] hover:text-accent hover:underline">
              رجوع
            </Link>
            <span className="h-6 w-px shrink-0 bg-rule" aria-hidden="true" />
            <h1 className="font-display min-w-0 max-w-[15rem] truncate text-[15px] text-ink" title={info.title}>
              {info.title || 'الاستوديو'}
            </h1>
            <span className="font-mono hidden shrink-0 text-[11px] text-ink-3 sm:inline">
              {size.width} × {size.height} · {TEMPLATE_LABELS[composition.template]}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              label="مقاس الصورة"
              value={composition.size}
              options={SIZE_IDS.map((id) => ({ value: id, label: SIZES[id].label }))}
              onChange={(value: SizeId) => setComposition((previous) => ({ ...previous, size: value }))}
            />
            <span className="h-6 w-px shrink-0 bg-rule" aria-hidden="true" />
            <Segmented
              label="قالب التصميم"
              value={composition.template}
              options={(Object.keys(TEMPLATE_LABELS) as TemplateId[]).map((id) => ({
                value: id,
                label: TEMPLATE_LABELS[id],
              }))}
              onChange={setTemplate}
            />
            <span className="h-6 w-px shrink-0 bg-rule" aria-hidden="true" />
            {rightsBlocked ? (
              <div className="group relative">
                <Button
                  disabled
                  ariaLabel="التصدير يحتاج إذن الديوان"
                  className="min-w-[13rem]"
                >
                  التصدير يحتاج إذن الديوان
                </Button>
                <Link
                  to="/api#rights"
                  className="font-ui absolute inset-x-0 top-full z-10 mt-1 border border-rule bg-paper-raised px-3 py-2 text-center text-xs text-ink opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
                >
                  راجع شروط الحقوق في API
                </Link>
              </div>
            ) : (
              <Button onClick={handleExport} disabled={!canExport} ariaLabel="صدّر PNG">
                صدّر PNG
              </Button>
            )}
          </div>
          {exportError && <p role="alert" className="font-ui w-full text-xs text-accent">{exportError}</p>}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        <section
          aria-label="معاينة التصميم"
          className="flex flex-1 items-center justify-center bg-stage-bg p-4 sm:p-8"
          style={{ minHeight: 'calc(100dvh - 220px)' }}
        >
          {info.rows.length === 0 ? (
            <div className="max-w-lg text-center">
              <p className="font-display text-2xl leading-normal text-ink">القصيدة هي الصفحة.</p>
              <p className="mt-2 text-sm leading-loose text-ink-2">اختر قصيدة من الديوان، أو ابدأ بنصّك.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button as="link" to="/poems">اختر قصيدة</Button>
                <Button variant="secondary" onClick={() => setSourceMode('user')}>اكتب نصًّا</Button>
              </div>
            </div>
          ) : (
            <div style={{ width: artboardMaxWidth }}>
              <div className="border border-rule bg-paper-raised shadow-[0_18px_44px_-22px_var(--overlay)]">
                {/* Inline so the loaded @font-face faces match the canvas measurement. */}
                <div
                  role="img"
                  aria-label="معاينة التصميم"
                  className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </div>
              <p className="mt-3 text-center font-mono text-[11px] tracking-[.12em] text-ink-3">
                {size.width} × {size.height} px
              </p>
            </div>
          )}
        </section>

        <aside
          aria-label="إعدادات التصميم"
          className="w-full shrink-0 border-t border-rule bg-rail-bg lg:w-[360px] lg:overflow-y-auto lg:border-t-0 lg:border-s lg:max-h-[calc(100dvh-128px)]"
        >
          <Section label="المصدر">
            {info.fixed ? (
              <p className="text-sm leading-relaxed text-ink-2">
                {data?.kind === 'quote' ? 'اقتباس من الديوان' : 'نصّ من الديوان'}
              </p>
            ) : (
              <>
                <Segmented
                  label="مصدر النص"
                  className="flex w-full"
                  value={sourceMode}
                  options={[
                    { value: 'diwan' as const, label: 'من الديوان' },
                    { value: 'user' as const, label: 'نصّي' },
                  ]}
                  onChange={setSourceMode}
                />
                {sourceMode === 'user' && (
                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <span className="font-ui mb-1.5 block text-xs text-ink-2">العنوان</span>
                      <input
                        type="text"
                        value={userTitle}
                        onChange={(event) => setUserTitle(event.target.value)}
                        placeholder="عنوان النص"
                        className="font-ui h-11 w-full rounded-[2px] border border-rule-strong bg-paper-raised px-3 text-sm text-ink placeholder:text-ink-3"
                      />
                    </label>
                    <label className="block">
                      <span className="font-ui mb-1.5 block text-xs text-ink-2">النص</span>
                      <textarea
                        value={userText}
                        onChange={(event) => setUserText(event.target.value)}
                        rows={4}
                        placeholder="اكتب بيتًا أو بيتين في كل سطر"
                        className="font-poem w-full rounded-[2px] border border-rule-strong bg-paper-raised px-3 py-2 text-base leading-loose text-ink placeholder:text-ink-3"
                      />
                    </label>
                  </div>
                )}
              </>
            )}
          </Section>

          <Section label="الأبيات">
            {info.rows.length === 0 ? (
              <p className="text-sm text-ink-3">لا توجد أبيات لاختيارها بعد.</p>
            ) : (
              <>
                <div className="max-h-56 overflow-y-auto border border-rule">
                  {info.rows.map((row, index) => {
                    const checked = composition.verseIndexes.includes(index);
                    const disabled = !checked && composition.verseIndexes.length >= MAX_VERSES;
                    return (
                      <label
                        key={index}
                        className={`flex min-w-0 items-start gap-3 border-b border-rule px-3 py-2 last:border-b-0 ${
                          disabled ? 'opacity-45' : 'cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleVerse(index)}
                          className="mt-1.5 h-4 w-4 shrink-0 accent-[var(--ink)]"
                        />
                        <span className="font-poem min-w-0 truncate text-[16px] leading-normal text-ink">
                          {row[0]}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="font-ui mt-3 flex items-center gap-4 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setComposition((previous) => ({
                        ...previous,
                        verseIndexes: Array.from({ length: Math.min(info.rows.length, MAX_VERSES) }, (_, i) => i),
                      }))
                    }
                    className="text-ink underline-offset-[5px] hover:text-accent hover:underline"
                  >
                    تحديد الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposition((previous) => ({ ...previous, verseIndexes: [] }))}
                    className="text-ink-2 underline-offset-[5px] hover:text-accent hover:underline"
                  >
                    مسح
                  </button>
                  <span className="text-ink-3">
                    {composition.verseIndexes.length}/{MAX_VERSES}
                  </span>
                </div>
                {composition.verseIndexes.length >= MAX_VERSES && info.rows.length > MAX_VERSES && (
                  <p className="font-ui mt-2 text-[11px] text-ink-3">اكتمل الحد الأقصى: ستة أبيات.</p>
                )}
              </>
            )}
          </Section>

          <Section label="الخط">
            <div className="flex flex-wrap gap-1.5">
              {FONT_CHIPS.map((font) => (
                <Chip
                  key={font.id}
                  active={composition.font === font.id}
                  onClick={() => setComposition((previous) => ({ ...previous, font: font.id }))}
                >
                  {font.label}
                </Chip>
              ))}
            </div>
            <div className="mt-5 space-y-4">
              <RangeControl
                id="studio-scale"
                label="الحجم"
                value={composition.scale}
                min={0.8}
                max={1.3}
                step={0.01}
                format={(value) => value.toFixed(2)}
                onChange={(scale) => setComposition((previous) => ({ ...previous, scale }))}
              />
              <RangeControl
                id="studio-leading"
                label="التباعد"
                value={composition.leading}
                min={1.7}
                max={2.4}
                step={0.05}
                format={(value) => value.toFixed(2)}
                onChange={(leading) => setComposition((previous) => ({ ...previous, leading }))}
              />
            </div>
            <div className="mt-5">
              <p className="font-ui mb-2 text-end text-xs text-ink-2">المحاذاة</p>
              <Segmented
                label="محاذاة النص"
                className="flex w-full"
                value={composition.align}
                options={[
                  { value: 'center' as const, label: 'وسط' },
                  { value: 'start' as const, label: 'بداية' },
                ]}
                onChange={(align) => setComposition((previous) => ({ ...previous, align }))}
              />
            </div>
          </Section>

          <Section label="اللوحة">
            <Swatches label="الورق" colors={GROUND_SWATCHES} value={composition.ground} onChange={setGround} />
            <Swatches
              label="الحبر"
              colors={inkColors}
              value={composition.ink}
              onChange={(ink) => setComposition((previous) => ({ ...previous, ink }))}
            />
            <Swatches
              label="اللون المميّز"
              colors={ACCENT_SWATCHES}
              value={composition.accent}
              onChange={(accent) => setComposition((previous) => ({ ...previous, accent }))}
            />
          </Section>

          <Section label="الإطار">
            <div className="flex flex-wrap gap-1.5">
              {FRAME_OPTIONS.map((frame) => (
                <Chip
                  key={frame.id}
                  active={composition.frame === frame.id}
                  onClick={() => setComposition((previous) => ({ ...previous, frame: frame.id }))}
                >
                  {frame.label}
                </Chip>
              ))}
            </div>
          </Section>

          <Section label="التوقيع">
            <ToggleRow
              label="اسم الشاعر"
              checked={composition.showPoet}
              onChange={(showPoet) => setComposition((previous) => ({ ...previous, showPoet }))}
            />
            <ToggleRow
              label="المصدر"
              checked={composition.showSource}
              onChange={(showSource) => setComposition((previous) => ({ ...previous, showSource }))}
            />
            <label className="mt-3 block">
              <span className="font-ui mb-1.5 block text-end text-xs text-ink-2">المعرّف</span>
              <input
                type="text"
                value={composition.handle}
                onChange={(event) =>
                  setComposition((previous) => ({
                    ...previous,
                    handle: event.target.value.replace(/[^A-Za-z0-9_.]/g, '').slice(0, 24),
                  }))
                }
                placeholder="@handle"
                maxLength={24}
                dir="ltr"
                className="font-mono h-11 w-full rounded-[2px] border border-rule-strong bg-paper-raised px-3 text-sm text-ink placeholder:text-ink-3"
              />
            </label>
          </Section>

          <div className="grid gap-3 px-5 py-5">
            <Button variant="secondary" className="w-full" onClick={saveDesign} disabled={info.rows.length === 0}>
              حفظ التصميم
            </Button>
            <Button variant="ghost" className="w-full border border-rule" onClick={() => setDrawerOpen(true)}>
              تصاميمي
            </Button>
            <span role="status" className="font-ui text-xs text-ink-3">{saveNote}</span>
          </div>
        </aside>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
          <button
            type="button"
            aria-label="إغلاق قائمة التصاميم"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-overlay"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="تصاميمي"
            className="relative h-full w-[min(420px,100vw)] overflow-y-auto border-s border-rule bg-paper-raised p-5"
          >
            <div className="flex items-center justify-between border-b border-rule pb-4">
              <h2 className="font-display text-xl text-ink">تصاميمي</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="font-ui text-sm text-ink-2 underline-offset-[5px] hover:text-accent hover:underline"
              >
                إغلاق
              </button>
            </div>
            {designs.length === 0 ? (
              <p className="mt-6 text-sm text-ink-3">لم تحفظ أي تصميم بعد.</p>
            ) : (
              <ul className="mt-5 space-y-5">
                {designs.map((design) => (
                  <li key={design.id} className="flex gap-4 border-b border-rule pb-5">
                    <img
                      src={thumbnailSrc(design)}
                      alt={`معاينة ${design.name}`}
                      width={108}
                      height={108}
                      className="h-24 w-24 shrink-0 border border-rule object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display truncate text-sm text-ink">{design.name}</p>
                      <p className="font-mono mt-1 text-[11px] text-ink-3">
                        {SIZES[design.composition.size]?.label ?? 'مربّع'} · {TEMPLATE_LABELS[design.composition.template] ?? 'كلاسيكي'}
                      </p>
                      <div className="font-ui mt-3 flex gap-4 text-xs">
                        <button
                          type="button"
                          onClick={() => applyDesign(design)}
                          className="text-ink underline-offset-[5px] hover:text-accent hover:underline"
                        >
                          تحميل
                        </button>
                        <button
                          type="button"
                          onClick={() => setDesigns((previous) => previous.filter((item) => item.id !== design.id))}
                          className="text-ink-2 underline-offset-[5px] hover:text-accent hover:underline"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
