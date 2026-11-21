export type TemplateId = 'classical' | 'editorial' | 'artistic';
export type SizeId = 'square' | 'portrait' | 'story';
export type FontId = 'amiri' | 'aref' | 'kufi';
export type FrameId = 'none' | 'rule' | 'double' | 'corners';

/** The artwork faces offered in the rail: the three heritage faces plus the two Thmanyah faces. */
export type StudioFontId = FontId | 'thmanyah-display' | 'thmanyah-text';

export interface Composition {
  template: TemplateId;
  size: SizeId;
  font: StudioFontId;
  /** 0.8–1.3 */
  scale: number;
  /** 1.7–2.4 */
  leading: number;
  align: 'center' | 'start';
  ground: string;
  ink: string;
  accent: string;
  frame: FrameId;
  showPoet: boolean;
  showSource: boolean;
  handle: string;
  verseIndexes: number[];
}

/** One row of the poem: one hemistich, or a sadr/ajuz pair. */
export type VerseLine = string[];
