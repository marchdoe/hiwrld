# Brand system + homepage — design spec

**Date:** 2026-05-02  
**Branch:** feature/brand-homepage (worktree from `main`)  
**Source of truth for measurements:** `docs/design_handoff_hiwrld_brand/split-maison.jsx`  
**Copy:** placeholder — all landing page copy to be edited before launch

---

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Fonts | Geist + Geist Mono | Free (Vercel/OFL), close to Maison Neue metrics; Maison Neue can be swapped in later via token |
| Display/editorial family | Geist italic (weight 300) | No separate serif; acceptable for first pass |
| Homepage route | `/` → landing page | Editor at `/:docId` unchanged |
| PandaCSS scope | Full app | Single styling system; migrate `hiwrld.css` to token references |
| OG image | Static PNG in `public/` | Brand site only, no per-doc dynamic OG needed |

---

## PandaCSS architecture

### Installation

```
pnpm add -D @pandacss/dev
pnpm panda init
```

Add `@pandacss/dev/postcss` to `postcss.config.mjs`. Add `styled-system/` to `.gitignore`. Configure Vite to include the PostCSS plugin.

### File layout

```
panda.config.ts               — tokens, text styles, recipes, slot recipes
postcss.config.mjs            — updated to include Panda plugin
styled-system/                — generated (gitignored)

src/
  design/
    tokens.ts                 — raw T values re-exported for non-Panda contexts (e.g. Puppeteer OG render)
  components/
    Wordmark.tsx              — brand component
    Split.tsx                 — layout primitive
    Button.tsx                — button variants
  routes/
    index.tsx                 — landing page (replaces redirect)
  assets/
    og.png                    — static 1200×630 OG card
    favicon.svg               — master SVG (hi* mark)
public/
  favicon.ico                 — 32px graphite
  favicon-16.png
  favicon-32.png
  favicon-48.png
  favicon-96.png
  favicon-128.png
  favicon-180.png             — apple-touch-icon
  favicon-192.png             — PWA
  favicon-512.png             — PWA maskable
  og.png                      — 1200×630
```

---

## Design tokens

Defined in `panda.config.ts` under `theme.tokens` and `theme.semanticTokens`.

### Colors

```ts
colors: {
  g0: { value: '#f7f6f3' },   // page bg, light surfaces
  g1: { value: '#ecebe7' },   // panel bg, alt sections
  g2: { value: '#dcd9d2' },   // hairline rules, borders
  g3: { value: '#a8a39a' },   // tertiary text, captions
  g4: { value: '#6e6a62' },   // secondary text
  g5: { value: '#3d3a35' },   // body on light, secondary on dark
  g6: { value: '#1f1d1a' },   // primary text, dark surfaces
  ink:     { value: '#3a4a6b' },   // graphite-blue accent — the only hue
  inkSoft: { value: '#b8c2d4' },   // accent on dark, soft variant
}
```

**Rule:** no additional hues. All alert/status colours from the existing GFM alert set remain as-is in the migrated CSS.

### Fonts

```ts
fonts: {
  ui:      { value: '"Geist", "Helvetica Neue", Helvetica, Arial, sans-serif' },
  mono:    { value: '"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace' },
  display: { value: '"Geist", "Helvetica Neue", Helvetica, Arial, sans-serif' },
  // Note: display is the same stack as ui for the first pass.
  // Swap to '"Editorial New", "PP Editorial New", Georgia, serif' when licensed.
}
```

Load Geist + Geist Mono from Google Fonts via `<link>` in `index.html`.

### Text styles

```ts
textStyles: {
  heroNum:      { value: { fontFamily: 'ui', fontWeight: '500', fontSize: '132px', letterSpacing: '-0.05em', lineHeight: '0.86' } },
  h1:           { value: { fontFamily: 'display', fontStyle: 'italic', fontWeight: '300', fontSize: '56px', letterSpacing: '-0.03em', lineHeight: '0.95' } },
  sectionTitle: { value: { fontFamily: 'ui', fontWeight: '500', fontSize: '28px', letterSpacing: '-0.03em', lineHeight: '1.0' } },
  bodyLg:       { value: { fontFamily: 'ui', fontWeight: '400', fontSize: '18px', lineHeight: '1.5' } },
  body:         { value: { fontFamily: 'ui', fontWeight: '400', fontSize: '16px', lineHeight: '1.5' } },
  uiBtn:        { value: { fontFamily: 'ui', fontWeight: '500', fontSize: '14px', lineHeight: '1.0' } },
  caption:      { value: { fontFamily: 'ui', fontWeight: '400', fontSize: '12px', lineHeight: '1.4' } },
  meta:         { value: { fontFamily: 'mono', fontWeight: '400', fontSize: '11px', letterSpacing: '0.02em', lineHeight: '1.0' } },
}
```

### Spacing / sizing

No formal scale — values picked per layout as per design spec. Common values used in layout CSS: `14px 18px 22px 28px 32px 36px 56px 64px 90px`.

### Border / radius / shadow rules

- **Radius: 0** everywhere. No exceptions.
- **No box-shadow** on any element.
- **Light border:** `1px solid token(colors.g2)`
- **Dark border:** `1px solid token(colors.g5)`

---

## Recipes

### `button` recipe

Variants: `solid | line | ghost | link`  
Visual modifier: `default | inverted`

| Variant | Base styles | Hover |
|---|---|---|
| `solid` | bg g6, color g0, border g6 | bg ink, border ink |
| `line` | bg transparent, color g6, border g6 | bg g6, color g0 |
| `ghost` | bg transparent, color g4, border dashed g3 | color g6 |
| `link` | bg transparent, color ink, border-bottom ink, no border | border-bottom g6 |

Inverted modifier (for dark sections): bg inkSoft, color g6.  
Padding: `14px 22px` (default), `18px 28px` (inverted).  
Transition: `background-color, color, border-color` at `150ms ease`. No transform, no shadow.

### `wordmark` recipe

Variants: `primary | mono | short`  
Visual modifier: `default | reversed`

The mark is `hi*wrld*` where `hi` is regular weight, `*` is accent color at 95% size, `wrld` is bold. Rendered as `inline-flex, align-items: baseline`.

The recipe handles **color and weight only**. Glyph spacing is size-dependent and must be applied as inline styles by the `<Wordmark>` component (recipes cannot compute runtime values). Spacing (where `s` = font-size in px):
- After `hi`, before `*`: `margin-left: s * 0.04`
- After `*`, before `wrld`: `margin-right: s * 0.005`
- After `wrld`, before closing `*`: `margin-left: s * 0.005`

| Variant | hi weight | * color | wrld weight |
|---|---|---|---|
| `primary` | 400 | ink | 700 |
| `mono` | 400 | inherit (g6/g0) | 700 |
| `short` | 700 | ink | — |

Reversed modifier: color g0, accent inkSoft.

---

## Slot recipes

### `split` — the central primitive

Slots: `root`, `left`, `right`

```
root: display grid, grid-template-columns (prop), height 100%, font-family ui
left: padding (prop), border-right 1px solid var(--split-rule), flex col, min-width 0, overflow hidden
right: padding (prop), flex col, min-width 0, overflow hidden
```

Default props: `ratio="1fr 1fr"`, `ruleColor=g2`, `padded="32px 36px"`.

`ruleColor` and `padded` are runtime props — implemented by the `<Split>` component setting `--split-rule` and `padding` as inline CSS custom properties / style overrides on the root element. The slot recipe sets `--split-rule: token(colors.g2)` as the default.

### `nav` — sticky top bar

Slots: `root`, `logo`, `links`, `link`, `cta`

```
root: sticky top-0, bg g0, z-index 10, padding 20px 32px, border-bottom 1px g2, flex space-between
logo: (Wordmark at size 24)
links: flex gap-22, font-size 14, color g5
link: color g5, no underline
cta: padding 8px 14px, bg g6, color g0, font-weight 500
```

### `pullQuote` — editorial blockquote section

Slots: `root`, `text`, `accent`

```
root: padding 90px 56px, bg g1, border-bottom 1px g2, text-align center
text: font-family display, italic, weight 300, font-size 56px, line-height 1.15,
      letter-spacing -0.02em, color g6, text-wrap balance, max-width 920px, margin auto
accent: color ink
```

### `featureRow` — numbered feature list row

Slots: `root`, `num`, `title`, `desc`

```
root: display grid, grid-template-columns 64px 1fr 2fr, padding 28px 32px,
      align-items baseline, gap 32px, border-bottom 1px g2
num:  font-family mono, font-size 12, color g3
title: font-family ui, weight 500, font-size 28, letter-spacing -0.03em
desc: font-family ui, font-size 16, color g4, line-height 1.5, text-wrap pretty
```

### `stackSection` — tech stack table

Slots: `root`, `heading`, `table`, `row`, `key`, `val`, `idx`

```
root: padding 56px 32px, border-bottom 1px g2
  inner: display grid, grid-template-columns 1fr 2fr, gap 36px
heading: font-family display, italic, weight 300, font-size 56px,
         letter-spacing -0.03em, line-height 0.95, color g6
  heading accent word: color ink
row: display grid, grid-template-columns 120px 1fr 40px,
     padding 14px 0, border-top 1px g2, align-items baseline
key: font-family mono, font-size 11, color g4
val: font-family ui, font-size 15
idx: text-align right, font-family mono, font-size 10, color g3
```

### `ctaSection` — final dark CTA

Slots: `root`, `left`, `right`, `btn`

```
root: bg g6, color g0, border-bottom 1px g5
  uses Split primitive with bg g6, ruleColor g5, padded "64px 56px"
left heading: font-family ui, weight 500, font-size 64, letter-spacing -0.04em, line-height 0.95
btn: (Button inverted variant)
```

### `footer`

Slots: `root`, `left`, `right`

```
root: padding 14px 32px, font-family mono, font-size 11, color g4, flex space-between
```

---

## Landing page — `src/routes/index.tsx`

Replaces the current redirect. Static React component, no data fetching.

Section order:
1. `<Nav>` — wordmark + nav links + "open editor →" CTA linking to `/$newDocId`
2. `<Hero>` — full-width Split. Left: "write." + body copy + primary CTA. Right: "read." (ink) + body copy + secondary CTA.
3. `<PullQuote>` — italic blockquote, "feature" in ink
4. `<Features>` — 4 `<FeatureRow>` items (split pane / realtime / no account / offline-ready)
5. `<StackSection>` — heading + 6-row table (ui / editor / markdown / realtime / styles / bundler)
6. `<CTASection>` — dark Split, "ready when you are." + "open hiwrld.com →"
7. `<Footer>` — © 2026 · MIT / est. 2012 / reprinted 2026

**Routing:** `generateDocumentId()` called at click time (not at page load), so the nav CTA and hero CTA both open fresh docs on demand.

**Interactions:** Nav is `position: sticky; top: 0`. Button hover transitions only (`background-color, color, border-color`, `150ms ease`). No scroll animation, no parallax. Page is quiet.

---

## Assets

### OG card — `public/og.png`

1200×630 static PNG. Rendered via Puppeteer/headless Chrome at build time (or one-time manual capture) from a standalone HTML file that reuses the brand tokens. Left third: `hi*wrld*` wordmark on g0. Right two-thirds: "write / read" split with italic taglines. Mono URL bottom-right.

Script: `scripts/render-og.ts` — launches Puppeteer, opens `src/assets/og-source.html`, screenshots at 1200×630, saves to `public/og.png`.

### Favicon set — `public/`

Master SVG: `src/assets/favicon.svg` — `hi*` short mark, graphite bg (g6), inkSoft asterisk, square crop, no rounding.

PNG exports: 16, 32, 48, 64, 96, 128, 180 (apple-touch), 192, 512px. Maskable variant at 512px with 20% safe-zone padding.

Script: `scripts/render-favicons.ts` — uses `sharp` to resize from SVG master.

`index.html` updates:
```html
<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/favicon-180.png" />
<meta property="og:image" content="/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

---

## `hiwrld.css` migration

All hardcoded hex values replaced with `token()` references from the Panda token layer. Structural CSS (flex/grid, overflow, media queries, transitions, animations) is unchanged. No component structure changes.

Key remaps:
- `#35332e` → `token(colors.g5)`
- `#f7f6f2` / `#fcfcfa` → `token(colors.g0)`
- `#edebe2` / `#d8d4c6` → `token(colors.g2)`
- `#2f8a5a` (current green accent on links/focus) → **keep as-is** for the editor surface; this is distinct from the brand ink accent and applies only inside `.document-article`
- `#1f1d1a` → `token(colors.g6)`

GFM alert colours remain unchanged — they are semantic (note/tip/warning/caution) and outside the brand token set.

---

## Implementation notes

- **Worktree:** implement in a fresh git worktree branched from `main` (`feature/brand-homepage`)
- **PandaCSS + Vite:** use `@pandacss/dev` PostCSS plugin; no separate `panda` CLI watcher needed in dev
- **Geist fonts:** load via `<link>` in `index.html`, not via `@import` in CSS (avoids render-blocking in Vite dev)
- **Copy:** all landing page text is placeholder on first pass; copy editing deferred
- **Fidelity:** high — all measurements from `split-maison.jsx` are final
