# TODO

Pre-launch follow-ups for [hiwrld.com](https://hiwrld.com).

## Backend

- [ ] **Connect Supabase**
  - The app is fully wired (`src/lib/supabase.ts`, `useDocument.ts`); just needs a live project.
  - See the [README](README.md#enable-cross-device-sync-supabase) for the full setup steps: create project, run SQL schema, enable Realtime, add `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` to `.env.local`.
  - Smoke-test against real Supabase before deploying — unit tests stub the client, e2e uses the localStorage fallback.

## Branding assets

- [x] **Design and add the hiwrld favicon** — `hi*` mark, graphite bg. SVG master + PNG set at 16/32/48/64/96/128/180/192/512px + maskable variant. See `src/assets/favicon.svg` and `scripts/render-favicons.ts`.

- [x] **Add Open Graph + Twitter Card metadata** — OG card at 1200×630 (`public/og.png`). Rendered via Playwright from `src/assets/og-source.html`. Tags added to `index.html`.

## Code quality

- [ ] **Remove `useWindowWidth` dead code** — `src/hooks/useWindowWidth.ts` is not imported anywhere; leftover from the removed narrow-screen auto-force-write mode.
- [ ] **Drawer close on document navigation** — `closeMenu` exists in `WritePane` but is not passed into `DocumentMenu`. Pass it as an `onClose` prop to `<DocumentMenu currentDocId={docId} onClose={closeMenu} />`, thread it through to `DocumentMenuItem`, and call it on the `<Link onClick>` handler.

## Branding — deferred

- [ ] **Landing page copy** — all text on `hiwrld.com` (hero, pull quote, features, CTA) is first-pass placeholder. Edit copy in `src/routes/index.tsx` before launch.

- [ ] **License Maison Neue + Editorial New** — the brand typefaces (Milieu Grotesque + Pangram Pangram). Currently using Geist as a free first-pass. Swap is a one-line token change in `panda.config.ts` under `theme.tokens.fonts`.

- [ ] **Workspace API — direct doc URL 404** — navigating directly to `/:docId` returns "Not Found" when the workspace Express API (added in `vite.config.ts`) intercepts the request. Needs route-scoping fix so `/api/*` requests go to Express and all other URLs fall through to the SPA. Tracked separately with the workspace feature work.

## Upcoming features

- [ ] **Dark mode** — full app dark theme (write pane, read pane, toolbar, drawer). CSS custom properties on `:root` toggled via a `data-theme` attribute, persisted to localStorage. Design separately before implementing.
- [ ] **Markdown editor keyboard shortcuts** — Tier 3 shortcut set (Cmd+B bold, Cmd+I italic, Cmd+K link, Cmd+` code, Cmd+Shift+H heading, Cmd+Shift+. blockquote). Insert placeholder text when no selection, wrap selection when text is selected. Design in progress.

## Out of scope for v1 (parking-lot ideas)

- **MathJax** — removed for first release; can re-add via pnpm + dynamic-import on first `$$…$$` detection.
- **Subresource Integrity (SRI)** — no third-party CDN scripts at runtime; add hashes if a CDN script ever returns.
- **Cross-browser testing** — currently Chromium only; Firefox and WebKit passes would improve confidence.
- **Accessibility audit** — axe-core integration with Playwright would catch regressions automatically.
- **True collaborative editing** — current last-write-wins model matches the "best edited by one person" design; CRDT would be a significant scope increase.
