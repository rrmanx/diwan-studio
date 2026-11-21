import { useEffect, useRef, useState, type CSSProperties } from 'react';
import styles from './how-it-works.module.css';

const WIDTH = 920;
const LOOP = 12000;

type Template = 'classical' | 'editorial' | 'artistic';
type StaticStep = '1' | '2' | '3' | '4' | 'final';

interface View {
  at: number;
  cursor: readonly [number, number];
  press: boolean;
  selected: boolean;
  template: Template;
  toast: boolean;
  step: 1 | 2 | 3 | 4;
}

const AT = {
  home: [612, 24],
  poem: [800, 147],
  editorial: [801, 317],
  artistic: [744, 317],
  export: [828, 525],
  classical: [871, 317],
} as const;

// Each boundary is a committed action; CSS handles the 300–450ms easing between them.
const PHASES: View[] = [
  { at: 0, cursor: AT.home, press: false, selected: false, template: 'classical', toast: false, step: 1 },
  { at: 300, cursor: AT.poem, press: false, selected: false, template: 'classical', toast: false, step: 1 },
  { at: 760, cursor: AT.poem, press: true, selected: false, template: 'classical', toast: false, step: 1 },
  { at: 900, cursor: AT.poem, press: false, selected: true, template: 'classical', toast: false, step: 1 },
  { at: 3100, cursor: AT.editorial, press: false, selected: true, template: 'classical', toast: false, step: 1 },
  { at: 3560, cursor: AT.editorial, press: true, selected: true, template: 'classical', toast: false, step: 1 },
  { at: 3700, cursor: AT.editorial, press: false, selected: true, template: 'editorial', toast: false, step: 2 },
  { at: 6100, cursor: AT.artistic, press: false, selected: true, template: 'editorial', toast: false, step: 2 },
  { at: 6560, cursor: AT.artistic, press: true, selected: true, template: 'editorial', toast: false, step: 2 },
  { at: 6700, cursor: AT.artistic, press: false, selected: true, template: 'artistic', toast: false, step: 3 },
  { at: 9100, cursor: AT.export, press: false, selected: true, template: 'artistic', toast: false, step: 3 },
  { at: 9560, cursor: AT.export, press: true, selected: true, template: 'artistic', toast: false, step: 3 },
  { at: 9700, cursor: AT.export, press: false, selected: true, template: 'artistic', toast: true, step: 4 },
  { at: 10900, cursor: AT.classical, press: false, selected: true, template: 'artistic', toast: true, step: 4 },
  { at: 11360, cursor: AT.classical, press: true, selected: true, template: 'artistic', toast: true, step: 4 },
  { at: 11500, cursor: AT.home, press: false, selected: false, template: 'classical', toast: false, step: 4 },
];

const STATIC_VIEWS: Record<StaticStep, View> = {
  '1': { ...PHASES[3], at: 0 },
  '2': { ...PHASES[6], at: 0 },
  '3': { ...PHASES[9], at: 0 },
  '4': { ...PHASES[12], at: 0 },
  final: { ...PHASES[12], at: 0 },
};

const POEMS = [
  ['معلّقة امرئ القيس', '١'],
  ['قِفا نَبْكِ', '٢'],
  ['ديوان العرب', '٣'],
  ['مسوّدة بيت', '٤'],
] as const;

const CAPTIONS = ['1 اختر قصيدة', '2 اختر قالبًا', '3 اضبط الخط', '4 صدّر PNG'] as const;

function readStaticStep(): StaticStep | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('step');
  return raw === '1' || raw === '2' || raw === '3' || raw === '4' || raw === 'final' ? raw : null;
}

function Verse({ revealed, line }: { revealed: boolean; line: 1 | 2 }) {
  const content =
    line === 1 ? (
      <>قِفا <span className={styles.accent}>نَبْكِ</span> من ذِكرى حبيبٍ ومنزلِ</>
    ) : (
      <>بِسِقطِ اللِّوى بينَ الدَّخولِ فحَوْمَلِ</>
    );
  return (
    <div className={styles.verseLine} data-line={line} data-revealed={revealed}>
      <span className={styles.verseInner}>{content}</span>
    </div>
  );
}

export function HowItWorks() {
  const rootRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(false);
  const [scale, setScale] = useState(1);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [staticStep] = useState<StaticStep | null>(readStaticStep);
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => setScale(Math.min(1, root.clientWidth / WIDTH));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (staticStep || reduced) return;
    const root = rootRef.current;
    if (!root) return;

    const inView = new IntersectionObserver(
      ([entry]) => { activeRef.current = Boolean(entry?.isIntersecting); },
      { threshold: 0.2 },
    );
    inView.observe(root);

    let raf = 0;
    let last = 0;
    let elapsed = 0;
    let index = 0;
    const tick = (now: number) => {
      if (last && activeRef.current && !document.hidden) {
        elapsed = (elapsed + Math.min(now - last, 64)) % LOOP;
        let next = 0;
        for (let i = PHASES.length - 1; i >= 0; i -= 1) {
          if (elapsed >= PHASES[i].at) { next = i; break; }
        }
        if (next !== index) { index = next; setPhaseIndex(next); }
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { inView.disconnect(); cancelAnimationFrame(raf); };
  }, [staticStep, reduced]);

  const view: View = staticStep || reduced ? STATIC_VIEWS[staticStep ?? 'final'] : PHASES[phaseIndex];
  const style = {
    '--hiw-scale': scale,
    '--hiw-cx': `${view.cursor[0]}px`,
    '--hiw-cy': `${view.cursor[1]}px`,
  } as CSSProperties;

  return (
    <div ref={rootRef} className={styles.root} style={style}>
      <div className={styles.viewport}>
        <div
          className={styles.stage}
          role="img"
          aria-label="عرض توضيحي: من القصيدة إلى التصدير في أربع خطوات"
        >
          <div className={styles.bar}>
            <div className={styles.barGroup}>
              <span className={styles.barMarks} aria-hidden="true">
                <i className={styles.barMark} /><i className={styles.barMark} /><i className={styles.barMark} />
              </span>
              <span className={styles.barBrand}>الديوان · ستوديو</span>
              <span className={styles.barSep} aria-hidden="true" />
              <span className={styles.barMuted}>لوحة جديدة</span>
            </div>
            <div className={styles.barGroup}>
              <span className={styles.barMuted}>معاينة</span>
              <span>١٠٨٠ × ١٣٥٠</span>
            </div>
          </div>

          <div className={styles.body}>
            <div className={styles.rail}>
              <div className={styles.railBlock}>
                <p className={styles.railLabel}>القصائد</p>
                <div className={styles.poemList}>
                  {POEMS.map(([title, number], index) => (
                    <div
                      key={title}
                      className={styles.poemRow}
                      data-active={view.selected && index === 1}
                    >
                      <span className={styles.poemTitle}>{title}</span>
                      <span className={styles.poemMeta}>{number}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.railBlock}>
                <p className={styles.railLabel}>القالب</p>
                <div className={styles.chips}>
                  {([
                    ['classical', 'كلاسيكي'],
                    ['editorial', 'تحريري'],
                    ['artistic', 'فني'],
                  ] as const).map(([id, label]) => (
                    <span key={id} className={styles.chip} data-active={view.template === id}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.railBlock}>
                <p className={styles.railLabel}>الخط</p>
                <div className={styles.chips}>
                  <span className={`${styles.chip} ${styles.fontChip}`} data-active={view.template !== 'artistic'}>
                    أميري
                  </span>
                  <span className={`${styles.chip} ${styles.fontChip}`} data-active={view.template === 'artistic'}>
                    رقعة
                  </span>
                </div>
              </div>

              <div className={styles.exportBtn}>صدّر PNG</div>

              <div className={styles.toast} data-on={view.toast}>
                <i className={styles.toastMark} aria-hidden="true" />
                <span>صُدّر ١٠٨٠ × ١٣٥٠</span>
              </div>
            </div>

            <div className={styles.canvas}>
              <div className={styles.artboard} data-template={view.template}>
                <div className={styles.ground} data-on={view.template === 'classical'} />
                <div className={styles.ground} data-on={view.template === 'editorial'} />
                <div className={styles.ground} data-on={view.template === 'artistic'} />
                <div className={styles.frameBase} />
                <div className={styles.frameInner} />
                <div className={styles.goldRule} />

                <div className={styles.verseLayer} data-font="amiri" data-on={view.template !== 'artistic'}>
                  <Verse line={1} revealed={view.selected} />
                  <Verse line={2} revealed={view.selected} />
                </div>
                <div className={styles.verseLayer} data-font="aref" data-on={view.template === 'artistic'}>
                  <Verse line={1} revealed={view.selected} />
                  <Verse line={2} revealed={view.selected} />
                </div>
                <div className={styles.poet} data-revealed={view.selected}>
                  امرؤ القيس
                </div>
              </div>
            </div>
          </div>

          <div className={styles.cursor} data-press={view.press} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M1 1L1 11.3L4.1 8.4L6.2 13L8.2 12.1L6.1 7.6H11L1 1Z"
                fill="var(--ink)"
                stroke="var(--paper)"
                strokeWidth="0.9"
                strokeLinejoin="miter"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className={styles.captions}>
        {CAPTIONS.map((caption, index) => (
          <span key={caption} className={styles.caption} data-current={view.step === index + 1}>
            {caption}
          </span>
        ))}
      </div>
    </div>
  );
}
