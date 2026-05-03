# Handoff: hiwrld brand system ("the split")

## Overview

**hiwrld** is a split-pane markdown editor — write on the left, read on the right, share the URL. This handoff covers the brand identity system and the public landing page (hiwrld.com).

The system is named **"the split"** because the product mechanic *is* the brand: every asset is composed across a single vertical hairline rule. Left/right, hi/wrld, write/read, input/output. No mascots, no glyph marks, no flourishes. Quiet by design.

The wordmark is **`hi*wrld*`** — the spelling itself is markdown emphasis syntax. "wrld" between asterisks renders bold; the asterisks remain visible in an accent color as the central glyph of the mark. The brand IS markdown.

## About the design files

The HTML/JSX files in this bundle are **design references**, not production code. They render in a design-canvas viewer (pan/zoom artboards) and are not meant to ship.

**Your job:** recreate these designs in the target codebase using its existing patterns and libraries. If the project already has React + a styling solution, use those. If it's a fresh repo, the designs assume **React + plain CSS** (or CSS Modules / vanilla-extract — anything token-driven). The `stack` table in the landing page (Section 6 below) lists the intended production stack, but you are not bound to it for the brand system itself.

## Fidelity

**High-fidelity.** All colors, typography, spacing, and layout are final. Recreate pixel-perfectly using the exact tokens below.

## Files in this bundle

- `hiwrld split system maison.html` — the design canvas (open in a browser to view all artboards). Loads `split-maison.jsx` via Babel.
- `split-maison.jsx` — all design components (Wordmark, ABFrame, Cover, WMPrimary, GrayScale, TypeSpec, Components, Favicons, OG, ProductEditor, Landing, etc.). **This is the source of truth for every measurement in the README below.**
- `design-canvas.jsx` — the canvas/artboard viewer harness. Not part of the production output.

When in doubt, open `split-maison.jsx` and read the JSX directly.

---

## Design tokens

Drop these into a single tokens file (`tokens.css`, `theme.ts`, whatever the codebase uses).

### Colors

A 7-step warm-gray ramp (no pure black, no pure white) plus a single quiet graphite-blue accent.

| Token | Hex | Use |
|---|---|---|
| `g0` | `#f7f6f3` | page background, light surfaces |
| `g1` | `#ecebe7` | subtle panel bg, alt sections |
| `g2` | `#dcd9d2` | hairline rules, borders |
| `g3` | `#a8a39a` | tertiary text, captions |
| `g4` | `#6e6a62` | secondary text |
| `g5` | `#3d3a35` | body on light, secondary on dark |
| `g6` | `#1f1d1a` | primary text, dark surfaces (NOT black) |
| `ink` | `#3a4a6b` | the only accent — graphite-blue |
| `inkSoft` | `#b8c2d4` | accent on dark, soft variant |

**Rule:** there is exactly one accent color. Do not introduce additional hues.

### Typography

Three families. **All three are paid** and do not load over a free CDN — license before shipping.

| Family | CSS stack | Use |
|---|---|---|
| **Display** | `"Editorial New", "PP Editorial New", Georgia, serif` | italic pull-quotes, masthead, editorial cuts |
| **UI** | `"Maison Neue", "Helvetica Neue", Helvetica, Arial, sans-serif` | wordmark, headings, body, buttons |
| **Mono** | `"Maison Neue Mono", "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace` | meta labels, captions, codes, timestamps |

**Licensing:**
- Editorial New / PP Editorial New — Pangram Pangram
- Maison Neue / Maison Neue Mono — Milieu Grotesque (milieugrotesque.com)
- The fallbacks (Helvetica Neue, JetBrains Mono) render acceptably but the metrics differ. Buy the real fonts before launch.

### Type scale (UI family unless noted)

| Role | Size | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|
| Cover hero (`hi` / `wrld`) | 132 | 500 | -0.05em | 0.86 |
| H1 (italic display) | 56 | 300 italic | -0.03em | 0.95–1.15 |
| Section title (UI) | 28 | 500 | -0.03em | 1.0 |
| Body large | 18 | 400 | normal | 1.5 |
| Body | 16 | 400 | normal | 1.5 |
| UI / button | 14–15 | 500 | normal | 1.0 |
| Caption | 12–13 | 400 | normal | 1.4 |
| Meta (mono) | 10–11 | 400 | 0.02em | 1.0 |

Apply `text-wrap: pretty` on body paragraphs, `text-wrap: balance` on display headlines.

### Spacing

No formal scale — values are picked per layout. Common units: 14, 18, 22, 28, 32, 36, 56, 64, 90 px. Section vertical padding is typically `56px–90px`. Hairline rule: always exactly `1px solid g2` (or `g5` on dark).

### Borders / radii / shadows

- **Radius: 0.** Everything has square corners.
- **No shadows.** Depth comes from the hairline grid alone.
- **Borders:** `1px solid g2` on light, `1px solid g5` on dark.

---

## Component: Wordmark

The mark is `hi*wrld*` rendered with markdown semantics:

- `hi` — UI family, weight **400** (regular)
- `*` — UI family, weight **400**, color = **ink (accent)**, font-size = 95% of base
- `wrld` — UI family, weight **700** (bold)
- `*` — UI family, weight **400**, color = **ink (accent)**, font-size = 95% of base

**Inline-flex, baseline-aligned.** `letter-spacing: -0.04em`, `line-height: 1`.

Spacing between glyphs (size = base font-size in px):
- After `hi`, before opening `*`: `margin-left: size * 0.04`
- After opening `*`, before `wrld`: `margin-right: size * 0.005`
- After `wrld`, before closing `*`: `margin-left: size * 0.005`

**Modes:**
1. **`primary`** — full lockup, asterisks in `ink`. Default.
2. **`mono`** — same lockup, asterisks inherit text color (no accent). Use when the mark sits next to other accent-colored elements or when printing one-color.
3. **`short`** — favicon abbreviation: just `hi` + `*`. `hi` is **bold (700)**, `*` is regular accent. Used at favicon sizes (16–128px) and as a compact mark.

**Reversed (on dark):** color = `g0`, accent = `inkSoft`.

**Minimum sizes:** 14px for primary lockup, 16px for short mark on screens. Below that, render `hi*` as a static SVG.

**Clear space:** half the cap-height of `hi` on all sides.

**Construction grid:** see the "construction" artboard. Cap-height aligns to baseline grid; asterisks sit slightly above baseline (natural typographic position).

See `WMPrimary`, `WMMonochrome`, `WMReversed`, `WMEditorial`, `WMConstruction`, `WMAnatomy`, `WMInContext`, `Wordmark` in `split-maison.jsx`.

---

## Component: Split (the central primitive)

Every layout is a `Split` — a 2-column grid with a single 1px vertical hairline between.

```jsx
<Split
  ratio="1fr 1fr"           // any grid-template-columns value
  bg={T.g0} fg={T.g6}        // background / foreground
  ruleColor={T.g2}           // hairline color
  ruleWeight={1}             // hairline px
  padded="32px 36px"         // padding inside each column
  left={<>...</>}
  right={<>...</>}
/>
```

Implementation: CSS Grid with `grid-template-columns`, left column gets `border-right: 1px solid <rule>`. Both columns: `display: flex; flex-direction: column; min-width: 0; overflow: hidden`.

This component appears everywhere — cover, CTA, hero rows, two-up product layouts. Recreate it once and reuse.

---

## Component: ABFrame

Bordered frame with a top label bar, used to wrap design artboards. Rendered as: `1px solid g2` outer border, top strip with mono-family `tl` (left label) + `tr` (right label) at 10px.

In production this exists for the design canvas only — you usually don't ship `ABFrame`. The labels (`wordmark / 01`, `primary`) are design metadata.

---

## Components: Buttons & link styles

From the `Components` artboard and the landing page:

- **Primary button:** `background: g6; color: g0; padding: 14px 22px; font: 14px/1 UI 500;` — square corners, no radius. Hover: `background: ink`.
- **Secondary button:** `background: transparent; color: g6; border: 1px solid g6; padding: 14px 22px;` — square corners. Hover: invert (bg g6, color g0).
- **Inverted CTA:** on dark sections, `background: inkSoft; color: g6; padding: 18px 28px;`.
- **Inline link:** `color: g6; text-decoration: underline; text-decoration-color: g3; text-underline-offset: 3px;`. Hover: `text-decoration-color: ink`.

No icon buttons in the system. No filled hover lifts. No radii.

---

## Screens / views

### 1 · Cover

Two-column `Split` at `1200×500`. Left = "hi" + "the side you write on." (italic display). Right = "wrld" + "the side everyone else reads." (italic display, ink color). Top corners carry mono-family meta: `hiwrld · system 003` / `the split`. Bottom corners: `est. 2012 / reprinted 2026` / `hiwrld.com`.

Big numerals are **132px UI 500, letter-spacing -0.05em, line-height 0.86**.

### 2 · Wordmark sheet

Six artboards: primary, monochrome, reversed (on g6), editorial cut (italic display "hi," / "wrld."), construction grid, scale ladder. See `WMPrimary`, `WMMonochrome`, `WMReversed`, `WMEditorial`, `WMConstruction`, `WMScale`.

### 2b · Anatomy & context

Two artboards: anatomy (the four parts of the mark broken out and labeled) and in-context (nav bar @ 24px, signature on dark @ 28px). See `WMAnatomy`, `WMInContext`.

### 3 · Tokens

Three artboards: gray scale (the 7 grays as labeled swatches), accent (ink + inkSoft swatches), type spec (display / UI / mono samples at multiple sizes). See `GrayScale`, `AccentTokens`, `TypeSpec`.

### 4 · Components

Single artboard with the button + link variants above, plus a status chip and a segmented mode switch (split / read / write).

### 5 · Brand applications

- **Favicons** — sizes 16, 32, 48, 64, 128 plus an outline variant. All show the `short` wordmark mode (`hi*`). Square crop, no padding rounding.
- **OG card** — 1200×630. Left third: `hi*wrld*` wordmark on g0. Right two-thirds: italic display tagline. Mono URL bottom-right. Rendered at 620×326 in the artboard but exported at 1200×630.
- **Product editor** — full app mock at 1320×520. Two-pane split: left = CodeMirror with markdown source, right = rendered preview. Top bar: short wordmark + URL pill + share button.

### 6 · Landing page (hiwrld.com)

Full page at 1280px. Sections in order:

1. **Sticky nav** — `1px solid g2` bottom border, `padding: 14px 32px`. Left: short wordmark @ 22px. Right: nav links (`features`, `stack`, `github`) in UI 13px g5, plus `open editor →` button (g6 bg, g0 text, 4px 10px padding).
2. **Hero** — full-width `Split`, padded `64px 56px`. Left "write." numeral, right "read." numeral (ink color). Each side has a paragraph and a CTA.
3. **Pull quote** — `padding: 90px 56px`, `bg: g1`, italic display 56px, `text-wrap: balance`, max-width 920px, centered. Single word ("feature") in ink.
4. **Features** — 4 numbered rows. Grid `64px 1fr 2fr`. Number in mono 12 g3, title in UI 28 500, description in UI 16 g4. `1px solid g2` between rows.
5. **Stack** — two-column section. Left: italic display H2 "the *quiet* stack." Right: 6-row table with mono key (`ui`, `editor`, `markdown`, `realtime`, `styles`, `bundler`) and value (`React 19 · TanStack Router`, etc.). Hairline rules between rows.
6. **CTA** — final `Split` on `g6` background. Left: "ready when you are." (UI 64 500). Right: "open hiwrld.com →" button in inkSoft.
7. **Footer** — `padding: 14px 32px`, mono 11 g4, `© 2026 · MIT` left / `est. 2012 / reprinted 2026` right.

---

## Interactions & behavior

This handoff is for the brand surface — the landing page is mostly static. A few specifics:

- **Nav:** sticky to top, `position: sticky; top: 0; background: g0; z-index: 10`.
- **Buttons:** transitions on `background-color, color, border-color` only. `transition: 150ms ease`. No transform, no shadow.
- **Pull-quote:** the accent word ("feature") gets `color: ink`. No animation.
- **Hover states:** see Components section above.
- **No scroll-driven animation, no parallax.** The page is quiet.

For the actual product (the editor at `hiwrld.com/<slug>`), see the existing engineering brief — it's out of scope for this handoff. The `ProductEditor` artboard is a mock for brand context only.

---

## State management

Not applicable for the brand surface (landing page is static). The product app uses CodeMirror state + Supabase realtime — separate workstream.

---

## Assets to produce

- **Favicon set** — generate from the `short` wordmark (`hi*`) at 16, 32, 48, 64, 128, 180 (apple-touch), 192, 512. Plus a maskable icon variant with safe-zone padding. SVG master → PNG export.
- **OG card** — render at 1200×630 PNG. Static (no per-page dynamic OG for the brand site).
- **Wordmark SVGs** — export `primary`, `mono`, `reversed`, `short` as standalone SVGs for press / partners. Outlines, not live text (recipients won't have Maison Neue licensed).

All assets should bake in the licensed Maison Neue letterforms — do not ship live `<text>` in distributed SVGs.

---

## Out of scope

- The editor application (CodeMirror, realtime sync, persistence) — handled separately.
- Email / transactional templates — design TBD.
- Marketing collateral beyond OG — TBD.

---

## Questions?

The source of every measurement is `split-maison.jsx`. Open it, find the component named in this README, read the inline styles. If something contradicts, the JSX wins.
