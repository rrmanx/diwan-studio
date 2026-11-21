import type { VerseLine } from './types';

/** Turns pasted text into rows; ۞ / tab / semicolon / wide gaps mark a hemistich pair. */
export function linesFromText(text: string): VerseLine[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) =>
      line
        .split(/\s*[۞؛;|｜\t]\s*|\s{2,}/)
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(0, 2),
    );
}

export function linesFromVerses(verses?: string[][]): VerseLine[] {
  if (verses?.length) return verses.map((verse) => verse.filter(Boolean).slice(0, 2));
  return [];
}
