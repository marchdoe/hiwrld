# Testing strategy — Vitest + Playwright

**Status:** Draft / Pending approval
**Date:** 2026-05-01
**Owner:** Doug March
**Supersedes / consolidates:** TODO task #2 (Add unit tests), TODO task #3 (Add end-to-end tests with Playwright)
**Related:** TODO task #1 (Migrate Firebase → Supabase), TODO task #4 (Assess whether to replace Backbone)

## Context

`hiwrld` (a small Backbone/jQuery realtime Markdown editor, modernized in 2026 from a 2012 codebase) currently has **no automated tests**. Two architectural shifts are queued: a Firebase → Supabase migration (task #1) and a possible Backbone replacement (task #4). The user wants a regression net in place *before* those migrations, accepting that some tests will need rewrites afterward.

This document specifies the testing framework choice, scope, and harness so that an implementation agent can execute it.

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Unit framework | **Vitest** | Native Vite integration, fast, jsdom support, Jest-compatible API |
| E2E framework | **Playwright** | Multi-context support is required for concurrent-edit testing; better tracing than Cypress |
| Coverage scope | **Test everything as-is** (option B from brainstorming) | Maximizes regression safety during pending migrations; tests that rot can be rewritten alongside the migration |
| Firebase test strategy | **`vi.mock` the SDK** (option B from brainstorming) | Fast, zero deps, no Java/emulator in CI; accepts mock-drift risk |
| CI gating | **Run on every push/PR, report only, do not block merges** (option B from brainstorming) | Establishes feedback loop without fighting flaky tests during stabilization |
| Concurrent-edit fidelity | **BroadcastChannel path only in CI** | Same listener/dispatch logic as real Firebase; avoids emulator setup that contradicts the mocking choice |
| Concurrency contract | **Last-write-wins** | Matches actual Firebase `set()` behavior and current README warning ("best edited by one person at a time"); not a CRDT |
| Browser matrix | **Chromium only initially** | Firefox + WebKit added in a follow-up after CI is stable |

## Test layers

### Layer 1 — Vitest unit (jsdom)

Pure functions and isolated module logic. No Backbone, no DOM coupling beyond what jsdom provides natively.

### Layer 2 — Vitest integration (jsdom)

Backbone models and views with a mocked Firebase SDK. Renders to detached DOM nodes; asserts state transitions, change events, and DOM structure. Does not exercise real interaction (clicks, keystrokes through the browser event loop) — that's Layer 3.

### Layer 3 — Playwright e2e (Chromium)

Full app served from `vite preview`. Real browser, real interaction. Multi-context for concurrency tests. Asserts user-visible behavior, not implementation.

## Coverage map

| Surface | Layer | Notes |
|---|---|---|
| Markdown pipeline (marked + DOMPurify + smart quotes + YouTube embed + hljs) | Unit | Highest ROI. Extract pipeline to `src/markdown.js` if currently inline. |
| `src/document/document-model.js` | Integration | `vi.mock('firebase/database')`; assert `set()` writes, `onValue` updates model, change events fire |
| `src/document/document-collection.js` | Integration | Add/remove/find operations |
| `src/document/document-menu-view.js` | Integration | Render to detached DOM, click handlers |
| `src/app/app-model.js` (router) | Integration | URL → model wiring |
| `src/app/app-view.js` (split-pane) | Integration + e2e | DOM structure unit, real interaction e2e |
| `src/firebase.js` (BroadcastChannel fallback) | Unit | jsdom BroadcastChannel mock |
| `server.js` | Unit (`supertest`) | Helmet headers, gzip on, static fallback to `index.html` |
| Multi-tab / multi-user sync | E2e only | Two+ Playwright browser contexts, BroadcastChannel transport |
| Sanitization (`<script>`, `onerror=`, `<iframe>`) | E2e | Real DOMPurify in real browser |
| URL sharing / persistence | E2e | localStorage reload behavior, deep-link to existing doc |
| `src/main.js` (entry wiring) | E2e only | Side-effectful bootstrap, not unit-testable |

## Out of scope

- Visual regression (no Percy, no Chromatic)
- Cross-browser e2e on first pass (Chromium only; Firefox + WebKit follow-up)
- Firebase Emulator Suite (contradicts mock-the-SDK choice)
- Performance / load tests
- Accessibility audit (axe-core) — could be a small follow-up but not requested
- Real collaborative editing (Yjs / Automerge) — separate feature spec, not a test concern
- Real Firebase in CI — manual smoke test before Supabase migration is recommended but not automated

## Vitest harness

### Dev dependencies

```
vitest
@vitest/coverage-v8
jsdom
@testing-library/dom
supertest
```

### `vitest.config.js`

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['src/main.js', '**/*.test.js', 'dist/**', 'e2e/**'],
    },
  },
});
```

Coverage is **reported, not gated**. Soft target ~70% lines on testable modules; not enforced.

### Firebase mocking

- `__mocks__/firebase/database.js` — manual mock exporting `getDatabase`, `ref`, `onValue`, `set`, `onDisconnect` as `vi.fn()` stubs backed by an in-memory store and a listener registry.
- `__mocks__/firebase/app.js` — stubs `initializeApp`.
- Tests opt in via `vi.mock('firebase/database')` and `vi.mock('firebase/app')` at the top of the file.
- Helper: `test/firebase-fake.js` exposes `setRemoteValue(id, data)` to simulate inbound updates from "another client" and `resetFakeStore()` for `beforeEach`.

### Test colocation

- Unit/integration specs colocated with source: `src/**/*.test.js`
- Shared helpers in `test/`:
  - `test/setup.js` — installs jQuery on `window`, registers Firebase manual mocks, polyfills `BroadcastChannel` if jsdom is missing it
  - `test/firebase-fake.js` — fake Firebase store + listener registry
  - `test/fixtures/markdown-samples.js` — canonical markdown inputs/outputs for pipeline tests

### Initial unit/integration specs

- `src/markdown.test.js` — smart quotes, em-dash, YouTube embed, hljs code block, DOMPurify sanitization
- `src/firebase.test.js` — BroadcastChannel fallback when `VITE_FIREBASE_*` env vars are absent
- `src/document/document-model.test.js` — `set()` writes through to mock, `onValue` updates model, change events
- `src/document/document-collection.test.js` — add/remove/find
- `src/document/document-menu-view.test.js` — render to detached DOM, click handlers
- `src/app/app-model.test.js` — router parsing
- `src/app/app-view.test.js` — split-pane DOM structure (interaction → e2e)
- `server.test.js` — supertest: helmet headers (CSP, X-Frame-Options, etc.), `Content-Encoding: gzip`, SPA fallback

## Playwright harness

### Dev dependencies

```
@playwright/test
```

Plus `npx playwright install --with-deps chromium` (one-time and in CI).

### `playwright.config.js`

```js
import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: CI ? 1 : 0,
  reporter: CI ? [['html'], ['github']] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !CI,
    timeout: 60_000,
  },
});
```

### Spec files

- **`e2e/document-flow.spec.js`** — landing redirects to a new doc id; type in left pane, see rendered output in right pane; smart quote curling; em-dash preservation; code block highlighting; YouTube embed substitution.
- **`e2e/concurrent-edits.spec.js`** — multi-context concurrency (BroadcastChannel transport):
  - **Read replication:** A types, B observes within 1 second (Playwright `waitFor` timeout)
  - **Simultaneous typing:** A and B type at once; document state converges across all clients (no permanent split-brain), even if last-write-wins
  - **Rapid alternation:** A, B, A, B; both clients end on the same final string
  - **Late joiner:** A types content; B opens URL fresh; B sees A's content
  - **Three-way:** A, B, C all editing; convergence scales past two clients
  - **Disconnect / reconnect:** B closes tab, A keeps typing, B reopens; B catches up
- **`e2e/persistence.spec.js`** — type, reload, content survives via localStorage; deep-link to existing doc URL loads content.
- **`e2e/sanitization.spec.js`** — paste raw `<script>`, `onerror=`, `<iframe src>`, JS-protocol links into editor; assert all sanitized in preview.
- **`e2e/document-menu.spec.js`** — open drawer, see list of docs, navigate between them, create new doc.

## CI workflow

`.github/workflows/test.yml` (new file):

```yaml
name: test

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - name: Vitest
        run: npm run test
        continue-on-error: true
      - name: Playwright
        run: npm run test:e2e
        continue-on-error: true
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-artifacts
          path: |
            playwright-report/
            test-results/
            coverage/
          retention-days: 14
```

`continue-on-error: true` enforces the report-only model. No branch protection rule is attached.

## Package scripts

Additions to `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage",
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:all": "npm run test && npm run test:e2e"
```

## Final tree (new files only)

```
__mocks__/firebase/database.js
__mocks__/firebase/app.js
e2e/
├── document-flow.spec.js
├── concurrent-edits.spec.js
├── persistence.spec.js
├── sanitization.spec.js
└── document-menu.spec.js
test/
├── setup.js
├── firebase-fake.js
└── fixtures/markdown-samples.js
src/**/*.test.js                    (colocated unit / integration tests)
playwright.config.js
vitest.config.js
.github/workflows/test.yml
```

Plus a new "Testing" section in `README.md` documenting how to run, what's covered, what's not, and a link to the CI workflow.

## Deliverables

The implementation agent must deliver:

1. All scaffolding in **Final tree** above (configs, mocks, scripts, CI workflow).
2. Initial test suites for every entry in the **Coverage map**.
3. README "Testing" section.
4. PR notes documenting the last-write-wins contract that `concurrent-edits.spec.js` asserts, and the explicit out-of-scope items.

## Open / known follow-ups

- **Firefox + WebKit projects** in `playwright.config.js` once Chromium runs cleanly in CI for two weeks.
- **Branch protection** flipping to required status check after the suite stabilizes.
- **Manual smoke test against real Firebase** before the Supabase migration ships (task #1).
- **Re-evaluation of model/view tests** after task #4 decision lands — if Backbone is replaced, integration specs in `src/document/` and `src/app/` will need rewrites.
- **Sync adapter contract tests** to be added as part of task #1 (Supabase migration), not this spec.
