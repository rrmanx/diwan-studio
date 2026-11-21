import { clamp } from './defaults';
import { FONT_FAMILIES, cssFamily, facesForComposition, type FaceId } from './fonts';
import { bodyFontString, measureWithFont } from './measure';
import { artboardSize } from './sizes';
import type { Composition, TemplateId, VerseLine } from './types';

export interface RenderCompositionInput {
  composition: Composition;
  lines: VerseLine[];
  title?: string;
  poet?: string;
  source?: string;
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const num = (value: number): string => String(Math.round(value * 100) / 100);

interface TextOptions {
  size: number;
  family: string;
  fill: string;
  anchor?: 'start' | 'middle' | 'end';
  opacity?: number;
  weight?: number;
  accent?: string;
}

function textNode(value: string, x: number, y: number, options: TextOptions): string {
  const { size, family, fill, anchor = 'middle', opacity = 1, weight } = options;
  const attributes = [
    `x="${num(x)}"`,
    `y="${num(y)}"`,
    `text-anchor="${anchor}"`,
    'direction="rtl"',
    `font-family="${escapeXml(family)}"`,
    `font-size="${num(size)}"`,
    `fill="${escapeXml(fill)}"`,
    `opacity="${num(opacity)}"`,
    'xml:space="preserve"',
  ];
  if (weight) attributes.push(`font-weight="${weight}"`);
  return `<text ${attributes.join(' ')}>${escapeXml(value)}</text>`;
}

const unescapeXml = (value: string): string =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

/** Dev-only audit: an end/start pair around the centre must fit inside both margins. */
function assertPairFit(svg: string, width: number, height: number, margin: number, gutter: number): void {
  const byBaseline = new Map<string, { x: number; anchor: string; font: string; size: number; text: string }[]>();
  const textPattern = /<text\s+([^>]+)>([\s\S]*?)<\/text>/g;
  let match: RegExpExecArray | null;
  while ((match = textPattern.exec(svg))) {
    const attrs = match[1];
    const attr = (name: string): string | undefined =>
      attrs.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
    const anchor = attr('text-anchor');
    const y = attr('y');
    if ((anchor !== 'end' && anchor !== 'start') || !y) continue;
    const x = Number(attr('x'));
    if (Math.abs(x - width / 2) > gutter * 2) continue;
    const family = unescapeXml(attr('font-family') ?? 'serif');
    const size = Number(attr('font-size'));
    const weight = Number(attr('font-weight') ?? 400);
    const font = `${weight} ${size}px ${family}`;
    const text = unescapeXml(match[2].replace(/<[^>]+>/g, ''));
    const group = byBaseline.get(y) ?? [];
    group.push({ x, anchor, font, size, text });
    byBaseline.set(y, group);
  }
  const limit = width - 2 * margin;
  const center = width / 2;
  for (const group of byBaseline.values()) {
    const sadr = group.find((node) => node.anchor === 'end' && node.x > center);
    const ajuz = group.find((node) => node.anchor === 'start' && node.x < center);
    if (!sadr || !ajuz) continue;
    const sum =
      measureWithFont(sadr.text, sadr.font, sadr.size) +
      measureWithFont(ajuz.text, ajuz.font, ajuz.size);
    console.assert(
      sum <= limit,
      `[studio] hemistich pair overflows its columns at ${height}px: ${Math.round(sum)} > ${Math.round(limit)}`,
    );
  }
}

/** Editorial's one focal word; every other word keeps the ink colour. */
function accentedTextNode(value: string, x: number, y: number, options: TextOptions): string {
  const accent = options.accent ?? options.fill;
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return textNode(value, x, y, options);
  const first = words.shift()!;
  const rest = words.length ? ` ${words.join(' ')}` : '';
  const attributes = [
    `x="${num(x)}"`,
    `y="${num(y)}"`,
    `text-anchor="${options.anchor ?? 'middle'}"`,
    'direction="rtl"',
    `font-family="${escapeXml(options.family)}"`,
    `font-size="${num(options.size)}"`,
    `fill="${escapeXml(options.fill)}"`,
    'xml:space="preserve"',
  ];
  if (options.weight) attributes.push(`font-weight="${options.weight}"`);
  const tail = rest ? `<tspan>${escapeXml(rest)}</tspan>` : '';
  return `<text ${attributes.join(' ')}><tspan fill="${escapeXml(accent)}">${escapeXml(first)}</tspan>${tail}</text>`;
}

interface TemplateStyle {
  titleRatio: number;
  poetRatio: number;
  titleGap: number;
  poetGap: number;
  poetGold: boolean;
}

const STYLE: Record<TemplateId, TemplateStyle> = {
  classical: { titleRatio: 0.66, poetRatio: 0.4, titleGap: 0.35, poetGap: 1.4, poetGold: false },
  editorial: { titleRatio: 1.05, poetRatio: 1.5, titleGap: 0.4, poetGap: 0.7, poetGold: false },
  artistic: { titleRatio: 0.52, poetRatio: 0.42, titleGap: 0.5, poetGap: 0.95, poetGold: true },
};

function frameLayer(
  composition: Composition,
  width: number,
  height: number,
  inset: number,
  insetTwo: number,
  gold: string,
): string {
  const artistic = composition.template === 'artistic';
  const stroke = artistic ? gold : composition.ink;
  const rect = (value: number, color: string, opacity = 1): string =>
    `<rect x="${num(value)}" y="${num(value)}" width="${num(width - value * 2)}" height="${num(height - value * 2)}" fill="none" stroke="${escapeXml(color)}" stroke-width="1" opacity="${opacity}"/>`;
  const parts: string[] = [];

  if (artistic) {
    if (composition.frame === 'double') {
      parts.push(rect(inset, stroke), rect(insetTwo, stroke, 0.6));
    } else if (composition.frame === 'corners') {
      const right = width - inset;
      const bottom = height - inset;
      const length = 28;
      const marks = [
        `M ${num(right - length)} ${num(inset)} H ${num(right)} V ${num(inset + length)}`,
        `M ${num(inset + length)} ${num(inset)} H ${num(inset)} V ${num(inset + length)}`,
        `M ${num(right)} ${num(bottom - length)} V ${num(bottom)} H ${num(right - length)}`,
        `M ${num(inset)} ${num(bottom - length)} V ${num(bottom)} H ${num(inset + length)}`,
      ];
      parts.push(
        rect(inset, stroke),
        ...marks.map(
          (path) =>
            `<path d="${path}" fill="none" stroke="${escapeXml(stroke)}" stroke-width="1" opacity="0.8"/>`,
        ),
      );
    } else {
      parts.push(rect(inset, stroke));
    }
    parts.push(
      `<rect x="${num(inset)}" y="${num(inset)}" width="${num(Math.min(58, width * 0.06))}" height="3" fill="${escapeXml(composition.accent)}"/>`,
    );
    return parts.join('');
  }

  switch (composition.frame) {
    case 'none':
      break;
    case 'rule':
      parts.push(rect(inset, stroke));
      break;
    case 'double':
      parts.push(rect(inset, stroke), rect(insetTwo, stroke, 0.65));
      break;
    case 'corners': {
      const right = width - inset;
      const bottom = height - inset;
      const length = 28;
      const marks = [
        `M ${num(right - length)} ${num(inset)} H ${num(right)} V ${num(inset + length)}`,
        `M ${num(inset + length)} ${num(inset)} H ${num(inset)} V ${num(inset + length)}`,
        `M ${num(right)} ${num(bottom - length)} V ${num(bottom)} H ${num(right - length)}`,
        `M ${num(inset)} ${num(bottom - length)} V ${num(bottom)} H ${num(inset + length)}`,
      ];
      parts.push(
        ...marks.map(
          (path) =>
            `<path d="${path}" fill="none" stroke="${escapeXml(stroke)}" stroke-width="1" opacity="0.8"/>`,
        ),
      );
      break;
    }
  }
  return parts.join('');
}

export function renderComposition({
  composition,
  lines,
  title = '',
  poet = '',
  source = '',
}: RenderCompositionInput): string {
  const { width, height } = artboardSize(composition.size);
  const short = Math.min(width, height);
  const inset = short * 0.045;
  const insetTwo = short * 0.052;
  const margin = Math.max(short * 0.105, inset + 30);
  const gutter = 48 * (short / 1080);
  const columnWidth = (width - 2 * margin - gutter) / 2;
  const style = STYLE[composition.template];
  const face: FaceId = composition.font;
  const bodyFamily = `"${cssFamily(face)}"`;
  const bodyWeight = 400;
  const displayFamily = FONT_FAMILIES['thmanyah-display'];
  const textFamily = FONT_FAMILIES['thmanyah-text'];
  const gold = '#A98A3E';

  const rows: VerseLine[] = lines
    .map((line) => line.filter((part) => part.trim() !== ''))
    .filter((line) => line.length > 0);
  const bodyScale = clamp(composition.scale, 0.8, 1.3);
  const leading = clamp(composition.leading, 1.7, 2.4);
  const headerFor = (size: number): number => {
    let total = 0;
    if (title.trim()) total += size * style.titleRatio * 1.25 + size * style.titleGap;
    if (poet.trim() && composition.showPoet) {
      total += size * style.poetRatio * 1.25 + size * style.poetGap;
    }
    return total;
  };
  const usableTop = Math.max(inset + 30, short * 0.1);
  const usableBottom = height - Math.max(inset + 58, short * 0.1);
  const availableHeight = usableBottom - usableTop;

  const measureAt = (text: string, size: number): number =>
    measureWithFont(text, bodyFontString(bodyWeight, size, cssFamily(face)), size);
  const longestAt = (size: number): number =>
    rows.reduce((longest, row) => Math.max(longest, ...row.map((part) => measureAt(part, size))), 0);
  const blockHeightAt = (size: number): number =>
    headerFor(size) + Math.max(0, rows.length - 1) * size * leading + size * 1.3;

  let bodySize = Math.round(46 * bodyScale * 10) / 10;
  const minSize = 15;
  let longest = longestAt(bodySize);
  while ((longest > columnWidth * 0.96 || blockHeightAt(bodySize) > availableHeight) && bodySize > minSize) {
    bodySize = Math.round(bodySize * 0.94 * 10) / 10;
    longest = longestAt(bodySize);
  }
  // Final guard: every line must fit the column at the size we actually render.
  longest = longestAt(bodySize);
  if (longest > columnWidth && bodySize > minSize) {
    bodySize = Math.round(bodySize * 0.9 * 10) / 10;
    longest = longestAt(bodySize);
  }
  if (longest > columnWidth * 0.96) {
    console.warn(
      `[studio] longest hemistich ${Math.round(longest)}px exceeds ${Math.round(columnWidth * 0.96)}px at ${bodySize}px; clipping at 0.96.`,
    );
  }

  const lineHeight = bodySize * leading;
  const blockHeight = blockHeightAt(bodySize);
  let cursor = Math.max(usableTop, (usableTop + usableBottom - blockHeight) / 2);
  const headingAnchor = composition.align === 'start' ? 'start' : 'middle';
  const headingX = composition.align === 'start' ? width - margin : width / 2;
  const parts: string[] = [];

  if (title.trim()) {
    parts.push(
      textNode(title.trim(), headingX, cursor + bodySize * style.titleRatio * 0.95, {
        size: bodySize * style.titleRatio,
        family: displayFamily,
        fill: composition.template === 'artistic' ? composition.accent : composition.ink,
        anchor: headingAnchor,
        weight: 500,
      }),
    );
    cursor += bodySize * style.titleRatio * 1.25 + bodySize * style.titleGap;
  }

  if (poet.trim() && composition.showPoet) {
    const poetSize = bodySize * style.poetRatio;
    parts.push(
      textNode(poet.trim(), headingX, cursor + poetSize * 0.95, {
        size: poetSize,
        family: displayFamily,
        fill: style.poetGold ? composition.accent : composition.ink,
        anchor: headingAnchor,
        opacity: style.poetGold ? 0.95 : 0.85,
      }),
    );
    cursor += poetSize * 1.25 + bodySize * style.poetGap;
  }

  const blockStart = cursor;
  // RTL SVG anchors open inward-to-outward: `end` grows right, `start` grows left.
  // Placing the sadr just right of the gutter keeps it in the right-hand column.
  const sadrX = width / 2 + gutter / 2;
  const ajuzX = width / 2 - gutter / 2;
  let accentUsed = false;
  rows.forEach((row, rowIndex) => {
    const baseline = cursor + rowIndex * lineHeight + bodySize * 0.85;
    if (row.length > 1) {
      const sadrOptions: TextOptions = {
        size: bodySize,
        family: bodyFamily,
        fill: composition.ink,
        anchor: 'end',
        weight: bodyWeight,
      };
      const accentFirst = composition.template === 'editorial' && rowIndex === 0 && !accentUsed;
      parts.push(
        accentFirst
          ? accentedTextNode(row[0], sadrX, baseline, { ...sadrOptions, accent: composition.accent })
          : textNode(row[0], sadrX, baseline, sadrOptions),
        textNode(row[1], ajuzX, baseline, {
          size: bodySize,
          family: bodyFamily,
          fill: composition.ink,
          anchor: 'start',
          weight: bodyWeight,
        }),
      );
      if (accentFirst) accentUsed = true;
    } else {
      const x = composition.align === 'start' ? width - margin : width / 2;
      const anchor = composition.align === 'start' ? 'start' : 'middle';
      const options: TextOptions = {
        size: bodySize,
        family: bodyFamily,
        fill: composition.ink,
        anchor,
        weight: bodyWeight,
      };
      const useAccent = composition.template === 'editorial' && rowIndex === 0 && !accentUsed;
      parts.push(
        useAccent
          ? accentedTextNode(row[0], x, baseline, { ...options, accent: composition.accent })
          : textNode(row[0], x, baseline, options),
      );
      if (useAccent) accentUsed = true;
    }
  });

  const blockEnd = cursor + Math.max(0, rows.length - 1) * lineHeight + bodySize * 0.85;
  if (composition.template === 'editorial' && rows.length) {
    const ruleStart = width - margin;
    parts.unshift(
      `<line x1="${num(margin)}" y1="${num(blockStart - bodySize * 0.55)}" x2="${num(ruleStart)}" y2="${num(blockStart - bodySize * 0.55)}" stroke="${escapeXml(composition.ink)}" stroke-width="1" opacity="0.75"/>`,
      `<line x1="${num(margin)}" y1="${num(blockEnd + bodySize * 0.45)}" x2="${num(ruleStart)}" y2="${num(blockEnd + bodySize * 0.45)}" stroke="${escapeXml(composition.ink)}" stroke-width="1" opacity="0.75"/>`,
    );
  }

  const footSize = Math.max(10, height * 0.013);
  const footY = height - Math.max(inset * 0.7, footSize * 1.8);
  const footText = source.trim() || 'المصدر: الديوان · aldiwan.net';
  if (composition.showSource) {
    parts.push(
      textNode(footText, width - margin, footY, {
        size: footSize,
        family: textFamily,
        fill: composition.ink,
        anchor: 'start',
        opacity: 0.55,
      }),
    );
  }
  if (composition.handle.trim()) {
    const handle = composition.handle.trim().replace(/^@/, '');
    parts.push(
      textNode(`@${handle}`, margin, footY, {
        size: footSize,
        family: textFamily,
        fill: composition.ink,
        anchor: 'end',
        opacity: 0.55,
      }),
    );
  }

  const fontIds = facesForComposition(face).join(' ');
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" xml:lang="ar" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-label="معاينة تصميم القصيدة">`,
    `<metadata data-fonts="${escapeXml(fontIds)}"/>`,
    `<rect width="${width}" height="${height}" fill="${escapeXml(composition.ground)}"/>`,
    frameLayer(composition, width, height, inset, insetTwo, gold),
    ...parts,
    '</svg>',
  ].join('');
  if (import.meta.env.DEV) assertPairFit(svg, width, height, margin, gutter);
  return svg;
}
