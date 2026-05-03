# React 19 Migration Design

**Status:** Draft / Pending approval
**Date:** 2026-05-02
**Owner:** Doug March
**Related:** Task #1 (Migrate Firebase → Supabase — must land first or concurrently), Task #4 (Assess whether to replace Backbone)

## Context

hiwrld currently runs on Backbone 1.6 + jQuery 3.7 + Underscore 1.13 (~43KB gz). The app is ~600 lines of application logic across 6 source files. The user base is pre-launch. This spec covers a pure migration — same features, different framework — with no new functionality added.

The markdown engine is being swapped in a separate session. `src/markdown.js` (now `src/markdown.ts` post-migration) is treated as a stable boundary; its internal implementation is out of scope.

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Framework | **React 19** | Ecosystem depth, hiring pool, mobile path (React Native), user preference |
| Router | **TanStack Router** (same team, file-based, type-safe) | Native `createBrowserHistory`, typed params, works with TanStack Query |
| Async/server state | **TanStack Query** | Native pattern for this stack; Supabase subscriptions via `invalidateQueries` |
| TypeScript | **Strict (`strict: true`)** | User preference; React 19 ecosystem is TS-first |
| Styling | **Plain CSS — keep `hiwrld.css` unchanged** | Pure migration, no design changes; PandaCSS available as a future upgrade path |
| Routing mode | **History-based** (`createBrowserHistory`) | TanStack Router default; server SPA fallback already in place |
| Backend | **Supabase** | Designed for Supabase from the start; task #1 lands first |
| Migration strategy | **Atomic branch rewrite** | App is ~600 lines; Playwright e2e suite provides the completion signal |

## What is replaced

| Backbone primitive | React equivalent |
|---|---|
| `AppModel` (current doc, mode state) | TanStack Router route params (`$docId`, optional `$mode`) |
| `AppModel` (bookmark list) | `useDocuments` hook — localStorage read/write + `storage` event |
| `DocumentModel` (body, title, realtime sync) | `useDocument` hook — TanStack Query + Supabase realtime channel |
| `DocumentCollection` | TanStack Query cache (bookmark IDs → query keys) |
| `AppView` | `SplitPane`, `WritePane`, `ReadPane` components |
| `DocumentMenuView` | `DocumentMenu` + `DocumentMenuItem` components |
| Backbone events hash | React `onChange`, `onClick`, `onKeyUp` props |
| `Backbone.Router` + `Backbone.history` | TanStack Router `createBrowserHistory()` |

**Dropped from `package.json`:** `backbone`, `jquery`, `underscore` (~43KB gz removed)

**Added to `package.json`:** `react`, `react-dom`, `@tanstack/react-router`, `@tanstack/react-query`, `@supabase/supabase-js`, `typescript` (~72KB gz added — net ~+29KB gz, known tradeoff)

**Added to devDependencies:** `@types/react`, `@types/react-dom`, `@testing-library/react`, `@testing-library/user-event`

## File structure

```
src/
  main.tsx                    # React entry point — replaces main.js
  router.tsx                  # TanStack Router root + route tree definition
  
  types/
    document.ts               # Shared TypeScript types
    
  lib/
    supabase.ts               # Supabase client — replaces firebase.js
    localSync.ts              # BroadcastChannel fallback — extracted from firebase.js
    markdown.ts               # Renamed from markdown.js — logic untouched
    generateId.ts             # generateDocumentId() extracted to pure utility
    
  hooks/
    useDocument.ts            # TanStack Query + Supabase realtime for one document
    useDocuments.ts           # Bookmark list (localStorage + storage event)
    useWindowWidth.ts         # Narrow-screen detection (replaces onWindowResize logic)
    
  components/
    SplitPane.tsx             # Outer layout — read/write mode, narrow-screen state
    WritePane.tsx             # Left half — textarea, toolbar buttons, menu drawer
    ReadPane.tsx              # Right half — rendered article, read-only button
    Textarea.tsx              # Controlled textarea — onChange binds to setBody
    Article.tsx               # Rendered markdown — dangerouslySetInnerHTML + post-render effects
    DocumentMenu.tsx          # Drawer — reads from useDocuments(), animated open/close
    DocumentMenuItem.tsx      # Single row — title + delete button
    
  routes/
    __root.tsx                # Root layout — QueryClientProvider, global CSS import
    index.tsx                 # "/" → redirect to "/$generateDocumentId()"
    $docId.tsx                # "/$docId" — loads doc, renders SplitPane (no mode)
    $docId.$mode.tsx          # "/$docId/read" or "/$docId/write" — typed mode param

```

**Deleted:**
- `src/app/app-model.js`
- `src/app/app-view.js`
- `src/document/document-model.js`
- `src/document/document-collection.js`
- `src/document/document-menu-view.js`
- `src/firebase.js`

## TypeScript types

```ts
// src/types/document.ts

export interface Document {
  id: string
  body: string
  title: string
  created: string       // ISO 8601 timestamp
  updated_at?: string
}

export type AppMode = 'read' | 'write'
```

## Route structure

```
/                         → redirect to /<newDocId>  (generateDocumentId())
/$docId                   → SplitPane, no forced mode
/$docId/read              → SplitPane, read-only mode
/$docId/write             → SplitPane, write-only mode
```

`$docId` is typed as `string` (7-char alphanumeric, validated upstream). `$mode` is typed as `AppMode` — invalid values redirect to `/$docId`. TanStack Router validates params at the route level.

`index.tsx` loader generates a new doc ID and redirects. First-visit behavior is identical to current.

## Data layer

### `src/lib/supabase.ts`

Replaces `firebase.js`. Exports a nullable Supabase client (null when `VITE_SUPABASE_URL` is unset) and the `localSync` BroadcastChannel fallback (null when Supabase is configured).

```ts
export const supabase = import.meta.env.VITE_SUPABASE_URL
  ? createClient<Database>(url, anonKey)
  : null

export const localSync = supabase ? null : { subscribe, publish }
```

Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (replacing `VITE_FIREBASE_*`).

### `src/hooks/useDocument.ts`

Core hook. Replaces `DocumentModel`. Returns `{ body, title, setBody }`.

**With Supabase:**
- `useQuery` for initial fetch from `documents` table filtered by `id`
- `useEffect` opens a `postgres_changes` channel on `documents` filtered by `id=eq.$docId`; incoming changes call `queryClient.invalidateQueries`
- `setBody` is debounced 500ms, writes to Supabase via `upsert`

**Without Supabase:**
- `useEffect` calls `localSync.subscribe('documents/$docId', ...)` — sets local state on incoming messages
- `setBody` is debounced 500ms, calls `localSync.publish`

`generateTitle(body)` (heading extraction → date-based fallback) is extracted to a pure utility function in `src/lib/` and called inside the hook on every body change.

### `src/hooks/useDocuments.ts`

Replaces the bookmark list in `AppModel` + `DocumentCollection`. Returns `{ ids, add, remove }`.

- Reads/writes `hiwrld.bookmarks` in localStorage (comma-separated IDs)
- Listens to `storage` event for cross-tab bookmark sync
- `add(id)` appends to the list; `remove(id)` filters it out and navigates to the last remaining doc (or creates a new one) — mirrors `onDocumentRemove` behavior

## Component notes

**`SplitPane.tsx`** — reads `$docId` and `$mode` from TanStack Router context. Manages narrow-screen auto-force-write via `useWindowWidth` hook (threshold: `MINIMUM_WIDTH = 1000`). Tracks `_autoForcedState` equivalent — restores null mode when viewport widens past threshold. Applies `read-only` / `write-only` CSS classes to `document.documentElement` (same as current).

**`Textarea.tsx`** — controlled input. `onChange` fires on every keystroke (React's synthetic event model), calling `setBody`. Handles Tab insertion via `onKeyDown`. No `dispatchEvent('keyup')` workaround needed — `onChange` is the correct React event.

**`Article.tsx`** — calls `renderMarkdown(body)` and sets `dangerouslySetInnerHTML` (safe — DOMPurify ran inside `renderMarkdown`). Post-render `useEffect` runs `hljs.highlightElement` on `pre code` blocks and substitutes YouTube links with iframes (debounced 1s, same as current).

**`DocumentMenu.tsx`** — drawer open/close via CSS transition on a `data-open` attribute, replacing jQuery `slideToggle`. `useDocuments()` provides the bookmark list.

**`DocumentMenuItem.tsx`** — renders title as text content (XSS-safe, no `dangerouslySetInnerHTML`). TanStack Router `<Link to="/$docId">` for navigation. Delete button calls `useDocuments().remove(id)`.

## Test migration

**Survive unchanged (30 tests):**
- `src/markdown.test.ts` (17) — pure functions, rename only
- `server.test.ts` (8) — server unchanged
- `e2e/sanitization.spec.js` (4) — framework-agnostic HTML assertions
- `e2e/persistence.spec.js` (3) — localStorage behavior, framework-agnostic

**Playwright e2e — minor updates (18 tests):**
- `fillTextarea` helper simplifies — remove `dispatchEvent('keyup')` workaround; React `onChange` fires natively on `fill()`
- `waitForURL(/#/)` guards removed — no hash routing
- `openDoc` helper simplifies — `goto('/') + waitForURL(/\/[A-Za-z0-9]{7}/)`
- All 5 spec files need these touch-ups; assertions themselves are unchanged

**Rewrite for React (29 tests):**
- Backbone model/view tests replaced with `@testing-library/react` + `renderHook` tests
- New test targets: `useDocument` hook, `useDocuments` hook, `DocumentMenu` component, `SplitPane`, `Textarea`
- Firebase mocks (`__mocks__/firebase/`) replaced with Supabase mocks (`__mocks__/@supabase/`)
- `@testing-library/user-event` replaces manual `dispatchEvent` workarounds

**Completion signal:** All 22 Playwright e2e tests passing = feature parity confirmed.

## Supabase schema (from task #1 spec)

```sql
create table documents (
  id         text primary key,
  body       text,
  title      text,
  created    timestamptz default now(),
  updated_at timestamptz
);
-- RLS: anon role reads/writes by exact id match, no list
```

## Out of scope

- New features (document sharing improvements, user accounts, collaborative editing)
- PandaCSS or CSS Modules adoption (future upgrade path)
- React Native / mobile
- SSR or Nuxt-style server rendering
- `strict: false` → `strict: true` incremental tightening (starts strict from day one)
- The markdown engine swap (happening in a separate session; `src/markdown.ts` is a stable boundary)
