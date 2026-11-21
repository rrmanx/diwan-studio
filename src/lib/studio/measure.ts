/** Canvas-based text width, shared by the renderer's fit pass and its dev assertion. */

let context: CanvasRenderingContext2D | null | undefined;
const widths = new Map<string, number>();
const requested = new Set<string>();

const fallback = (text: string, size: number): number => Array.from(text).length * size * 0.6;

/** The one font string used for both measurement and SVG rendering. */
export function bodyFontString(weight: number, size: number, cssFamily: string): string {
  return `${weight} ${size}px "${cssFamily}"`;
}

function contextFor(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (context === undefined) context = document.createElement('canvas').getContext('2d');
  return context;
}

function requestFont(font: string, text: string): void {
  if (typeof document === 'undefined' || requested.has(font)) return;
  requested.add(font);
  void document.fonts.load(font, text || 'ا').then(() => {
    // A loaded face changes glyph widths; drop every measurement made with it.
    for (const key of widths.keys()) {
      if (key.startsWith(`${font}\u0000`)) widths.delete(key);
    }
  });
}

export function measureWithFont(text: string, font: string, size: number): number {
  const key = `${font}\u0000${text}`;
  const cached = widths.get(key);
  if (cached !== undefined) return cached;
  requestFont(font, text);
  const ctx = contextFor();
  if (!ctx) return fallback(text, size);
  // RTL must match the `<text direction="rtl">` nodes in the rendered SVG.
  ctx.direction = 'rtl';
  ctx.font = font;
  const width = ctx.measureText(text).width;
  widths.set(key, width);
  return width;
}

/** Kept for callers that only have a legacy CSS font shorthand. */
export function measureText(text: string, fontCss: string, size: number): number {
  const font = fontCss.includes('px') ? fontCss : `${size}px ${fontCss}`;
  return measureWithFont(text, font, size);
}
