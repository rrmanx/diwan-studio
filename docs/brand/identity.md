# Diwan Studio — identity record

Applied from the `brand-identity` discipline: one mechanism, measured claims, no decoration that
does not come from the idea. Mark and wordmark are **kept**; the palette is **refreshed** for AA;
type is **Thmanyah**.

## 1. Mechanism — one sentence

**A language is a line of writing, and every line begins with one diamond.** The mark is the Arabic
nuqta (a rhombus, not a circle) landing on the start of a rule; the wordmark is set in a high-contrast
Arabic serif because the product is a *studio*, not a platform.

## 2. The mark

- Two shapes only: `M6 33.9 L42 30.2 L42 33.5 Z` (chisel rule, tapered at the reading end) and
  `M34.5 10.1 L41.8 17.2 L34.5 24.3 L27.2 17.2 Z` (the nuqta).
- Grid 48 × 48, optical box 36 × 23.3, baseline at y = 33.5. No container, no gradient, one ink.
- Clear space: 1× the nuqta half-diagonal (7 units) on every side.
- Minimum size: 16 px (mark alone), 24 px (lockup). Below 16 px the rule disappears — do not ship it.
- Reversed: `mark-paper.svg` on ink; never on a mid-tone.
- Describe in four words: *dot above the line.*

## 3. Wordmark

- **الدِّيوَان** in Thmanyah Serif Display Medium, outlined (`public/brand/wordmark.svg`).
- The kasra is part of the word — never strip it, never re-space the letters, never set it in another face.
- Lockups: horizontal (STUDIO · wordmark · mark) and stacked. The 1 px rule between STUDIO and the
  wordmark is 22 units tall, 12 units away on each side.

## 4. Type

| Role | Face | Weights | Licence |
|---|---|---|---|
| Identity, headlines, titles | Thmanyah Serif Display | 400–700 | Thmanyah font licence — free personal + commercial, **no redistribution** of files |
| Body, reading | Thmanyah Serif Text | 300–500 | same |
| Interface, controls | Thmanyah Sans | 300–500 | same |
| Artwork (Studio) | Amiri · Aref Ruqaa | 400/700 | SIL OFL |
| API surface | IBM Plex Mono | 400/500 | SIL OFL |

Files are fetched at build time (`scripts/fetch-thmanyah.mjs`) and are not committed. Arabic glyph
coverage of the Thmanyah faces was verified by rendering the full UI copy, all diacritics included.

## 5. Palette — measured

WCAG 2.1 contrast, sRGB, computed with the standard relative-luminance formula.

| Pair | Ratio | Verdict |
|---|---|---|
| ink #171410 on paper #F4EEE3 | **15.9 : 1** | AAA |
| ink-2 #4B4438 on paper | **8.33 : 1** | AAA |
| ink-3 #6B6255 on paper | **5.19 : 1** | AA (small text ok) |
| ink-3 #6B6255 on paper-sunk #EAE1D1 | **4.62 : 1** | AA |
| accent #9C3A18 on paper | **6.00 : 1** | AA |
| paper on ink | **15.9 : 1** | AAA |
| night text #EFE7D8 on night #13110D | **15.35 : 1** | AAA |
| night ink-3 #8A8173 on night | **4.91 : 1** | AA |
| night accent #D06A3F on night | **5.22 : 1** | AA |
| rule #D9CFBC on paper | 1.34 : 1 | decorative only — never text |

**Change made:** the previous muted ink #847B6C measured **3.61 : 1** on paper and failed AA for the
11–13 px meta labels; it is replaced by **#6B6255** (5.19 : 1 / 4.62 : 1 on sunk).

## 6. Misuse

- Do not place the mark in a rounded square, circle or badge.
- Do not recolour the mark with the accent, the gold or a gradient.
- Do not rotate it, add a shadow, or outline the rule.
- Do not set the wordmark without the kasra, in Kufi, or tracked out.
- Do not use the mark as a bullet or a background pattern.

## 7. Files

`public/brand/`: `mark.svg` (currentColor) · `mark-ink.svg` · `mark-paper.svg` · `favicon.svg` ·
`favicon.ico` · `icon-192.png` · `icon-512.png` · `apple-touch-icon.png` · `wordmark.svg` ·
`lockup-horizontal.svg` · `lockup-stacked.svg` · `og.png`.
Decision sheet: `docs/brand/brand-sheet.png`.
