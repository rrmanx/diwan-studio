import type { SizeId } from './types';

export interface ArtboardSize {
  width: number;
  height: number;
  label: string;
}

export const SIZES: Record<SizeId, ArtboardSize> = {
  square: { width: 1080, height: 1080, label: 'مربّع' },
  portrait: { width: 1080, height: 1350, label: 'عمودي' },
  story: { width: 1080, height: 1920, label: 'ستوري' },
};

export const SIZE_IDS = Object.keys(SIZES) as SizeId[];

export function artboardSize(id: SizeId): ArtboardSize {
  return SIZES[id] ?? SIZES.square;
}
