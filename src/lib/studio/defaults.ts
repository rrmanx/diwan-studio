import type { Composition, TemplateId } from './types';

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const NIGHT_GROUND = '#14110D';
export const PAPER_GROUND = '#F4EEE3';

export const GROUND_SWATCHES = ['#F4EEE3', '#FBF7EF', '#EAE1D1', NIGHT_GROUND];
export const LIGHT_INKS = ['#171410', '#2B2620', '#4B4438'];
export const NIGHT_INKS = ['#F4EEE3', '#FBF7EF', '#EAE1D1'];
export const ACCENT_SWATCHES = ['#9C3A18', '#A98A3E', '#2F4A3E'];

export const TEMPLATE_LABELS: Record<TemplateId, string> = {
  classical: 'كلاسيكي',
  editorial: 'تحريري',
  artistic: 'فني',
};

export const TEMPLATE_DEFAULTS: Record<TemplateId, Partial<Composition>> = {
  classical: {
    font: 'amiri',
    ground: PAPER_GROUND,
    ink: '#171410',
    accent: '#9C3A18',
    frame: 'double',
    align: 'center',
  },
  editorial: {
    font: 'thmanyah-display',
    ground: '#FBF7EF',
    ink: '#171410',
    accent: '#9C3A18',
    frame: 'rule',
    align: 'start',
  },
  artistic: {
    font: 'aref',
    ground: NIGHT_GROUND,
    ink: PAPER_GROUND,
    accent: '#A98A3E',
    frame: 'rule',
    align: 'center',
  },
};

export function baseComposition(): Composition {
  return {
    ...TEMPLATE_DEFAULTS.classical,
    template: 'classical',
    size: 'square',
    scale: 1,
    leading: 1.9,
    showPoet: true,
    showSource: true,
    handle: '',
    verseIndexes: [],
  } as Composition;
}

const FONTS = new Set(['amiri', 'aref', 'kufi', 'thmanyah-display', 'thmanyah-text']);
const TEMPLATES = new Set(['classical', 'editorial', 'artistic']);
const SIZES = new Set(['square', 'portrait', 'story']);
const FRAMES = new Set(['none', 'rule', 'double', 'corners']);

/** Tolerates older or hand-edited session/localStorage records. */
export function sanitizeComposition(value: unknown): Composition {
  const base = baseComposition();
  if (!value || typeof value !== 'object') return base;
  const raw = value as Partial<Composition>;
  const template = TEMPLATES.has(String(raw.template)) ? raw.template! : base.template;
  const size = SIZES.has(String(raw.size)) ? raw.size! : base.size;
  const ground = typeof raw.ground === 'string' ? raw.ground : base.ground;
  const ink = typeof raw.ink === 'string' ? raw.ink : base.ink;
  return {
    template,
    size,
    font: FONTS.has(String(raw.font)) ? raw.font! : base.font,
    scale: clamp(Number(raw.scale) || base.scale, 0.8, 1.3),
    leading: clamp(Number(raw.leading) || base.leading, 1.7, 2.4),
    align: raw.align === 'start' ? 'start' : 'center',
    ground,
    ink,
    accent: typeof raw.accent === 'string' ? raw.accent : base.accent,
    frame: FRAMES.has(String(raw.frame)) ? raw.frame! : base.frame,
    showPoet: raw.showPoet !== false,
    showSource: raw.showSource !== false,
    handle: typeof raw.handle === 'string' ? raw.handle.slice(0, 24) : '',
    verseIndexes: Array.isArray(raw.verseIndexes)
      ? raw.verseIndexes.filter((index): index is number => Number.isInteger(index)).slice(0, 6)
      : [],
  };
}
