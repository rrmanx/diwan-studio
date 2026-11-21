import type { StudioFontId } from './types';

/** Font asset ids used by the exporter (the composition also accepts `kufi`). */
export type FontId = 'thmanyah-display' | 'thmanyah-text' | 'amiri' | 'aref';
export type FaceId = FontId | 'kufi';

const ARABIC_RANGE =
  'U+0600-06FF, U+0750-077F, U+0870-08FF, U+200C-200E, U+FB50-FDFF, U+FE70-FEFC, U+1EE00-1EEFF';
const LATIN_RANGE = 'U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC, U+2122';

interface FontFile {
  path: string;
  range: string;
}

interface FontAsset {
  family: string;
  fallback: string;
  files: FontFile[];
}

const ASSETS: Record<FaceId, FontAsset> = {
  'thmanyah-display': {
    family: 'Thmanyah Serif Display',
    fallback: 'serif',
    files: [{ path: '/fonts/thmanyah/thmanyah-serif-display-Medium.woff2', range: '' }],
  },
  'thmanyah-text': {
    family: 'Thmanyah Serif Text',
    fallback: 'serif',
    files: [{ path: '/fonts/thmanyah/thmanyah-serif-text-Regular.woff2', range: '' }],
  },
  amiri: {
    family: 'Amiri',
    fallback: 'serif',
    files: [
      { path: '/fonts/amiri-400-arabic-4f1f7dad36.woff2', range: ARABIC_RANGE },
      { path: '/fonts/amiri-400-latin-441f50a6c5.woff2', range: LATIN_RANGE },
    ],
  },
  aref: {
    family: 'Aref Ruqaa',
    fallback: 'serif',
    files: [
      { path: '/fonts/aref-ruqaa-400-arabic-a31f642e53.woff2', range: ARABIC_RANGE },
      { path: '/fonts/aref-ruqaa-400-latin-8d1e04924c.woff2', range: LATIN_RANGE },
    ],
  },
  kufi: {
    family: 'Reem Kufi',
    fallback: 'serif',
    files: [
      { path: '/fonts/reem-kufi-400-arabic-821ac5e438.woff2', range: ARABIC_RANGE },
      { path: '/fonts/reem-kufi-400-latin-f73026360b.woff2', range: LATIN_RANGE },
    ],
  },
};

export const FONT_FAMILIES: Record<FaceId, string> = Object.fromEntries(
  Object.entries(ASSETS).map(([id, asset]) => [id, `"${asset.family}", ${asset.fallback}`]),
) as Record<FaceId, string>;

/** The bare family name, used identically by canvas measurement and SVG text. */
export function cssFamily(face: FaceId): string {
  return ASSETS[face].family;
}

export function fontCss(face: FaceId, size: number): string {
  return `${size}px ${FONT_FAMILIES[face]}`;
}

export interface FontFaceSource {
  family: string;
  dataUri: string;
  unicodeRange?: string;
}

const cache = new Map<FaceId, Promise<FontFaceSource[]>>();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

async function loadFace(face: FaceId): Promise<FontFaceSource[]> {
  const asset = ASSETS[face];
  const sources = await Promise.all(
    asset.files.map(async ({ path, range }): Promise<FontFaceSource | null> => {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          console.warn(`[studio] font ${path} returned ${response.status}; using fallback.`);
          return null;
        }
        const bytes = new Uint8Array(await response.arrayBuffer());
        return {
          family: asset.family,
          dataUri: `data:font/woff2;base64,${bytesToBase64(bytes)}`,
          unicodeRange: range || undefined,
        };
      } catch (error) {
        console.warn(`[studio] could not load ${path}; using fallback.`, error);
        return null;
      }
    }),
  );
  return sources.filter((source): source is FontFaceSource => source !== null);
}

/** Cached, self-contained font sources for one face. Missing files are skipped, never fatal. */
export function getFontDataUris(fontId: FaceId): Promise<FontFaceSource[]> {
  const cached = cache.get(fontId);
  if (cached) return cached;
  const pending = loadFace(fontId);
  cache.set(fontId, pending);
  return pending;
}

/** The body face plus faces used by the poet/title/foot, so a PNG is always self-contained. */
export function facesForComposition(font: StudioFontId): FaceId[] {
  const ids: FaceId[] = [font, 'thmanyah-display', 'thmanyah-text'];
  return ids.filter((id, index) => ids.indexOf(id) === index);
}
