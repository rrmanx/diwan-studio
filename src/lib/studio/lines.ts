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

/** For hemistich layouts, join consecutive single lines into sadr/ajuz bayts. */
export function pairHemistichs(rows: VerseLine[]): VerseLine[] {
  const pairs: VerseLine[] = [];
  for (const row of rows) {
    const parts = row.filter((part) => part.trim() !== '');
    if (parts.length >= 2) {
      pairs.push(parts.slice(0, 2));
    } else if (parts.length === 1) {
      const last = pairs[pairs.length - 1];
      if (last?.length === 1) last.push(parts[0]);
      else pairs.push(parts);
    }
  }
  return pairs;
}
