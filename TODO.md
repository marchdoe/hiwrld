# TODO

Pre-launch follow-ups for [hiwrld.com](https://hiwrld.com).

## Backend

- [ ] **Connect Supabase**
  - The app is fully wired (`src/lib/supabase.ts`, `useDocument.ts`); just needs a live project.
  - See the [README](README.md#enable-cross-device-sync-supabase) for the full setup steps: create project, run SQL schema, enable Realtime, add `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` to `.env.local`.
  - Smoke-test against real Supabase before deploying — unit tests stub the client, e2e uses the localStorage fallback.

## Branding assets

- [ ] **Design and add the hiwrld favicon**
  - Currently the page has no favicon (placeholder `<link rel="icon" href="data:," />` in `index.html` to suppress the browser's default `/favicon.ico` request).
  - Deliverables: `favicon.svg` (modern browsers), `favicon.ico` 32×32 (legacy/Windows), `apple-touch-icon.png` 180×180.
  - Drop them at the repo root; update `index.html` to reference each:
    ```html
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    ```
  - [realfavicongenerator.net](https://realfavicongenerator.net) handles all sizes if you have a single source SVG.

- [ ] **Add Open Graph + Twitter Card metadata**
  - Currently `index.html` has only `<meta name="description">`. Sharing on Slack / iMessage / Twitter / LinkedIn shows no preview card.
  - Add to `<head>` in `index.html`:
    ```html
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="hiwrld" />
    <meta property="og:title" content="hiwrld" />
    <meta property="og:description" content="Realtime Markdown editor — write on the left, read on the right, share the URL." />
    <meta property="og:url" content="https://hiwrld.com" />
    <meta property="og:image" content="https://hiwrld.com/og.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="hiwrld" />
    <meta name="twitter:description" content="Realtime Markdown editor — write on the left, read on the right, share the URL." />
    <meta name="twitter:image" content="https://hiwrld.com/og.png" />
    ```
  - Design and add the OG image: `og.png`, 1200×630, drop at repo root.
  - Test with [opengraph.xyz](https://www.opengraph.xyz) and Twitter's [Card Validator](https://cards-dev.twitter.com/validator) once deployed.

## Code quality

- [ ] **Remove `useWindowWidth` dead code** — `src/hooks/useWindowWidth.ts` is not imported anywhere; leftover from the removed narrow-screen auto-force-write mode.
- [ ] **Drawer close on document navigation** — clicking a document link in the slide-in panel navigates correctly but leaves the drawer open. Pass an `onClose` callback through `DocumentMenu` → `DocumentMenuItem`.

## Out of scope for v1 (parking-lot ideas)

- **MathJax** — removed for first release; can re-add via npm + dynamic-import on first `$$…$$` detection.
- **Subresource Integrity (SRI)** — no third-party CDN scripts at runtime; add hashes if a CDN script ever returns.
- **Cross-browser testing** — currently Chromium only; Firefox and WebKit passes would improve confidence.
- **Accessibility audit** — axe-core integration with Playwright would catch regressions automatically.
- **True collaborative editing** — current last-write-wins model matches the "best edited by one person" design; CRDT would be a significant scope increase.
