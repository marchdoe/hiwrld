# React 19 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Backbone/jQuery/Underscore UI layer with React 19 + TanStack Router + TanStack Query + strict TypeScript, preserving all existing behaviour.

**Architecture:** Atomic branch rewrite — one branch, all Backbone source files replaced with React components/hooks, old files deleted when the Playwright suite goes green. Supabase is the assumed backend (task #1 must land first); BroadcastChannel fallback retained for local dev.

**Tech Stack:** React 19, TanStack Router (file-based, `createBrowserHistory`), TanStack Query, Supabase JS v2, TypeScript 5 (`strict: true`), Vite 7, Biome 2, Vitest 1, Playwright, `@testing-library/react`, `@testing-library/user-event`.

**Spec:** `docs/superpowers/specs/2026-05-02-react-migration-design.md`

---

## File structure

**Created:**
```
src/types/document.ts
src/lib/generateId.ts
src/lib/markdown.ts          (renamed from src/markdown.js)
src/lib/supabase.ts          (replaces src/firebase.js)
src/lib/localSync.ts         (extracted from src/firebase.js)
src/hooks/useDocuments.ts
src/hooks/useWindowWidth.ts
src/hooks/useDocument.ts
src/components/Article.tsx
src/components/Textarea.tsx
src/components/DocumentMenuItem.tsx
src/components/DocumentMenu.tsx
src/components/WritePane.tsx
src/components/ReadPane.tsx
src/components/SplitPane.tsx
src/routes/__root.tsx
src/routes/index.tsx
src/routes/$docId.tsx
src/routes/$docId.$mode.tsx
src/main.tsx
```

**Deleted:**
```
src/app/app-model.js
src/app/app-view.js
src/document/document-model.js
src/document/document-collection.js
src/document/document-menu-view.js
src/firebase.js
src/main.js
```

**Modified:**
```
package.json               (add React deps, remove Backbone/jQuery/Underscore)
vite.config.ts             (rename + add React and TanStack Router plugins)
index.html                 (point to src/main.tsx)
tsconfig.json              (new — strict TypeScript)
vitest.config.ts           (update for React + jsdom)
test/setup.ts              (update for React Testing Library)
__mocks__/@supabase/       (replace __mocks__/firebase/)
e2e/                       (update helpers, remove hash-router patterns)
```

---

## Task 1: Install dependencies and configure TypeScript + Vite

**Files:**
- Modify: `package.json`
- Create: `tsconfig.json`
- Rename+modify: `vite.config.js` → `vite.config.ts`

- [ ] **Step 1: Install new runtime dependencies**

```bash
npm install react@^19.0.0 react-dom@^19.0.0 \
  @tanstack/react-router@^1.50.0 \
  @tanstack/react-query@^5.50.0 \
  @supabase/supabase-js@^2.45.0
```

- [ ] **Step 2: Install new dev dependencies**

```bash
npm install --save-dev \
  @vitejs/plugin-react@^4.3.0 \
  @tanstack/router-vite-plugin@^1.50.0 \
  @tanstack/router-devtools@^1.50.0 \
  @types/react@^19.0.0 \
  @types/react-dom@^19.0.0 \
  @testing-library/react@^16.0.0 \
  @testing-library/user-event@^14.5.0 \
  @testing-library/jest-dom@^6.4.0 \
  typescript@^5.5.0
```

- [ ] **Step 3: Remove Backbone, jQuery, Underscore**

```bash
npm uninstall backbone jquery underscore
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "baseUrl": "."
  },
  "include": ["src", "test", "server.ts"]
}
```

- [ ] **Step 5: Rename and update `vite.config.js` → `vite.config.ts`**

Delete `vite.config.js` and create `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite({ routesDirectory: 'src/routes', generatedRouteTree: 'src/routeTree.gen.ts' }),
  ],
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: true,
  },
  server: {
    port: 5173,
    open: true,
  },
})
```

- [ ] **Step 6: Update `index.html` to point at the new entry point**

Change the script tag from:
```html
<script type="module" src="/src/main.js"></script>
```
to:
```html
<script type="module" src="/src/main.tsx"></script>
```

- [ ] **Step 7: Update Biome config to handle TSX**

In `biome.json`, ensure the `files` include section covers `.ts` and `.tsx`. Add to the overrides if needed:

```json
{
  "files": {
    "include": ["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx"]
  }
}
```

- [ ] **Step 8: Verify the project still builds (old main.js still exists, ignore TSX errors)**

```bash
npm run build 2>&1 | tail -5
```

Expected: build succeeds (old `main.js` is still referenced). TypeScript errors will appear once we add `.tsx` files — that is expected and handled in later tasks.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html biome.json
git rm vite.config.js
git commit -m "chore(react-migration): install React 19 + TanStack + TS deps, configure Vite"
```

---

## Task 2: Core types and pure utilities

**Files:**
- Create: `src/types/document.ts`
- Create: `src/lib/generateId.ts`
- Rename: `src/markdown.js` → `src/lib/markdown.ts`

- [ ] **Step 1: Create `src/types/document.ts`**

```ts
export interface Document {
  id: string
  body: string
  title: string
  created: string       // ISO 8601
  updated_at?: string
}

export type AppMode = 'read' | 'write'
```

- [ ] **Step 2: Write a failing test for `generateDocumentId`**

Create `src/lib/generateId.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generateDocumentId } from './generateId'

describe('generateDocumentId', () => {
  it('returns a 7-character alphanumeric string', () => {
    const id = generateDocumentId()
    expect(id).toMatch(/^[A-Za-z0-9]{7}$/)
  })

  it('generates unique ids across 100 calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateDocumentId()))
    expect(ids.size).toBe(100)
  })
})
```

- [ ] **Step 3: Run to confirm FAIL**

```bash
npx vitest run src/lib/generateId.test.ts
```

Expected: FAIL — cannot find module `./generateId`.

- [ ] **Step 4: Create `src/lib/generateId.ts`**

```ts
const ID_CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
const ID_LENGTH = 7

export function generateDocumentId(): string {
  let id = ''
  for (let i = 0; i < ID_LENGTH; i++) {
    id += ID_CHARACTERS.charAt(Math.floor(Math.random() * 62))
  }
  return id
}
```

- [ ] **Step 5: Run to confirm PASS**

```bash
npx vitest run src/lib/generateId.test.ts
```

Expected: 2 passed.

- [ ] **Step 6: Rename `src/markdown.js` → `src/lib/markdown.ts`**

Copy the file (rename, no logic changes — the markdown engine swap is in a separate session):

```bash
cp src/markdown.js src/lib/markdown.ts
```

Add type annotations to the function signatures only (keep implementations identical):

```ts
// Add return types — implementations unchanged
export function applySmartQuotes(html: string): string { ... }
export function renderMarkdown(body: string): string { ... }
export function extractYoutubeId(href: string): string | null { ... }
export function youtubeEmbed(id: string): string { ... }
```

- [ ] **Step 7: Update `src/markdown.test.js` import path**

In `src/markdown.test.js`, change:
```js
import { renderMarkdown, applySmartQuotes, extractYoutubeId } from './markdown.js'
```
to:
```js
import { renderMarkdown, applySmartQuotes, extractYoutubeId } from './lib/markdown.ts'
```

Rename the test file to `src/lib/markdown.test.ts` as well.

- [ ] **Step 8: Run markdown tests to confirm they still pass**

```bash
npx vitest run src/lib/markdown.test.ts
```

Expected: 17 passed.

- [ ] **Step 9: Commit**

```bash
git add src/types/document.ts src/lib/generateId.ts src/lib/generateId.test.ts \
        src/lib/markdown.ts src/lib/markdown.test.ts
git rm src/markdown.js src/markdown.test.js
git commit -m "feat(react-migration): add core types, generateId, move markdown to src/lib"
```

---

## Task 3: Supabase client and BroadcastChannel fallback

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/localSync.ts`
- Create: `src/lib/supabase.test.ts`
- Create: `src/lib/localSync.test.ts`

- [ ] **Step 1: Write failing test for localSync**

Create `src/lib/localSync.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { localSync } from './localSync'

describe('localSync', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('publish writes to localStorage with hiwrld:sync: prefix', () => {
    localSync.publish('documents/abc', { body: 'hello' })
    expect(localStorage.getItem('hiwrld:sync:documents/abc')).toBe(JSON.stringify({ body: 'hello' }))
  })

  it('subscribe replays last value to new subscriber', () => {
    localStorage.setItem('hiwrld:sync:documents/xyz', JSON.stringify({ body: 'cached' }))
    const cb = vi.fn()
    const unsub = localSync.subscribe('documents/xyz', cb)
    expect(cb).toHaveBeenCalledWith({ body: 'cached' })
    unsub()
  })

  it('subscribe ignores corrupt JSON in localStorage', () => {
    localStorage.setItem('hiwrld:sync:documents/bad', '{not-json')
    const cb = vi.fn()
    const unsub = localSync.subscribe('documents/bad', cb)
    expect(cb).not.toHaveBeenCalled()
    unsub()
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
npx vitest run src/lib/localSync.test.ts
```

Expected: FAIL — cannot find module `./localSync`.

- [ ] **Step 3: Create `src/lib/localSync.ts`**

```ts
const PREFIX = 'hiwrld:sync:'

export const localSync = {
  subscribe(path: string, callback: (val: unknown) => void): () => void {
    const key = PREFIX + path
    const channel = new BroadcastChannel(key)
    channel.addEventListener('message', (event) => callback(event.data))
    const stored = localStorage.getItem(key)
    if (stored) {
      try { callback(JSON.parse(stored)) } catch { /* ignore corrupt entries */ }
    }
    return () => channel.close()
  },

  publish(path: string, value: unknown): void {
    const key = PREFIX + path
    localStorage.setItem(key, JSON.stringify(value))
    const channel = new BroadcastChannel(key)
    channel.postMessage(value)
    channel.close()
  },
}
```

- [ ] **Step 4: Run to confirm PASS**

```bash
npx vitest run src/lib/localSync.test.ts
```

Expected: 3 passed.

- [ ] **Step 5: Create `src/lib/supabase.ts`**

No test needed — this is pure configuration wiring. Verify via integration in later tasks.

```ts
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Document } from '../types/document'

interface Database {
  public: {
    Tables: {
      documents: {
        Row: Document
        Insert: Omit<Document, 'created' | 'updated_at'>
        Update: Partial<Document>
      }
    }
  }
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient<Database> | null =
  url && anonKey ? createClient<Database>(url, anonKey) : null
```

- [ ] **Step 6: Update `.env.example`**

Replace the Firebase env vars:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/supabase.ts src/lib/localSync.ts src/lib/localSync.test.ts .env.example
git commit -m "feat(react-migration): add Supabase client and BroadcastChannel localSync"
```

---

## Task 4: Supabase mock for tests

Replace `__mocks__/firebase/` with `__mocks__/@supabase/`.

**Files:**
- Delete: `__mocks__/firebase/app.js`, `__mocks__/firebase/database.js`
- Delete: `test/firebase-fake.js`
- Create: `__mocks__/@supabase/supabase-js.ts`
- Create: `test/supabase-fake.ts`

- [ ] **Step 1: Remove old Firebase mocks**

```bash
git rm __mocks__/firebase/app.js __mocks__/firebase/database.js test/firebase-fake.js
rm -rf __mocks__/firebase
```

- [ ] **Step 2: Create `__mocks__/@supabase/supabase-js.ts`**

```ts
import { vi } from 'vitest'

// In-memory store: docId → Document partial
const store = new Map<string, Record<string, unknown>>()
// Realtime listeners: channel key → callback
const listeners = new Map<string, Set<(payload: unknown) => void>>()

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}

const mockFrom = (table: string) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn((col: string, val: string) => ({
    single: vi.fn(() => Promise.resolve({ data: store.get(val) ?? null, error: null })),
  })),
  upsert: vi.fn((data: Record<string, unknown>) => {
    const id = data['id'] as string
    store.set(id, { ...(store.get(id) ?? {}), ...data })
    // Notify listeners
    const key = `document:${id}`
    for (const cb of listeners.get(key) ?? []) cb({ new: store.get(id) })
    return Promise.resolve({ error: null })
  }),
})

export const createClient = vi.fn(() => ({
  from: vi.fn(mockFrom),
  channel: vi.fn((key: string) => {
    const channelObj = {
      on: vi.fn((_event: string, _opts: unknown, cb: (payload: unknown) => void) => {
        if (!listeners.has(key)) listeners.set(key, new Set())
        listeners.get(key)!.add(cb)
        return channelObj
      }),
      subscribe: vi.fn(() => channelObj),
    }
    return channelObj
  }),
  removeChannel: vi.fn(),
}))

export const __resetStore = () => { store.clear(); listeners.clear() }
export const __setDoc = (id: string, data: Record<string, unknown>) => {
  store.set(id, data)
  const key = `document:${id}`
  for (const cb of listeners.get(key) ?? []) cb({ new: data })
}
export const __getStore = () => store
```

- [ ] **Step 3: Create `test/supabase-fake.ts`**

```ts
export { __resetStore as resetStore, __setDoc as setDoc, __getStore as getStore } from '@supabase/supabase-js'
```

- [ ] **Step 4: Update `test/setup.ts`**

Replace Firebase env stubs with Supabase env stubs in `test/setup.ts`:

```ts
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Backbone needed jQuery on window — no longer needed with React.
// Keep jsdom BroadcastChannel (ships natively in jsdom 24+).

vi.stubEnv('VITE_SUPABASE_URL', 'https://fake.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'fake-anon-key')
```

- [ ] **Step 5: Update `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'server.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx', 'server.ts'],
      exclude: ['src/main.tsx', 'src/routeTree.gen.ts', '**/*.test.*', 'dist/**', 'e2e/**'],
    },
  },
})
```

- [ ] **Step 6: Run server test to confirm it still passes (unchanged)**

```bash
npx vitest run server.test.ts
```

Expected: 8 passed.

- [ ] **Step 7: Commit**

```bash
git add __mocks__/@supabase/supabase-js.ts test/supabase-fake.ts test/setup.ts vitest.config.ts
git commit -m "test(react-migration): replace Firebase mocks with Supabase mocks"
```

---

## Task 5: `useDocuments` hook (bookmark list)

**Files:**
- Create: `src/hooks/useDocuments.ts`
- Create: `src/hooks/useDocuments.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/useDocuments.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDocuments } from './useDocuments'

describe('useDocuments', () => {
  beforeEach(() => localStorage.clear())

  it('starts with an empty list when localStorage has no bookmarks', () => {
    const { result } = renderHook(() => useDocuments())
    expect(result.current.docs).toEqual([])
  })

  it('hydrates from hiwrld.bookmarks in localStorage', () => {
    localStorage.setItem('hiwrld.bookmarks', JSON.stringify([
      { id: 'aaa1111', title: 'First' },
      { id: 'bbb2222', title: 'Second' },
    ]))
    const { result } = renderHook(() => useDocuments())
    expect(result.current.docs).toHaveLength(2)
    expect(result.current.docs[0]).toEqual({ id: 'aaa1111', title: 'First' })
  })

  it('add() appends a doc with empty title', () => {
    const { result } = renderHook(() => useDocuments())
    act(() => result.current.add('newid1'))
    expect(result.current.docs).toEqual([{ id: 'newid1', title: '' }])
    expect(JSON.parse(localStorage.getItem('hiwrld.bookmarks')!)).toEqual([{ id: 'newid1', title: '' }])
  })

  it('remove() filters out the doc by id', () => {
    localStorage.setItem('hiwrld.bookmarks', JSON.stringify([{ id: 'aaa', title: 'A' }, { id: 'bbb', title: 'B' }]))
    const { result } = renderHook(() => useDocuments())
    act(() => result.current.remove('aaa'))
    expect(result.current.docs).toEqual([{ id: 'bbb', title: 'B' }])
  })

  it('setTitle() updates the title for a doc id', () => {
    localStorage.setItem('hiwrld.bookmarks', JSON.stringify([{ id: 'aaa', title: '' }]))
    const { result } = renderHook(() => useDocuments())
    act(() => result.current.setTitle('aaa', 'My Doc'))
    expect(result.current.docs[0]?.title).toBe('My Doc')
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
npx vitest run src/hooks/useDocuments.test.ts
```

Expected: FAIL — cannot find module `./useDocuments`.

- [ ] **Step 3: Create `src/hooks/useDocuments.ts`**

```ts
import { useState, useEffect, useCallback } from 'react'

const BOOKMARKS_KEY = 'hiwrld.bookmarks'

export interface BookmarkEntry {
  id: string
  title: string
}

function readDocs(): BookmarkEntry[] {
  const raw = localStorage.getItem(BOOKMARKS_KEY)
  if (!raw) return []
  try { return JSON.parse(raw) as BookmarkEntry[] } catch { return [] }
}

function writeDocs(docs: BookmarkEntry[]): void {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(docs))
}

interface UseDocumentsResult {
  docs: BookmarkEntry[]
  add: (id: string) => void
  remove: (id: string) => void
  setTitle: (id: string, title: string) => void
}

export function useDocuments(): UseDocumentsResult {
  const [docs, setDocs] = useState<BookmarkEntry[]>(readDocs)

  useEffect(() => {
    const handler = () => setDocs(readDocs())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const add = useCallback((id: string) => {
    setDocs((prev) => {
      if (prev.some((d) => d.id === id)) return prev
      const next = [...prev, { id, title: '' }]
      writeDocs(next)
      return next
    })
  }, [])

  const remove = useCallback((id: string) => {
    setDocs((prev) => {
      const next = prev.filter((d) => d.id !== id)
      writeDocs(next)
      return next
    })
  }, [])

  const setTitle = useCallback((id: string, title: string) => {
    setDocs((prev) => {
      const next = prev.map((d) => d.id === id ? { ...d, title } : d)
      writeDocs(next)
      return next
    })
  }, [])

  return { docs, add, remove, setTitle }
}
```

- [ ] **Step 4: Run to confirm PASS**

```bash
npx vitest run src/hooks/useDocuments.test.ts
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDocuments.ts src/hooks/useDocuments.test.ts
git commit -m "feat(react-migration): add useDocuments hook with localStorage bookmark list"
```

---

## Task 6: `useWindowWidth` and `generateTitle` utility

**Files:**
- Create: `src/hooks/useWindowWidth.ts`
- Create: `src/lib/generateTitle.ts`
- Create: `src/lib/generateTitle.test.ts`

- [ ] **Step 1: Write failing test for generateTitle**

Create `src/lib/generateTitle.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generateTitle } from './generateTitle'

describe('generateTitle', () => {
  it('returns Untitled with date when body has no heading', () => {
    const title = generateTitle('just plain text', new Date('2026-05-02'))
    expect(title).toMatch(/^Untitled - Friday, May 2nd, 2026$/)
  })

  it('extracts the first H1 as title', () => {
    expect(generateTitle('# My Heading\n\nbody')).toBe('My Heading')
  })

  it('extracts H2-H6 when no H1', () => {
    expect(generateTitle('### deep\n\nbody')).toBe('deep')
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
npx vitest run src/lib/generateTitle.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Create `src/lib/generateTitle.ts`**

```ts
const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
const nths: Record<number, string> = { 1:'st', 2:'nd', 3:'rd', 21:'st', 22:'nd', 23:'rd', 31:'st' }

export function generateTitle(body: string, created: Date = new Date()): string {
  const m = body.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/m)
  if (m?.[1]) return m[1].trim()
  const day = days[created.getDay()]!
  const month = months[created.getMonth()]!
  const date = created.getDate()
  const nth = nths[date] ?? 'th'
  return `Untitled - ${day}, ${month} ${date}${nth}, ${created.getFullYear()}`
}
```

- [ ] **Step 4: Run to confirm PASS**

```bash
npx vitest run src/lib/generateTitle.test.ts
```

Expected: 3 passed.

- [ ] **Step 5: Create `src/hooks/useWindowWidth.ts`**

No test needed — simple browser API wrapper verified by Playwright.

```ts
import { useState, useEffect } from 'react'

export function useWindowWidth(): number {
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/generateTitle.ts src/lib/generateTitle.test.ts src/hooks/useWindowWidth.ts
git commit -m "feat(react-migration): add generateTitle utility and useWindowWidth hook"
```

---

## Task 7: `useDocument` hook (core — Supabase + BroadcastChannel)

**Files:**
- Create: `src/hooks/useDocument.ts`
- Create: `src/hooks/useDocument.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/useDocument.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useDocument } from './useDocument'
import { resetStore, setDoc } from '../../test/supabase-fake'

vi.mock('@supabase/supabase-js')

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useDocument', () => {
  beforeEach(() => {
    resetStore()
    localStorage.clear()
  })

  it('starts loading then resolves body from Supabase', async () => {
    setDoc('abc1234', { id: 'abc1234', body: '# Hello', title: 'Hello', created: new Date().toISOString() })
    const { result } = renderHook(() => useDocument('abc1234'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.body).toBe('# Hello')
  })

  it('derives title from H1 in body', async () => {
    setDoc('abc1234', { id: 'abc1234', body: '# My Title', title: 'My Title', created: new Date().toISOString() })
    const { result } = renderHook(() => useDocument('abc1234'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.title).toBe('My Title')
  })

  it('setBody updates body and schedules a debounced save', async () => {
    vi.useFakeTimers()
    setDoc('abc1234', { id: 'abc1234', body: '', title: '', created: new Date().toISOString() })
    const { result } = renderHook(() => useDocument('abc1234'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.setBody('new body'))
    expect(result.current.body).toBe('new body')

    await act(async () => { vi.advanceTimersByTime(600) })
    const { getStore } = await import('../../test/supabase-fake')
    expect(getStore().get('abc1234')?.['body']).toBe('new body')
    vi.useRealTimers()
  })

  it('updates live when a remote change arrives via Supabase channel', async () => {
    setDoc('abc1234', { id: 'abc1234', body: 'initial', title: 'Untitled', created: new Date().toISOString() })
    const { result } = renderHook(() => useDocument('abc1234'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => setDoc('abc1234', { id: 'abc1234', body: 'from remote', title: 'from remote', created: new Date().toISOString() }))
    await waitFor(() => expect(result.current.body).toBe('from remote'))
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
npx vitest run src/hooks/useDocument.test.tsx
```

Expected: FAIL — cannot find module `./useDocument`.

- [ ] **Step 3: Create `src/hooks/useDocument.ts`**

```ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { localSync } from '../lib/localSync'
import { generateTitle } from '../lib/generateTitle'
import type { Document } from '../types/document'

export interface UseDocumentResult {
  body: string
  title: string
  isLoading: boolean
  setBody: (body: string) => void
}

export function useDocument(id: string): UseDocumentResult {
  const [body, setBodyState] = useState('')
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const path = `documents/${id}`

  // Initial load
  useEffect(() => {
    setIsLoading(true)
    if (supabase) {
      supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => {
          const doc = data as Document | null
          setBodyState(doc?.body ?? '')
          setTitle(doc?.title ?? generateTitle(doc?.body ?? '', new Date(doc?.created ?? Date.now())))
          setIsLoading(false)
        })
    } else {
      const stored = localStorage.getItem(`hiwrld:sync:${path}`)
      if (stored) {
        try {
          const val = JSON.parse(stored) as Partial<Document>
          setBodyState(val.body ?? '')
          setTitle(val.title ?? generateTitle(val.body ?? ''))
        } catch { /* ignore corrupt */ }
      }
      setIsLoading(false)
    }
  }, [id])

  // Realtime subscription
  useEffect(() => {
    if (supabase) {
      const channel = supabase
        .channel(`document:${id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'documents', filter: `id=eq.${id}` },
          (payload: { new: Document }) => {
            const doc = payload.new
            setBodyState(doc.body ?? '')
            setTitle(doc.title ?? generateTitle(doc.body ?? '', new Date(doc.created)))
            queryClient.invalidateQueries({ queryKey: ['document', id] })
          }
        )
        .subscribe()
      return () => { supabase!.removeChannel(channel) }
    } else {
      return localSync.subscribe(path, (val) => {
        const doc = val as Partial<Document>
        if (doc.body !== undefined) {
          setBodyState(doc.body)
          setTitle(doc.title ?? generateTitle(doc.body, new Date(doc.created ?? Date.now())))
        }
      })
    }
  }, [id, queryClient])

  const setBody = useCallback((newBody: string) => {
    const newTitle = generateTitle(newBody)
    setBodyState(newBody)
    setTitle(newTitle)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const payload: Partial<Document> = {
        id,
        body: newBody,
        title: newTitle,
        updated_at: new Date().toISOString(),
      }
      if (supabase) {
        supabase.from('documents').upsert(payload as Document).then()
      } else {
        localSync.publish(path, payload)
      }
    }, 500)
  }, [id])

  return { body, title, isLoading, setBody }
}
```

- [ ] **Step 4: Run to confirm PASS**

```bash
npx vitest run src/hooks/useDocument.test.tsx
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDocument.ts src/hooks/useDocument.test.tsx
git commit -m "feat(react-migration): add useDocument hook with Supabase realtime + BroadcastChannel fallback"
```

---

## Task 8: Route files

**Files:**
- Create: `src/routes/__root.tsx`
- Create: `src/routes/index.tsx`
- Create: `src/routes/$docId.tsx`
- Create: `src/routes/$docId.$mode.tsx`
- Create: `src/main.tsx`

- [ ] **Step 1: Create `src/routes/__root.tsx`**

```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5 } },
})

export const Route = createRootRoute({
  component: function RootLayout() {
    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    )
  },
})
```

- [ ] **Step 2: Create `src/routes/index.tsx`**

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { generateDocumentId } from '../lib/generateId'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: '/$docId',
      params: { docId: generateDocumentId() },
    })
  },
  component: () => null,
})
```

- [ ] **Step 3: Create `src/routes/$docId.tsx`**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { SplitPane } from '../components/SplitPane'

export const Route = createFileRoute('/$docId')({
  component: function DocPage() {
    const { docId } = Route.useParams()
    return <SplitPane docId={docId} mode={null} />
  },
})
```

- [ ] **Step 4: Create `src/routes/$docId.$mode.tsx`**

```tsx
import { createFileRoute, notFound } from '@tanstack/react-router'
import { SplitPane } from '../components/SplitPane'
import type { AppMode } from '../types/document'

export const Route = createFileRoute('/$docId/$mode')({
  params: {
    parse: (raw) => {
      if (raw.mode !== 'read' && raw.mode !== 'write') throw notFound()
      return { docId: raw.docId, mode: raw.mode as AppMode }
    },
    stringify: (p) => ({ docId: p.docId, mode: p.mode }),
  },
  component: function DocModePage() {
    const { docId, mode } = Route.useParams()
    return <SplitPane docId={docId} mode={mode} />
  },
})
```

- [ ] **Step 5: Create `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import go from 'highlight.js/lib/languages/go'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import rust from 'highlight.js/lib/languages/rust'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import 'highlight.js/styles/github.css'
import '../hiwrld.css'

// Register highlight.js languages (same set as before)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('rs', rust)
hljs.registerLanguage('sql', sql)

const router = createRouter({ routeTree, history: 'browser' })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element in index.html')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
```

- [ ] **Step 6: Update `index.html` to add `id="root"` to body**

In `index.html`, replace the `<body>` content with a single root div (React renders into it):

```html
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
```

Note: the current HTML has explicit `.write`, `.read` sections with buttons and textarea. These move into React components in Tasks 9-11. The old HTML structure is no longer needed.

- [ ] **Step 7: Run Vite dev server to confirm the router boots (components don't exist yet — expect an error, not a crash)**

```bash
npm run dev
```

Expected: Vite compiles, browser opens. TanStack Router will throw a module-not-found error for `SplitPane` (not yet created). This is expected — the build wires together in Task 11.

- [ ] **Step 8: Commit**

```bash
git add src/routes/__root.tsx src/routes/index.tsx src/routes/'$docId.tsx' \
        src/routes/'$docId.$mode.tsx' src/main.tsx index.html
git commit -m "feat(react-migration): add TanStack Router routes and React entry point"
```

---

## Task 9: `Article` and `Textarea` components

**Files:**
- Create: `src/components/Article.tsx`
- Create: `src/components/Textarea.tsx`
- Create: `src/components/Article.test.tsx`
- Create: `src/components/Textarea.test.tsx`

- [ ] **Step 1: Write failing test for Article**

Create `src/components/Article.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Article } from './Article'

describe('Article', () => {
  it('renders markdown body as HTML', () => {
    render(<Article body="# Hello\n\nworld" />)
    expect(document.querySelector('h1')?.textContent).toBe('Hello')
    expect(document.querySelector('p')?.textContent).toBe('world')
  })

  it('sanitizes script tags via DOMPurify', () => {
    render(<Article body="hi <script>alert(1)</script> bye" />)
    expect(document.querySelector('script')).toBeNull()
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
npx vitest run src/components/Article.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Create `src/components/Article.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import hljs from 'highlight.js/lib/core'
import { renderMarkdown, extractYoutubeId, youtubeEmbed } from '../lib/markdown'

interface ArticleProps { body: string }

export function Article({ body }: ArticleProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.querySelectorAll<HTMLElement>('pre code').forEach((block) => {
      try { hljs.highlightElement(block) } catch { /* skip unknown languages */ }
    })
    const timer = setTimeout(() => {
      el.querySelectorAll<HTMLAnchorElement>('a[href*="youtube.com/watch?v="]').forEach((a) => {
        const id = extractYoutubeId(a.href)
        if (!id) return
        const iframe = document.createElement('div')
        iframe.innerHTML = youtubeEmbed(id)
        a.replaceWith(iframe.firstElementChild!)
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [body])

  return (
    <article
      ref={ref}
      className="document-article"
      // Safe: renderMarkdown runs DOMPurify internally
      dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
    />
  )
}
```

- [ ] **Step 4: Run to confirm Article tests PASS**

```bash
npx vitest run src/components/Article.test.tsx
```

Expected: 2 passed.

- [ ] **Step 5: Write failing test for Textarea**

Create `src/components/Textarea.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from './Textarea'

describe('Textarea', () => {
  it('calls onChange with the new value on each keystroke', async () => {
    const onChange = vi.fn()
    render(<Textarea body="" onChange={onChange} />)
    const textarea = document.querySelector('.document-textarea') as HTMLTextAreaElement
    await userEvent.type(textarea, 'hi')
    expect(onChange).toHaveBeenCalledWith('h')
    expect(onChange).toHaveBeenCalledWith('i')
  })

  it('inserts 4 spaces on Tab and prevents default', async () => {
    let body = ''
    const onChange = vi.fn((v: string) => { body = v })
    const { rerender } = render(<Textarea body={body} onChange={onChange} />)
    const textarea = document.querySelector('.document-textarea') as HTMLTextAreaElement
    textarea.focus()
    await userEvent.tab()
    rerender(<Textarea body={body} onChange={onChange} />)
    // Tab inserts 4 spaces
    expect(body).toBe('    ')
  })
})
```

- [ ] **Step 6: Run to confirm FAIL**

```bash
npx vitest run src/components/Textarea.test.tsx
```

Expected: FAIL.

- [ ] **Step 7: Create `src/components/Textarea.tsx`**

```tsx
import { useRef } from 'react'

interface TextareaProps {
  body: string
  onChange: (body: string) => void
}

export function Textarea({ body, onChange }: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const el = e.currentTarget
    const start = el.selectionStart
    const end = el.selectionEnd
    const tab = '    '
    const next = el.value.substring(0, start) + tab + el.value.substring(end)
    onChange(next)
    requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.selectionStart = ref.current.selectionEnd = start + tab.length
      }
    })
  }

  return (
    <textarea
      ref={ref}
      className="document-textarea"
      value={body}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  )
}
```

- [ ] **Step 8: Run to confirm Textarea tests PASS**

```bash
npx vitest run src/components/Textarea.test.tsx
```

Expected: 2 passed.

- [ ] **Step 9: Commit**

```bash
git add src/components/Article.tsx src/components/Article.test.tsx \
        src/components/Textarea.tsx src/components/Textarea.test.tsx
git commit -m "feat(react-migration): add Article and Textarea components"
```

---

## Task 10: `DocumentMenuItem` and `DocumentMenu` components

**Files:**
- Create: `src/components/DocumentMenuItem.tsx`
- Create: `src/components/DocumentMenu.tsx`
- Create: `src/components/DocumentMenu.test.tsx`

- [ ] **Step 1: Create `src/components/DocumentMenuItem.tsx`**

No dedicated unit test — fully covered by `DocumentMenu.test.tsx` below.

```tsx
import { Link } from '@tanstack/react-router'

interface DocumentMenuItemProps {
  id: string
  title: string
  onDelete: (id: string) => void
}

export function DocumentMenuItem({ id, title, onDelete }: DocumentMenuItemProps) {
  return (
    <li className="document-menu-item" data-id={id}>
      <div className="document-menu-item-wrap">
        <Link to="/$docId" params={{ docId: id }} className="document-menu-item-title">
          {title || id}
        </Link>
        <button
          type="button"
          title="Delete Document"
          aria-label="Delete Document"
          className="document-menu-item-delete-button ss-trash"
          onClick={(e) => { e.preventDefault(); onDelete(id) }}
        />
      </div>
    </li>
  )
}
```

- [ ] **Step 2: Write failing tests for DocumentMenu**

Create `src/components/DocumentMenu.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from '@tanstack/react-router'
import { DocumentMenu } from './DocumentMenu'
import * as useDocumentsModule from '../hooks/useDocuments'
import type { BookmarkEntry } from '../hooks/useDocuments'

function mockDocs(docs: BookmarkEntry[]) {
  const add = vi.fn()
  const remove = vi.fn()
  const setTitle = vi.fn()
  vi.spyOn(useDocumentsModule, 'useDocuments').mockReturnValue({ docs, add, remove, setTitle })
  return { add, remove, setTitle }
}

// TanStack Router requires a router context for <Link> — use a test wrapper
function Wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter initialEntries={['/abc1234']}>{children}</MemoryRouter>
}

describe('DocumentMenu', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('renders one <li> per doc with the cached title', () => {
    mockDocs([{ id: 'a', title: 'First' }, { id: 'b', title: 'Second' }])
    render(<DocumentMenu currentDocId="a" />, { wrapper: Wrapper })
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(document.querySelectorAll('li.document-menu-item')).toHaveLength(2)
  })

  it('calls remove() when delete button is clicked', async () => {
    const { remove } = mockDocs([{ id: 'a', title: 'A' }])
    render(<DocumentMenu currentDocId="current" />, { wrapper: Wrapper })
    await userEvent.click(document.querySelector('.document-menu-item-delete-button')!)
    expect(remove).toHaveBeenCalledWith('a')
  })
})
```

- [ ] **Step 3: Run to confirm FAIL**

```bash
npx vitest run src/components/DocumentMenu.test.tsx
```

Expected: FAIL.

- [ ] **Step 4: Create `src/components/DocumentMenu.tsx`**

```tsx
import { useNavigate } from '@tanstack/react-router'
import { useDocuments } from '../hooks/useDocuments'
import { generateDocumentId } from '../lib/generateId'
import { DocumentMenuItem } from './DocumentMenuItem'

interface DocumentMenuProps { currentDocId: string }

export function DocumentMenu({ currentDocId }: DocumentMenuProps) {
  const { docs, remove } = useDocuments()
  const navigate = useNavigate()

  const handleDelete = (id: string) => {
    remove(id)
    if (id === currentDocId) {
      const remaining = docs.filter((d) => d.id !== id)
      const next = remaining[remaining.length - 1]?.id ?? generateDocumentId()
      void navigate({ to: '/$docId', params: { docId: next } })
    }
  }

  return (
    <ul className="document-menu">
      {docs.map(({ id, title }) => (
        <DocumentMenuItem key={id} id={id} title={title} onDelete={handleDelete} />
      ))}
    </ul>
  )
}
```

- [ ] **Step 5: Run to confirm PASS**

```bash
npx vitest run src/components/DocumentMenu.test.tsx
```

Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add src/components/DocumentMenuItem.tsx src/components/DocumentMenu.tsx \
        src/components/DocumentMenu.test.tsx
git commit -m "feat(react-migration): add DocumentMenuItem and DocumentMenu components"
```

---

## Task 11: `WritePane`, `ReadPane`, and `SplitPane` components

**Files:**
- Create: `src/components/WritePane.tsx`
- Create: `src/components/ReadPane.tsx`
- Create: `src/components/SplitPane.tsx`
- Create: `src/components/SplitPane.test.tsx`

- [ ] **Step 1: Create `src/components/WritePane.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Textarea } from './Textarea'
import { DocumentMenu } from './DocumentMenu'
import { useDocuments } from '../hooks/useDocuments'
import { generateDocumentId } from '../lib/generateId'
import type { AppMode } from '../types/document'

interface WritePaneProps {
  docId: string
  body: string
  mode: AppMode | null
  onBodyChange: (body: string) => void
  onModeChange: (mode: AppMode | null) => void
}

export function WritePane({ docId, body, mode, onBodyChange, onModeChange }: WritePaneProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { add } = useDocuments()
  const navigate = useNavigate()

  const handleAddDoc = () => {
    const newId = generateDocumentId()
    add(newId)
    void navigate({ to: '/$docId', params: { docId: newId } })
  }

  const handleWriteOnly = () => {
    onModeChange(mode === 'write' ? null : 'write')
  }

  return (
    <section className="write">
      <div
        className="document-menu"
        style={{ display: menuOpen ? undefined : 'none' }}
      >
        <DocumentMenu currentDocId={docId} />
      </div>
      <form className="write-form">
        <div className="write-buttons">
          <button
            type="button"
            title="Your Documents"
            aria-label="Your Documents"
            className={`menu-button ss-rows${menuOpen ? ' pressed' : ''}`}
            aria-pressed={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          />
          <button
            type="button"
            title="New Document"
            aria-label="New Document"
            className="add-button ss-plus"
            onClick={handleAddDoc}
          />
          <button
            type="button"
            title="Write Mode"
            aria-label="Write Mode"
            className={`write-only-button ss-write${mode === 'write' ? ' pressed' : ''}`}
            aria-pressed={mode === 'write'}
            onClick={handleWriteOnly}
          />
        </div>
        <div className="write-textarea-wrap">
          <Textarea body={body} onChange={onBodyChange} />
        </div>
      </form>
    </section>
  )
}
```

- [ ] **Step 2: Create `src/components/ReadPane.tsx`**

```tsx
import { Article } from './Article'
import type { AppMode } from '../types/document'

interface ReadPaneProps {
  body: string
  mode: AppMode | null
  onModeChange: (mode: AppMode | null) => void
}

export function ReadPane({ body, mode, onModeChange }: ReadPaneProps) {
  const handleReadOnly = () => {
    onModeChange(mode === 'read' ? null : 'read')
  }

  return (
    <section className="read">
      <div className="read-buttons">
        <button
          type="button"
          title="Read Mode"
          aria-label="Read Mode"
          className={`read-only-button ss-view${mode === 'read' ? ' pressed' : ''}`}
          aria-pressed={mode === 'read'}
          onClick={handleReadOnly}
        />
      </div>
      <Article body={body} />
    </section>
  )
}
```

- [ ] **Step 3: Write failing tests for SplitPane**

Create `src/components/SplitPane.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SplitPane } from './SplitPane'
import * as useDocumentModule from '../hooks/useDocument'
import * as useDocumentsModule from '../hooks/useDocuments'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return { ...actual, useNavigate: () => vi.fn() }
})

function mockDocument(overrides = {}) {
  vi.spyOn(useDocumentModule, 'useDocument').mockReturnValue({
    body: '',
    title: 'Untitled',
    isLoading: false,
    setBody: vi.fn(),
    ...overrides,
  })
}

function mockDocuments() {
  vi.spyOn(useDocumentsModule, 'useDocuments').mockReturnValue({
    docs: [],
    add: vi.fn(),
    remove: vi.fn(),
    setTitle: vi.fn(),
  })
}

describe('SplitPane', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    document.documentElement.className = ''
  })

  it('renders textarea with body from useDocument', () => {
    mockDocument({ body: '# Hello', title: 'Hello' })
    mockDocuments()
    render(<SplitPane docId="abc1234" mode={null} />)
    const textarea = document.querySelector<HTMLTextAreaElement>('.document-textarea')
    expect(textarea?.value).toBe('# Hello')
  })

  it('adds read-only class to <html> when mode is read', () => {
    mockDocument()
    mockDocuments()
    render(<SplitPane docId="abc1234" mode="read" />)
    expect(document.documentElement.classList.contains('read-only')).toBe(true)
  })

  it('adds write-only class to <html> when mode is write', () => {
    mockDocument()
    mockDocuments()
    render(<SplitPane docId="abc1234" mode="write" />)
    expect(document.documentElement.classList.contains('write-only')).toBe(true)
  })

  it('calls setBody when textarea changes', async () => {
    const setBody = vi.fn()
    mockDocument({ setBody })
    mockDocuments()
    render(<SplitPane docId="abc1234" mode={null} />)
    const textarea = document.querySelector<HTMLTextAreaElement>('.document-textarea')!
    await userEvent.type(textarea, 'a')
    expect(setBody).toHaveBeenCalled()
  })
})
```

- [ ] **Step 4: Run to confirm FAIL**

```bash
npx vitest run src/components/SplitPane.test.tsx
```

Expected: FAIL.

- [ ] **Step 5: Create `src/components/SplitPane.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDocument } from '../hooks/useDocument'
import { useDocuments } from '../hooks/useDocuments'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { WritePane } from './WritePane'
import { ReadPane } from './ReadPane'
import type { AppMode } from '../types/document'

const MINIMUM_WIDTH = 1000

interface SplitPaneProps {
  docId: string
  mode: AppMode | null
}

export function SplitPane({ docId, mode }: SplitPaneProps) {
  const { body, title, setBody } = useDocument(docId)
  const { add, setTitle } = useDocuments()
  const navigate = useNavigate()
  const width = useWindowWidth()
  const autoForcedRef = useRef<AppMode | null>(null)

  // Register doc in bookmark list + update title whenever title changes
  useEffect(() => { add(docId) }, [docId])
  useEffect(() => { setTitle(docId, title) }, [docId, title])

  // Apply mode classes to <html> (same as current Backbone renderState)
  useEffect(() => {
    const html = document.documentElement
    html.classList.toggle('read-only', mode === 'read')
    html.classList.toggle('write-only', mode === 'write')
  }, [mode])

  // Narrow-screen auto-force-write (mirrors _autoForcedState logic)
  useEffect(() => {
    const narrow = width < MINIMUM_WIDTH
    if (narrow && mode === null) {
      autoForcedRef.current = 'write'
      void navigate({ to: '/$docId/$mode', params: { docId, mode: 'write' } })
    } else if (!narrow && autoForcedRef.current && mode === autoForcedRef.current) {
      autoForcedRef.current = null
      void navigate({ to: '/$docId', params: { docId } })
    }
  }, [width, mode, docId, navigate])

  const handleModeChange = (newMode: AppMode | null) => {
    autoForcedRef.current = null
    if (newMode === null) {
      void navigate({ to: '/$docId', params: { docId } })
    } else {
      void navigate({ to: '/$docId/$mode', params: { docId, mode: newMode } })
    }
  }

  return (
    <>
      <WritePane
        docId={docId}
        body={body}
        mode={mode}
        onBodyChange={setBody}
        onModeChange={handleModeChange}
      />
      <ReadPane
        body={body}
        mode={mode}
        onModeChange={handleModeChange}
      />
    </>
  )
}
```

- [ ] **Step 6: Run to confirm PASS**

```bash
npx vitest run src/components/SplitPane.test.tsx
```

Expected: 4 passed.

- [ ] **Step 7: Commit**

```bash
git add src/components/WritePane.tsx src/components/ReadPane.tsx \
        src/components/SplitPane.tsx src/components/SplitPane.test.tsx
git commit -m "feat(react-migration): add WritePane, ReadPane, SplitPane components"
```

---

## Task 12: Delete old Backbone files and verify build

- [ ] **Step 1: Delete old source files**

```bash
git rm src/app/app-model.js src/app/app-view.js \
        src/document/document-model.js \
        src/document/document-collection.js \
        src/document/document-menu-view.js \
        src/firebase.js \
        src/main.js
```

- [ ] **Step 2: Remove old Backbone test files**

```bash
git rm src/app/app-model.test.js src/app/app-view.test.js \
        src/document/document-model.test.js \
        src/document/document-collection.test.js \
        src/document/document-menu-view.test.js \
        src/firebase.test.js
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: clean build. If TanStack Router's Vite plugin couldn't auto-generate `routeTree.gen.ts` yet, run:

```bash
npx tsr generate
```

Then re-run `npm run build`.

- [ ] **Step 4: Run unit tests — verify no regressions in non-Backbone tests**

```bash
npm run test
```

Expected: all remaining unit tests pass (markdown, generateId, generateTitle, localSync, server, hooks, components). The deleted Backbone tests are gone, the new React tests should all be green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(react-migration): delete Backbone source + tests, verify build"
```

---

## Task 13: Update Playwright e2e helpers

The e2e specs have two patterns that need updating now that hash routing is gone and React's `onChange` fires natively:

1. Remove `dispatchEvent('keyup')` from `fillTextarea` helpers
2. Remove `waitForURL(/#/)` guards — history routing doesn't need them
3. Update `openDoc` to wait for a history URL (`/[A-Za-z0-9]{7}`)
4. Update any `toHaveURL(url)` assertions that expected hash fragments

**Files to modify:**
- `e2e/document-flow.spec.js`
- `e2e/concurrent-edits.spec.js`
- `e2e/persistence.spec.js`
- `e2e/document-menu.spec.js`

(`e2e/sanitization.spec.js` has no navigation or fill concerns — update `fillTextarea` helper only.)

- [ ] **Step 1: Update `fillTextarea` helper in all 5 spec files**

In each spec file that defines `fillTextarea`, change from:

```js
async function fillTextarea(page, text) {
  await page.locator('.document-textarea').fill(text);
  await page.locator('.document-textarea').dispatchEvent('keyup');
}
```

to:

```js
async function fillTextarea(page, text) {
  await page.locator('.document-textarea').fill(text);
}
```

React's `onChange` fires on every `fill()` call — no synthetic keyup needed.

- [ ] **Step 2: Update `openDoc` helper in concurrent-edits and persistence specs**

Change from:

```js
async function openDoc(context) {
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForURL(/#/);
  return { page, url: page.url() };
}
```

to:

```js
async function openDoc(context) {
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForURL(/\/[A-Za-z0-9]{7}/);
  return { page, url: page.url() };
}
```

- [ ] **Step 3: Remove all `waitForURL(/#/)` inline guards**

Search for and remove every occurrence of `await page.waitForURL(/#/)` and `await a.waitForURL(/#/)` etc. in all spec files. These were needed for the hash router redirect delay — not needed with history routing.

- [ ] **Step 4: Update `playwright.config.js` webServer command**

Ensure the webServer serves from the freshly-built dist. No changes needed if the config is already pointing at `npm run preview -- --port 4173 --strictPort`.

- [ ] **Step 5: Build and run the full Playwright suite**

```bash
npm run build
npx playwright test
```

Expected: all 22 e2e specs pass. If any fail due to:
- URL assertion mismatch: update the `toHaveURL` regex from `/#/` to `/\/[A-Za-z0-9]{7}/`
- Timing: increase `waitForTimeout` by 50%, not disable the test
- Selector mismatch: compare against current HTML structure in browser devtools

- [ ] **Step 6: Commit**

```bash
git add e2e/
git commit -m "test(react-migration): update Playwright helpers for history routing and React onChange"
```

---

## Task 14: Final verification and mark complete

- [ ] **Step 1: Full unit suite with coverage**

```bash
npm run test:coverage
```

Expected: all tests pass. Coverage should be similar to or higher than pre-migration levels (88%+ on testable modules).

- [ ] **Step 2: Full Playwright suite**

```bash
npm run test:e2e
```

Expected: all 22 pass. This is the migration completion signal per the spec.

- [ ] **Step 3: Check Biome**

```bash
npm run check
```

Expected: clean. Auto-fix with `npm run check:write` if there are import ordering issues.

- [ ] **Step 4: Verify the running app manually**

```bash
npm run dev
```

Confirm in the browser:
- Landing at `/` redirects to `/<docId>` (7-char alphanumeric path, no hash)
- Typing in the left pane updates the right pane preview in real time
- Smart quotes curl, code blocks highlight, YouTube links embed
- Menu button toggles the document drawer
- Add button creates a new document and navigates to it
- Delete button removes a document from the menu
- Read/write-only buttons toggle the split-pane state
- Reloading the page restores the document content

- [ ] **Step 5: Update task #4**

The Backbone assessment task (#4) is now complete — the assessment led to a React migration spec and plan.

- [ ] **Step 6: Commit final state**

```bash
git add -A
git commit -m "chore(react-migration): all tests green, Backbone replaced with React 19"
```

---

## Self-review checklist

**Spec coverage:**
- ✅ Architecture: React 19, TanStack Router + Query, strict TS — Task 1
- ✅ Types: `Document`, `AppMode` — Task 2
- ✅ lib/supabase.ts, lib/localSync.ts — Task 3
- ✅ Supabase mocks replacing Firebase mocks — Task 4
- ✅ useDocuments with title cache — Task 5
- ✅ generateTitle, useWindowWidth — Task 6
- ✅ useDocument with Supabase + BroadcastChannel fallback — Task 7
- ✅ All 4 route files + main.tsx — Task 8
- ✅ Article, Textarea — Task 9
- ✅ DocumentMenuItem, DocumentMenu — Task 10
- ✅ WritePane, ReadPane, SplitPane — Task 11
- ✅ Old Backbone files deleted — Task 12
- ✅ Playwright e2e updates — Task 13
- ✅ `_autoForcedState` narrow-screen behaviour: `useRef(autoForcedRef)` in SplitPane — Task 11

**Type consistency:**
- `useDocument` returns `UseDocumentResult` (body, title, isLoading, setBody) — consistent across Task 7, 11
- `useDocuments` returns `{ docs: BookmarkEntry[], add, remove, setTitle }` — consistent across Tasks 5, 10, 11
- `AppMode = 'read' | 'write'` — consistent across Tasks 2, 8, 11
- `generateTitle(body, created?)` — consistent across Tasks 6, 7

**Placeholder scan:** No TBD/TODO/placeholder found. All code blocks are complete.
