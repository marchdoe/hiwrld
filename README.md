# hiwrld

[hiwrld.com](https://hiwrld.com) — a realtime, browser-based [Markdown](https://daringfireball.net/projects/markdown/) editor. Type on the left, read on the right, share the URL.

Best edited by one person at a time, but anyone with the URL can read along in realtime. No account, no signup, no toolbar — just markdown.

## Features

- **Live preview** — split-pane layout, write on the left, rendered on the right. Switch to read-only or write-only via the toolbar.
- **Realtime sync** — multiple tabs/devices on the same URL stay in sync. Backed by Supabase Realtime when configured, or a same-browser BroadcastChannel + localStorage fallback for local dev and offline use.
- **Document menu** — slide-in panel lists all your saved documents; create, switch, and delete without leaving the editor.
- **Smart typography** — straight quotes auto-curl, em-dashes preserved, Charter system serif for the read pane.
- **Syntax-highlighted code blocks** via [highlight.js](https://highlightjs.org) (13 languages: JS/TS, Python, Bash, JSON, CSS, HTML/XML, Markdown, YAML, Go, Rust, SQL).
- **YouTube embeds** — paste a `youtube.com/watch?v=…` link, get an inline player.
- **Sanitized output** — markdown is rendered through [DOMPurify](https://github.com/cure53/DOMPurify) to prevent XSS.
- **Offline-ready** — works without any backend; documents persist via localStorage even without a Supabase project.

## Quick start

```bash
pnpm install
pnpm dev             # Vite dev server → http://localhost:5173
```

No backend configuration required. Without Supabase, documents persist in localStorage and multi-tab editing within the same browser syncs via BroadcastChannel. Cross-device persistence requires a Supabase project (see below).

## Enable cross-device sync (Supabase)

The app is wired for Supabase — the client, query layer, and realtime subscription are all in place. To activate it:

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Create the `documents` table

Run this in the Supabase SQL editor:

```sql
create table documents (
  id         text        primary key,
  body       text        not null default '',
  title      text        not null default '',
  created    timestamptz not null default now(),
  updated_at timestamptz
);

alter table documents enable row level security;

-- No auth required — access is gated by the secrecy of the document ID.
create policy "public access"
  on documents for all
  using (true)
  with check (true);
```

### 3. Enable Realtime

In the Supabase dashboard: **Database → Replication → Tables**, enable `documents`. This is required for live cross-device sync.

### 4. Add your credentials

```bash
cp .env.example .env.local
```

Fill in your project values:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Both values are in your Supabase project under **Settings → API**.

### 5. Restart the dev server

```bash
pnpm dev
```

The app detects `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` at build time. When both are present, it switches from localStorage to Supabase for all reads, writes, and realtime subscriptions.

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Vite dev server with HMR on port 5173 |
| `pnpm build` | Production build to `dist/` |
| `pnpm preview` | Preview the production bundle locally |
| `pnpm server` | Express 5 static server (serves `dist/` on port 2000) |
| `pnpm start` | Alias for `pnpm server` |
| `pnpm check` | Biome lint + format check (no writes) |
| `pnpm check:write` | Apply all Biome auto-fixes |
| `pnpm lint` | Biome lint only |
| `pnpm format` | Biome format with `--write` |
| `pnpm analyze` | Fallow dead code + complexity audit |
| `pnpm analyze:ci` | Fallow audit in JSON mode (used by CI) |

## Testing

```bash
pnpm test             # Vitest unit + integration (jsdom)
pnpm test:watch       # Vitest in watch mode
pnpm test:coverage    # With v8 coverage report
pnpm test:e2e         # Playwright end-to-end (auto-builds + serves dist/)
pnpm test:e2e:ui      # Playwright UI mode
pnpm test:all         # Vitest then Playwright
```

### What's covered

- **Unit / integration (Vitest + React Testing Library)**: markdown pipeline (sanitization, smart quotes, code highlighting, YouTube parsing), `generateId`, `generateTitle`, `localSync` (BroadcastChannel fallback), `useDocument` hook, `useDocuments` hook, `SplitPane`, `DocumentMenu`, `Textarea`, and the Express server (CSP headers, helmet, SPA fallback) via `supertest`.
- **End-to-end (Playwright, Chromium)**: full document flow, multi-tab concurrent edits, localStorage persistence, XSS sanitization, document menu navigation, mode switching (split / read / write).

### Concurrency contract

The multi-tab e2e tests lock in **last-write-wins** convergence — all clients must arrive at the same final state, but character-level merge correctness is not asserted. This matches both `localStorage` set semantics and Supabase's upsert behaviour. The README's "best edited by one person at a time" warning reflects this intentional design.

### What's not covered

- Visual regression
- Cross-browser (Firefox / WebKit) — Chromium only
- Real Supabase project — unit tests stub the Supabase client; e2e exercises the localStorage/BroadcastChannel fallback path. Smoke-test against a real Supabase project before any backend change.
- Performance / load testing
- Accessibility audit

### CI

Two jobs run in parallel on every push and PR:

- **Unit & E2E tests** (`test` job) — runs Vitest + Playwright. Report-only; failures do not block merges while the suite stabilises. Playwright traces and coverage HTML are uploaded as artifacts (14-day retention).
- **Fallow analysis** (`analyze` job) — runs `fallow audit` and fails the build on any dead code, duplication, or complexity violation. This job enforces the quality gate.

## Stack

| Layer | What |
|---|---|
| Server | Express 5 + helmet + compression (ESM) |
| Bundler | Vite 7 |
| Linter / formatter | Biome 2 |
| Code analysis | Fallow 2 (dead code, duplication, complexity) |
| UI | React 19 + TanStack Router v1 |
| Data fetching | TanStack Query v5 |
| Editor | CodeMirror 6 (`@codemirror/lang-markdown`) |
| Markdown | markdown-it 14 + DOMPurify 3 |
| Syntax highlighting | highlight.js 11 (13 languages, tree-shaken) |
| Realtime backend | Supabase — with BroadcastChannel + localStorage fallback |
| Styles | Plain CSS, system font stacks (Charter for prose, `ui-monospace` for code) |
| Icons | Inline Lucide SVGs via CSS `mask-image` |

## Architecture

```
src/
├── main.tsx                     # React entry; registers hljs languages, mounts router
├── routeTree.gen.ts             # Auto-generated by TanStack Router Vite plugin
├── types/
│   └── document.ts              # Document interface, AppMode type
├── routes/
│   ├── __root.tsx               # Root layout (QueryClientProvider)
│   ├── index.tsx                # / → redirect to a new document ID
│   ├── $docId.tsx               # Layout route; validates docId format (7 alphanumeric chars)
│   ├── $docId.index.tsx         # /$docId → SplitPane in split mode
│   └── $docId.$mode.tsx         # /$docId/read or /$docId/write
├── components/
│   ├── SplitPane.tsx            # Top-level layout: manages mode, wires document data + panes
│   ├── WritePane.tsx            # Editor pane (plain textarea + document menu trigger)
│   ├── ReadPane.tsx             # Preview pane (renders sanitized markdown HTML)
│   ├── Article.tsx              # DOMPurify sanitized markdown renderer
│   ├── DocumentMenu.tsx         # Slide-in drawer listing saved documents
│   ├── DocumentMenuItem.tsx     # Single document row (navigate / delete)
│   └── Textarea.tsx             # Plain textarea fallback (with tab-key handler)
├── hooks/
│   ├── useDocument.ts           # Per-document state; Supabase or localSync; debounced save
│   └── useDocuments.ts          # Bookmark list persisted to localStorage
└── lib/
    ├── generateId.ts            # Cryptographically secure 7-char alphanumeric ID
    ├── generateTitle.ts         # Extracts title from first markdown heading
    ├── localSync.ts             # BroadcastChannel + localStorage offline sync
    ├── markdown.ts              # markdown-it pipeline: smart quotes, YouTube embeds, hljs
    └── supabase.ts              # Supabase client (null when env vars are absent)
```

### Data flow

- On load, `useDocument(id)` checks whether `supabase` is non-null.
  - **Supabase path**: fetches the document via TanStack Query, then subscribes to `postgres_changes` on the `documents` table for realtime updates. Writes are debounced 500 ms and sent as an upsert.
  - **LocalSync path**: reads initial state from `localStorage`, then subscribes to a `BroadcastChannel` for same-browser multi-tab sync. Writes are debounced 500 ms and written to `localStorage` + broadcast.
- `useDocuments` maintains a separate bookmark list (`hiwrld.bookmarks` in localStorage) so the document menu works in both modes.

## Privacy / external requests

The deployed page makes **zero** external runtime requests by default — no CDN fonts, no analytics, no trackers. The only external traffic is Supabase, and only when you configure it.

