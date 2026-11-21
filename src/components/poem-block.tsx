import type { CSSProperties } from 'react';
import type { Poem } from '../lib/types';

type Row = [string] | [string, string];

interface PoemBlockProps {
  text: string;
  layout: Poem['display_layout'];
  size?: 'reader' | 'compact';
  verses?: string[][];
  fontSize?: string;
  lineHeight?: string;
}

const SIZES = {
  reader: { fontSize: 'clamp(22px, 2.2vw, 30px)', lineHeight: '2.05' },
  compact: { fontSize: '18px', lineHeight: '1.9' },
};

function linesOf(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function pairedRows(text: string, verses?: string[][]): Row[] {
  if (verses && verses.length > 0) {
    return verses
      .filter((verse) => verse.length > 0)
      .map((verse) => (verse.length >= 2 ? [verse[0], verse[1]] : [verse[0]]) as Row);
  }
  const lines = linesOf(text);
  const rows: Row[] = [];
  for (let index = 0; index < lines.length; index += 2) {
    rows.push(lines[index + 1] ? [lines[index], lines[index + 1]] : [lines[index]]);
  }
  return rows;
}

function RowView({ row, number }: { row: Row; number: number }) {
  const figure = (
    <span
      className="w-6 shrink-0 pt-1.5 text-right font-mono text-[11px] text-ink-3"
      aria-hidden="true"
    >
      {number}
    </span>
  );
  if (row.length === 2) {
    return (
      <div className="flex items-start gap-3 sm:gap-6">
        {figure}
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:gap-6">
          <span className="min-w-0 flex-1">{row[0]}</span>
          <span className="min-w-0 flex-1 sm:border-r sm:border-rule sm:pr-6">{row[1]}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 sm:gap-6">
      {figure}
      <span className="min-w-0 flex-1 text-right">{row[0]}</span>
    </div>
  );
}

export function PoemBlock({
  text,
  layout,
  size = 'reader',
  verses,
  fontSize,
  lineHeight,
}: PoemBlockProps) {
  const style: CSSProperties = {
    fontSize: fontSize ?? SIZES[size].fontSize,
    lineHeight: lineHeight ?? SIZES[size].lineHeight,
  };
  let number = 0;

  if (layout === 'lines') {
    return (
      <div className="space-y-3 font-poem text-ink" style={style} dir="rtl">
        {linesOf(text).map((line, index) => (
          <RowView key={index} row={[line]} number={++number} />
        ))}
      </div>
    );
  }

  if (layout === 'stanzas') {
    const stanzas = text
      .split(/\n\s*\n/)
      .map((stanza) => stanza.trim())
      .filter(Boolean);
    return (
      <div className="space-y-[1.6em] font-poem text-ink" style={style} dir="rtl">
        {stanzas.map((stanza, index) => (
          <div key={index} className="space-y-3">
            {pairedRows(stanza).map((row, rowIndex) => (
              <RowView key={rowIndex} row={row} number={++number} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 font-poem text-ink" style={style} dir="rtl">
      {pairedRows(text, verses).map((row, index) => (
        <RowView key={index} row={row} number={++number} />
      ))}
    </div>
  );
}
