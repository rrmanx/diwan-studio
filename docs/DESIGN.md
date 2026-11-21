# DESIGN.md — Diwan Studio

## 0. Idea

A **typographer's desk for classical Arabic poetry**. Paper, ink, one madder accent.
Everything is ruled, aligned, and quiet; the poem is always the loudest thing on screen.
No gradients, no glass, no drop shadows except one paper-lift on floating panels.

Voice: literary, precise, unhurried. Arabic first. Never exclamation marks. Buttons are verbs.

## 1. Mark

The **nuqta and the rule**: a rhombus (the Arabic dot is a diamond, not a circle) set above a
horizontal rule, at its right end — the pen landing at the start of a line in a language read
right-to-left. One ink, works at 16px, no container.
Files: `public/brand/mark.svg`, `mark-dark.svg`, `favicon.svg`, `icon-192.png`, `icon-512.png`.

Wordmark: «ديوان» in Reem Kufi, tracked; paired with `STUDIO` in IBM Plex Mono, 11px,
letter-spacing .28em. In tight spaces only the mark is used.

## 2. Palette (light / default)

```css
--paper:#F4EEE3; --paper-raised:#FBF7EF; --paper-sunk:#EAE1D1;
--ink:#171410;   --ink-2:#4B4438;      --ink-3:#847B6C;
--rule:#D9CFBC;  --rule-strong:#C2B59D;
--accent:#9C3A18; --accent-hover:#7D2C10; --gold:#A98A3E;
```

Dark (`[data-theme="dark"]`, also honoured from `prefers-color-scheme`):

```css
--paper:#13110D; --paper-raised:#1B1813; --paper-sunk:#0D0B08;
--ink:#EFE7D8;   --ink-2:#B9AF9E;       --ink-3:#8A8173;
--rule:#302B22;  --rule-strong:#443D30;
--accent:#D06A3F; --accent-hover:#E07C50; --gold:#C6A45A;
```

One colour per surface. Text is ink, hairlines are rule, the only saturated colour is accent,
used for links-hover, the active tab underline, the primary button and a single focal word.

## 3. Type

| Role | Face | Notes |
|---|---|---|
| UI | **Readex Pro** 300/400/500 | Arabic + Latin, variable; 16px base, 1.7 leading |
| Display | **Reem Kufi** 400 | Page titles, wordmark; tight tracking, no bold |
| Poem | **Amiri** 400/700 | 26–34px, leading 2.05, never letterspaced |
| Calligraphic | **Aref Ruqaa** 400/700 | Artistic template + pull quotes only |
| Mono | **IBM Plex Mono** 400/500 | API inspector, endpoint paths, numbers |

Scale (rem): 0.75 / 0.875 / 1 / 1.0625 / 1.25 / 1.5 / 1.875 / 2.25 / 3 / 4.25.
Display uses `clamp()`. Arabic body leading ≥ 1.75. Latin meta labels: 11px, +0.14em, uppercase.

## 4. Grid & rhythm

- Container 1240px, gutter 24px (16px mobile), 12 columns.
- Vertical rhythm: section padding 88px desktop / 56px mobile; card padding 24–32px.
- Radii: 0 on rules and frames, 2px on inputs/buttons, 4px on floating panels only.
- Hairlines: 1px `--rule`. Never a drop shadow to separate; use rules and paper tones.

## 5. Components

**Header** 64px, sticky, paper at 92% + backdrop-blur(8px), hairline bottom.
Right: mark + «ديوان» + STUDIO. Center: nav (اكتشف · الشعراء · القصائد · الاقتباسات · الاستوديو).
Left: API pill (dot + «API»), theme toggle, \`⌘K\` search trigger.

**Buttons** — primary: ink fill, paper text, 2px radius, 44px min height, hover accent.
secondary: 1px rule, transparent, hover ink. ghost: text + underline offset 0.35em on hover.
Icon buttons 40×40, 1px rule on hover only.

**Inputs** — 1px rule, paper-raised fill, 44px, focus: ink ring 2px offset 0. No glow.

**Poem block** — `display_layout=hemistichs`: two columns, 18px gutter with a 1px vertical rule;
sadr right, ajuz left. `lines`: single column. `stanzas`: blocks separated by 1.2em.
Verse numbers in mono 11px `--ink-3`, never bold.

**Meta row** — poet · era · meter · rhyme, separated by thin middots, 13px `--ink-2`.

**Quote pull** — Aref Ruqaa or Amiri 32–40px, leading 1.9, accent rule above 32px wide.

**Inspector drawer** — 380px, from the inline-end edge, paper-raised, mono 12px, rows label/value,
status dot (ok accent / warn gold / error red-brown #8E2F22). No key, no headers.

**Tags/chips** — 1px rule, 28px height, 12px text; active = ink fill.

## 6. The three templates (SVG compositions)

| Template | Ground | Type | Structure |
|---|---|---|---|
| **كلاسيكي Classical** | `#F4EEE3` | Amiri | Double hairline frame inset 56px; hemistichs 2-col; poet in Reem Kufi 14px centred above; attribution 9px at foot |
| **تحريري Editorial** | `#FBf7EF` | Reem Kufi title + Amiri body? — no: **Reem Kufi** body | Asymmetric: rules at top and bottom, poem right-aligned on a 12-col grid, poet name large in the negative space, one accent word |
| **فني Artistic** | `#14110D` | Aref Ruqaa | Radial vignette (single dark tone), gold hairline square inset 40px, poem centred, poet in gold 12px, grain overlay at 4% |

All templates: attribution line at foot (`المصدر: الديوان — aldiwan.net`), optional handle.

Sizes: 1080×1080, 1080×1350, 1080×1920. Margins scale with the short edge.

## 7. Motion (emil-skills register)

- Durations 120–200ms; easing `cubic-bezier(.2,0,0,1)`; no bounce, no spring on text.
- One dealt moment per page: on home, hero verse words rise 6px with 18ms stagger (≤14 words).
- Panel/drawer: 180ms translate + fade. Hover: colour and underline only.
- `prefers-reduced-motion: reduce` → all durations 0, no stagger, no parallax.

## 8. Copy rules

- Arabic UI; English only in the API inspector and endpoint paths.
- No marketing superlatives. «اقرأ»، «صمّم»، «صدّر»، «انسخ».
- Empty states teach: «لم نجد شيئًا بهذا النص. جرّب اسم شاعر، أو ابدأ من الأروقة.»
- Errors name the failure and the fix: «تعذّر الوصول إلى الديوان. تحقّق من الاتصال ثم أعد المحاولة.»

## 9. Anti-patterns (rejected)

Gradient meshes, glass cards, 3D blobs, sparkle icons, purple-to-pink anything, emoji as iconography,
centred-everything, rounded-2xl cards, "AI-powered" badges, testimonial sections, fake metrics.
