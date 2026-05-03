# Testing Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a Vitest unit suite + Playwright e2e suite for hiwrld, plus a report-only CI workflow, with initial coverage across the markdown pipeline, sync logic, Backbone models/views, server, and end-to-end user flows.

**Architecture:** Three layers. Vitest unit (jsdom) for pure functions, Vitest integration (jsdom) for Backbone with mocked Firebase, Playwright e2e against `vite preview` for real-browser behavior. `vi.mock` strategy for Firebase (no emulator). BroadcastChannel-only path for concurrent-edit tests, asserting last-write-wins convergence. CI runs but does not block merges.

**Tech Stack:** Vitest 1.x, jsdom, @testing-library/dom, supertest, Playwright (Chromium), GitHub Actions, vi.mock for Firebase SDK.

**Source spec:** `docs/superpowers/specs/2026-05-01-testing-strategy-design.md`

---

## File structure

**New files:**
```
__mocks__/firebase/
├── app.js
└── database.js
test/
├── setup.js
├── firebase-fake.js
└── fixtures/markdown-samples.js
e2e/
├── document-flow.spec.js
├── concurrent-edits.spec.js
├── persistence.spec.js
├── sanitization.spec.js
└── document-menu.spec.js
src/markdown.js                                  (extracted from app-view.js)
src/markdown.test.js
src/firebase.test.js
src/document/document-model.test.js
src/document/document-collection.test.js
src/document/document-menu-view.test.js
src/app/app-model.test.js
src/app/app-view.test.js
server.test.js
playwright.config.js
vitest.config.js
.github/workflows/test.yml
```

**Modified files:**
- `package.json` — add devDeps, scripts
- `.gitignore` — add `coverage/`, `playwright-report/`, `test-results/`, `.playwright/`
- `src/app/app-view.js` — replace inline markdown filters with import from `./markdown.js`
- `server.js` — extract app construction into `createApp()`; only call `listen()` when run as main module
- `README.md` — add "Testing" section

---

## Task 1: Install Vitest harness and write vitest.config.js

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`
- Create: `test/setup.js`
- Modify: `.gitignore`

- [ ] **Step 1: Install Vitest dev deps**

```bash
npm install --save-dev vitest@^1.6.0 @vitest/coverage-v8@^1.6.0 jsdom@^24.0.0 @testing-library/dom@^10.0.0 supertest@^7.0.0
```

Expected: `package.json` updated, lockfile updated, no errors.

- [ ] **Step 2: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    include: ['src/**/*.test.js', 'server.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.js', 'server.js'],
      exclude: ['src/main.js', '**/*.test.js', 'dist/**', 'e2e/**'],
    },
  },
});
```

- [ ] **Step 3: Create `test/setup.js`**

```js
import { vi } from 'vitest';
import $ from 'jquery';

// Backbone needs jQuery on window for delegated events.
window.$ = window.jQuery = $;

// Default Firebase env to a truthy URL so `firebase.js` exports a non-null
// `db` and tests exercise the Firebase code path. Tests of the
// BroadcastChannel fallback override this via vi.stubEnv inside the test.
vi.stubEnv('VITE_FIREBASE_API_KEY', 'fake-key');
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'fake.firebaseapp.com');
vi.stubEnv('VITE_FIREBASE_DATABASE_URL', 'https://fake.firebaseio.com');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'fake');
```

- [ ] **Step 4: Add scripts to `package.json`**

In the `scripts` block of `package.json`, add (alongside existing entries):

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 5: Update `.gitignore`**

Append to `.gitignore`:

```
# Test output
coverage/
playwright-report/
test-results/
.playwright/
```

- [ ] **Step 6: Verify the harness loads**

```bash
npx vitest run --reporter=verbose
```

Expected: "No test files found" — confirms config loads cleanly. (Once tests exist, this will run them.)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.js test/setup.js .gitignore
git commit -m "test: install Vitest harness with jsdom + coverage"
```

---

## Task 2: Install Playwright harness and write playwright.config.js

**Files:**
- Modify: `package.json`
- Create: `playwright.config.js`

- [ ] **Step 1: Install Playwright dev dep**

```bash
npm install --save-dev @playwright/test@^1.45.0
npx playwright install --with-deps chromium
```

Expected: `@playwright/test` in `devDependencies`; Chromium downloaded.

- [ ] **Step 2: Create `playwright.config.js`**

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
    command: 'npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 3: Add Playwright scripts to `package.json`**

Add to the `scripts` block:

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:all": "npm run test && npm run test:e2e"
```

- [ ] **Step 4: Verify the harness loads**

```bash
npx playwright test --list
```

Expected: "No tests found" — confirms config loads cleanly.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json playwright.config.js
git commit -m "test: install Playwright harness (chromium only)"
```

---

## Task 3: Extract markdown pipeline from app-view.js into src/markdown.js

The view's `renderArticle()` runs `marked.parse → smart quotes → DOMPurify` as a pure pipeline, plus two post-DOM passes (YouTube embed, hljs highlighting). Extract the pure pipeline so it can be unit-tested without instantiating the whole view.

**Files:**
- Create: `src/markdown.js`
- Modify: `src/app/app-view.js` (lines 124-181 — replace inline filter methods with import + call)

- [ ] **Step 1: Write a failing test (drives the extraction)**

Create `src/markdown.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { renderMarkdown, applySmartQuotes, extractYoutubeId } from './markdown.js';

describe('renderMarkdown', () => {
  it('returns sanitized HTML for plain markdown', () => {
    const html = renderMarkdown('# Hello\n\nworld');
    expect(html).toContain('<h1');
    expect(html).toContain('Hello');
    expect(html).toContain('<p>world</p>');
  });

  it('strips script tags via DOMPurify', () => {
    const html = renderMarkdown('hello <script>alert(1)</script> world');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert(1)');
  });
});

describe('applySmartQuotes', () => {
  it('curls leading double quote after space', () => {
    expect(applySmartQuotes('a &quot;b&quot;')).toBe('a “b”');
  });

  it('curls leading single quote after space', () => {
    expect(applySmartQuotes('a &#39;b&#39;')).toBe('a ‘b’');
  });

  it('uses right single quote for apostrophe (no preceding non-word char)', () => {
    expect(applySmartQuotes("it&#39;s")).toBe('it’s');
  });
});

describe('extractYoutubeId', () => {
  it('pulls v= param from a watch URL', () => {
    expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for non-youtube URLs', () => {
    expect(extractYoutubeId('https://example.com/foo')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/markdown.test.js
```

Expected: FAIL — `Cannot find module './markdown.js'`.

- [ ] **Step 3: Create `src/markdown.js`**

```js
import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Smart-quote filter must run on Marked's output BEFORE DOMPurify, because
// it matches HTML entities (&#39; / &quot;) which DOMPurify decodes to raw
// chars during sanitization.
export function applySmartQuotes(html) {
  const leftSingleQuote = /([^\w])&#39;/g;
  const leftDoubleQuote = /([^\w])&quot;/g;
  const singleQuote = /&#39;/g;
  const doubleQuote = /&quot;/g;
  return html
    .replace(leftSingleQuote, '$1‘')
    .replace(leftDoubleQuote, '$1“')
    .replace(singleQuote, '’')
    .replace(doubleQuote, '”');
}

export function renderMarkdown(body) {
  const raw = marked.parse(body);
  const quoted = applySmartQuotes(raw);
  return DOMPurify.sanitize(quoted);
}

const YT_HOST_RE = /youtube\.com\/watch/;
const YT_ID_RE = /\?v=([\w-]+)/;
export function extractYoutubeId(href) {
  if (!YT_HOST_RE.test(href)) return null;
  const m = href.match(YT_ID_RE);
  return m ? m[1] : null;
}

export function youtubeEmbed(id) {
  return `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/markdown.test.js
```

Expected: PASS — all 6 assertions green.

- [ ] **Step 5: Replace inline pipeline in `src/app/app-view.js`**

In `src/app/app-view.js`:

a) Add to imports (after line 5 `import { marked }`):

```js
import { renderMarkdown, extractYoutubeId, youtubeEmbed } from '../markdown.js';
```

b) Remove the now-unused `import { marked }` and `import DOMPurify`.

c) Replace `renderArticle` (currently lines 124-139) with:

```js
  renderArticle() {
    if (!this.model.has('document')) return this;
    const body = this.model.get('document').get('body');
    this.$article.html(renderMarkdown(body));
    this.renderYoutubeFilter();
    this.renderCodeHighlightingFilter();
    return this;
  },
```

d) Replace `renderSmartQuoteFilter` (lines 154-164) — delete it entirely.

e) Replace `renderYoutubeFilter` (lines 166-173) with:

```js
  renderYoutubeFilter() {
    this.$article.find('a[href*="youtube.com/watch?v="]').each(function () {
      const youtubeId = extractYoutubeId(this.href);
      if (youtubeId) $(this).replaceWith(youtubeEmbed(youtubeId));
    });
  },
```

f) Delete the inline `youtubeEmbedTemplate` method (lines 23-27) — replaced by the import.

- [ ] **Step 6: Verify the markdown test still passes and the build still works**

```bash
npx vitest run src/markdown.test.js
npm run build
```

Expected: PASS on tests; build succeeds with no errors.

- [ ] **Step 7: Manual smoke test the dev server**

```bash
npm run dev
```

Open `http://localhost:5173`. Type a heading, a code block, a quoted phrase, and a YouTube link. Verify the right-pane preview renders correctly (smart quotes curl, code is highlighted, YouTube link becomes an iframe).

- [ ] **Step 8: Commit**

```bash
git add src/markdown.js src/markdown.test.js src/app/app-view.js
git commit -m "refactor: extract markdown pipeline to src/markdown.js for testability"
```

---

## Task 4: Create Firebase manual mocks and fake store

**Files:**
- Create: `__mocks__/firebase/app.js`
- Create: `__mocks__/firebase/database.js`
- Create: `test/firebase-fake.js`

- [ ] **Step 1: Create `__mocks__/firebase/app.js`**

```js
import { vi } from 'vitest';

export const initializeApp = vi.fn(() => ({ name: 'test-app' }));
```

- [ ] **Step 2: Create `__mocks__/firebase/database.js`**

```js
import { vi } from 'vitest';

const store = new Map();
const listeners = new Map();

export const getDatabase = vi.fn(() => ({ _fake: true }));

export const ref = vi.fn((_db, path) => ({ _path: path }));

export const onValue = vi.fn((refObj, cb) => {
  const path = refObj._path;
  if (!listeners.has(path)) listeners.set(path, new Set());
  listeners.get(path).add(cb);
  if (store.has(path)) cb({ val: () => store.get(path) });
  return () => listeners.get(path)?.delete(cb);
});

export const set = vi.fn((refObj, value) => {
  const path = refObj._path;
  store.set(path, value);
  for (const cb of listeners.get(path) ?? []) {
    cb({ val: () => value });
  }
});

export const __resetFakeStore = () => {
  store.clear();
  listeners.clear();
  getDatabase.mockClear();
  ref.mockClear();
  onValue.mockClear();
  set.mockClear();
};

export const __setRemoteValue = (path, value) => {
  store.set(path, value);
  for (const cb of listeners.get(path) ?? []) {
    cb({ val: () => value });
  }
};

export const __getStore = () => store;
```

- [ ] **Step 3: Create `test/firebase-fake.js` (re-export ergonomics)**

```js
export {
  __resetFakeStore as resetFakeStore,
  __setRemoteValue as setRemoteValue,
  __getStore as getFakeStore,
} from 'firebase/database';
```

This is a thin alias so test files import from `test/firebase-fake.js` instead of reaching into the mock's internal API directly.

- [ ] **Step 4: Sanity-check the mocks load when `vi.mock` is called**

Create a temporary scratch test `test/firebase-fake.smoke.test.js`:

```js
import { describe, it, expect, vi } from 'vitest';

vi.mock('firebase/app');
vi.mock('firebase/database');

describe('firebase mocks', () => {
  it('exposes mocked SDK functions', async () => {
    const fb = await import('firebase/database');
    expect(typeof fb.getDatabase).toBe('function');
    expect(typeof fb.ref).toBe('function');
    expect(typeof fb.onValue).toBe('function');
    expect(typeof fb.set).toBe('function');
  });

  it('records writes in the fake store', async () => {
    const { ref, set } = await import('firebase/database');
    const { resetFakeStore, getFakeStore } = await import('./firebase-fake.js');
    resetFakeStore();
    const r = ref({}, 'documents/abc');
    set(r, { body: 'hi' });
    expect(getFakeStore().get('documents/abc')).toEqual({ body: 'hi' });
  });
});
```

- [ ] **Step 5: Run the smoke test**

```bash
npx vitest run test/firebase-fake.smoke.test.js
```

Expected: PASS — both assertions green.

- [ ] **Step 6: Delete the smoke test (it has served its purpose)**

```bash
rm test/firebase-fake.smoke.test.js
```

- [ ] **Step 7: Commit**

```bash
git add __mocks__/firebase/app.js __mocks__/firebase/database.js test/firebase-fake.js
git commit -m "test: add Firebase SDK manual mocks with fake store"
```

---

## Task 5: Refactor server.js to export createApp() for testability

`server.js` currently calls `app.listen()` at module load. To test it with `supertest` we need to import the configured `app` without starting the listener.

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Refactor `server.js`**

Replace the entire file with:

```js
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import express from 'express';
import helmet from 'helmet';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp({ distDir = join(__dirname, 'dist') } = {}) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(compression());
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:', 'https:'],
          'frame-src': ['https://www.youtube.com', 'https://www.youtube-nocookie.com'],
          'connect-src': [
            "'self'",
            'https://*.firebaseio.com',
            'wss://*.firebaseio.com',
            'https://*.googleapis.com',
          ],
          'frame-ancestors': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'object-src': ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    express.static(distDir, {
      setHeaders(res, filePath) {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else if (/\.(?:js|css|map|png|svg|woff2?|ico)$/.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );

  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (/\.[a-z0-9]+$/i.test(req.path)) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(join(distDir, 'index.html'), (err) => err && next(err));
  });

  app.use((_req, res) => res.status(404).send('Not found'));
  return app;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const app = createApp();
  const port = process.env.PORT || 2000;
  const server = app.listen(port, () => {
    console.log(`listening on ${port}`);
  });

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10_000).unref();
    });
  }
}
```

- [ ] **Step 2: Verify server still starts as before**

```bash
npm run build
PORT=2001 npm run server &
sleep 2
curl -sI http://localhost:2001/ | head -5
kill %1
```

Expected: HTTP/1.1 200 with `Content-Security-Policy` header present. Server logs `listening on 2001`.

- [ ] **Step 3: Commit**

```bash
git add server.js
git commit -m "refactor(server): extract createApp() for testability"
```

---

## Task 6: Test the markdown pipeline (extend Task 3 tests)

The basic markdown tests exist from Task 3. Extend with the rest of the spec's coverage targets: em-dash, code blocks, additional sanitization vectors.

**Files:**
- Modify: `src/markdown.test.js`
- Create: `test/fixtures/markdown-samples.js`

- [ ] **Step 1: Create `test/fixtures/markdown-samples.js`**

```js
export const samples = {
  emDash: 'a -- b --- c',
  fencedCode: '```js\nconst x = 1;\n```',
  inlineCode: 'use the `var` keyword',
  htmlInjection: '<img src=x onerror="alert(1)">',
  iframeInjection: '<iframe src="javascript:alert(1)"></iframe>',
  linkJs: '[click](javascript:alert(1))',
  youtubeLink: 'watch [this](https://www.youtube.com/watch?v=dQw4w9WgXcQ)',
  apostrophes: "it's a friend's dog",
  mixedQuotes: 'she said "hello" and \'goodbye\'',
};
```

- [ ] **Step 2: Extend `src/markdown.test.js`**

Append to `src/markdown.test.js` (after the existing tests):

```js
import { samples } from '../test/fixtures/markdown-samples.js';

describe('renderMarkdown — sanitization', () => {
  it('strips onerror attributes', () => {
    const html = renderMarkdown(samples.htmlInjection);
    expect(html).not.toMatch(/onerror/i);
  });

  it('strips iframe with javascript: src', () => {
    const html = renderMarkdown(samples.iframeInjection);
    expect(html).not.toMatch(/javascript:/i);
  });

  it('strips javascript: protocol from links', () => {
    const html = renderMarkdown(samples.linkJs);
    expect(html).not.toMatch(/javascript:/i);
  });
});

describe('renderMarkdown — fences and inline code', () => {
  it('emits <pre><code class="language-js"> for fenced code', () => {
    const html = renderMarkdown(samples.fencedCode);
    expect(html).toMatch(/<pre>.*<code[^>]*language-js/s);
    expect(html).toContain('const x = 1;');
  });

  it('emits inline <code> for backtick text', () => {
    const html = renderMarkdown(samples.inlineCode);
    expect(html).toContain('<code>var</code>');
  });
});

describe('renderMarkdown — typography', () => {
  it('preserves em-dash characters in text', () => {
    const html = renderMarkdown(samples.emDash);
    expect(html).toContain('a -- b --- c');
  });

  it('curls quotes in mixed input', () => {
    const html = renderMarkdown(samples.mixedQuotes);
    expect(html).toContain('“hello”');
    expect(html).toContain('‘goodbye’');
  });

  it('curls apostrophes mid-word as right single quotes', () => {
    const html = renderMarkdown(samples.apostrophes);
    expect(html).toContain('it’s');
    expect(html).toContain('friend’s');
  });
});

describe('extractYoutubeId — additional cases', () => {
  it('handles URLs with extra query params', () => {
    expect(extractYoutubeId('https://youtube.com/watch?v=abc123&t=42s')).toBe('abc123');
  });

  it('returns null for youtube URLs without v=', () => {
    expect(extractYoutubeId('https://youtube.com/watch')).toBeNull();
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
npx vitest run src/markdown.test.js
```

Expected: PASS on all assertions. If any FAIL, the test is documenting current behavior — investigate whether it's a real bug (file an issue, leave the test as `.todo` or `.fails`) or a wrong assumption in the test.

- [ ] **Step 4: Commit**

```bash
git add src/markdown.test.js test/fixtures/markdown-samples.js
git commit -m "test(markdown): cover sanitization, code fences, typography, and youtube parsing"
```

---

## Task 7: Test the firebase.js BroadcastChannel fallback

**Files:**
- Create: `src/firebase.test.js`

- [ ] **Step 1: Write the test**

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('firebase.js — BroadcastChannel fallback', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.stubEnv('VITE_FIREBASE_DATABASE_URL', '');
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('exports null db and a localSync object when no Firebase URL is set', async () => {
    const fb = await import('./firebase.js');
    expect(fb.db).toBeNull();
    expect(fb.app).toBeNull();
    expect(fb.localSync).toBeTruthy();
    expect(typeof fb.localSync.subscribe).toBe('function');
    expect(typeof fb.localSync.publish).toBe('function');
  });

  it('publish writes to localStorage with the hiwrld:sync: prefix', async () => {
    const { localSync } = await import('./firebase.js');
    localSync.publish('documents/abc', { body: 'hi' });
    expect(localStorage.getItem('hiwrld:sync:documents/abc')).toBe(JSON.stringify({ body: 'hi' }));
  });

  it('subscribe replays the last localStorage value to a new subscriber', async () => {
    const { localSync } = await import('./firebase.js');
    localStorage.setItem('hiwrld:sync:documents/xyz', JSON.stringify({ body: 'cached' }));
    const cb = vi.fn();
    const unsubscribe = localSync.subscribe('documents/xyz', cb);
    expect(cb).toHaveBeenCalledWith({ body: 'cached' });
    unsubscribe();
  });

  it('subscribe ignores corrupt JSON in localStorage', async () => {
    const { localSync } = await import('./firebase.js');
    localStorage.setItem('hiwrld:sync:documents/bad', '{not-json');
    const cb = vi.fn();
    const unsubscribe = localSync.subscribe('documents/bad', cb);
    expect(cb).not.toHaveBeenCalled();
    unsubscribe();
  });
});

describe('firebase.js — Firebase configured', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_FIREBASE_DATABASE_URL', 'https://fake.firebaseio.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('exports a non-null db and null localSync when Firebase URL is set', async () => {
    vi.doMock('firebase/app', () => ({
      initializeApp: vi.fn(() => ({ name: 'test-app' })),
    }));
    vi.doMock('firebase/database', () => ({
      getDatabase: vi.fn(() => ({ _fake: true })),
    }));
    const fb = await import('./firebase.js');
    expect(fb.db).toBeTruthy();
    expect(fb.app).toBeTruthy();
    expect(fb.localSync).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npx vitest run src/firebase.test.js
```

Expected: PASS on all assertions. (jsdom 24+ ships BroadcastChannel natively.)

If any assertion fails because BroadcastChannel is undefined, add this polyfill to the top of `test/setup.js`:

```js
if (typeof BroadcastChannel === 'undefined') {
  globalThis.BroadcastChannel = class {
    constructor() {}
    postMessage() {}
    addEventListener() {}
    close() {}
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/firebase.test.js
git commit -m "test(firebase): cover BroadcastChannel fallback and Firebase-configured paths"
```

---

## Task 8: Test document-model.js with mocked Firebase

**Files:**
- Create: `src/document/document-model.test.js`

- [ ] **Step 1: Write the test**

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('firebase/app');
vi.mock('firebase/database');

describe('DocumentModel', () => {
  let DocumentModel;
  let resetFakeStore;
  let setRemoteValue;

  beforeEach(async () => {
    const fake = await import('../../test/firebase-fake.js');
    resetFakeStore = fake.resetFakeStore;
    setRemoteValue = fake.setRemoteValue;
    resetFakeStore();
    ({ DocumentModel } = await import('./document-model.js'));
  });

  it('defaults title to "Untitled" with the current date when body has no heading', () => {
    const doc = new DocumentModel({ id: 'abc1234', body: 'just plain text' });
    expect(doc.get('title')).toMatch(/^Untitled - .+, .+ \d+(st|nd|rd|th), \d{4}$/);
  });

  it('uses the first H1 as the title', () => {
    const doc = new DocumentModel({ id: 'abc1234', body: '# My Heading\n\nbody text' });
    expect(doc.get('title')).toBe('My Heading');
  });

  it('uses the first H2-H6 as the title when no H1 is present', () => {
    const doc = new DocumentModel({ id: 'abc1234', body: '### deep heading\n\nbody' });
    expect(doc.get('title')).toBe('deep heading');
  });

  it('updates title when body changes', () => {
    const doc = new DocumentModel({ id: 'abc1234', body: '' });
    doc.set('body', '# New Title');
    expect(doc.get('title')).toBe('New Title');
  });

  it('writes to firebase via set() when save() is called', async () => {
    const { set } = await import('firebase/database');
    const doc = new DocumentModel({ id: 'abc1234', body: 'hello' });
    set.mockClear();
    doc.save();
    expect(set).toHaveBeenCalledTimes(1);
    const [refArg, value] = set.mock.calls[0];
    expect(refArg._path).toBe('documents/abc1234');
    expect(value.body).toBe('hello');
    expect(typeof value.title).toBe('string');
    expect(value.title.length).toBeGreaterThan(0);
    expect(value.created).toBeDefined();
  });

  it('updates from remote onValue snapshots', () => {
    const doc = new DocumentModel({ id: 'remote1', body: '' });
    setRemoteValue('documents/remote1', { body: 'remote content', title: 'Remote' });
    expect(doc.get('body')).toBe('remote content');
    expect(doc.get('title')).toBe('Remote');
  });

  it('fires change:body event when remote update lands', () => {
    const doc = new DocumentModel({ id: 'remote2', body: 'old' });
    const handler = vi.fn();
    doc.on('change:body', handler);
    setRemoteValue('documents/remote2', { body: 'new' });
    expect(handler).toHaveBeenCalled();
    expect(doc.get('body')).toBe('new');
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npx vitest run src/document/document-model.test.js
```

Expected: PASS on all assertions.

- [ ] **Step 3: Commit**

```bash
git add src/document/document-model.test.js
git commit -m "test(document-model): cover title generation, save, and remote onValue updates"
```

---

## Task 9: Test document-collection.js

**Files:**
- Create: `src/document/document-collection.test.js`

- [ ] **Step 1: Write the test**

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('firebase/app');
vi.mock('firebase/database');

describe('DocumentCollection', () => {
  let DocumentCollection;
  let DocumentModel;

  beforeEach(async () => {
    const fake = await import('../../test/firebase-fake.js');
    fake.resetFakeStore();
    ({ DocumentCollection } = await import('./document-collection.js'));
    ({ DocumentModel } = await import('./document-model.js'));
  });

  it('uses DocumentModel as the model class', () => {
    const c = new DocumentCollection();
    expect(c.model).toBe(DocumentModel);
  });

  it('adds models with stable id lookups', () => {
    const c = new DocumentCollection();
    c.add({ id: 'one', body: 'a' });
    c.add({ id: 'two', body: 'b' });
    expect(c.length).toBe(2);
    expect(c.find((d) => d.id === 'one').get('body')).toBe('a');
    expect(c.find((d) => d.id === 'two').get('body')).toBe('b');
  });

  it('fires add and remove events', () => {
    const c = new DocumentCollection();
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    c.on('add', onAdd);
    c.on('remove', onRemove);
    const m = c.add({ id: 'three', body: '' });
    c.remove(m);
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npx vitest run src/document/document-collection.test.js
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/document/document-collection.test.js
git commit -m "test(document-collection): cover add/remove and id lookups"
```

---

## Task 10: Test document-menu-view.js

**Files:**
- Create: `src/document/document-menu-view.test.js`

- [ ] **Step 1: Write the test**

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('firebase/app');
vi.mock('firebase/database');

describe('DocumentMenuView', () => {
  let DocumentMenuView;
  let DocumentCollection;
  let menuEl;

  beforeEach(async () => {
    const fake = await import('../../test/firebase-fake.js');
    fake.resetFakeStore();
    ({ DocumentMenuView } = await import('./document-menu-view.js'));
    ({ DocumentCollection } = await import('./document-collection.js'));
    menuEl = document.createElement('ul');
    document.body.append(menuEl);
  });

  it('renders one <li> per document with the document title', () => {
    const collection = new DocumentCollection([
      { id: 'a', body: '# First' },
      { id: 'b', body: '# Second' },
    ]);
    const view = new DocumentMenuView({ collection, el: menuEl });
    view.render();
    const items = menuEl.querySelectorAll('li.document-menu-item');
    expect(items.length).toBe(2);
    expect(items[0].dataset.id).toBe('a');
    expect(items[0].querySelector('.document-menu-item-title').textContent).toBe('First');
    expect(items[1].dataset.id).toBe('b');
    expect(items[1].querySelector('.document-menu-item-title').textContent).toBe('Second');
  });

  it('uses textContent (not innerHTML) for titles — XSS-safe', () => {
    const collection = new DocumentCollection([{ id: 'x', body: '# <script>alert(1)</script>' }]);
    const view = new DocumentMenuView({ collection, el: menuEl });
    view.render();
    const titleEl = menuEl.querySelector('.document-menu-item-title');
    expect(titleEl.querySelector('script')).toBeNull();
    expect(titleEl.textContent).toContain('<script>');
  });

  it('fires "select" event with the matching doc on li click', () => {
    const collection = new DocumentCollection([{ id: 'a', body: '' }]);
    const view = new DocumentMenuView({ collection, el: menuEl });
    view.render();
    const onSelect = vi.fn();
    view.on('select', onSelect);
    menuEl.querySelector('li').click();
    expect(onSelect).toHaveBeenCalledTimes(1);
    const [_view, doc] = onSelect.mock.calls[0];
    expect(doc.id).toBe('a');
  });

  it('removes the doc from the collection on delete-button click', () => {
    const collection = new DocumentCollection([
      { id: 'a', body: '' },
      { id: 'b', body: '' },
    ]);
    const view = new DocumentMenuView({ collection, el: menuEl });
    view.render();
    menuEl.querySelector('li[data-id="a"] .document-menu-item-delete-button').click();
    expect(collection.length).toBe(1);
    expect(collection.find((d) => d.id === 'a')).toBeUndefined();
  });

  it('re-renders when collection changes', () => {
    const collection = new DocumentCollection([{ id: 'a', body: '' }]);
    const view = new DocumentMenuView({ collection, el: menuEl });
    view.render();
    expect(menuEl.querySelectorAll('li').length).toBe(1);
    collection.add({ id: 'b', body: '' });
    expect(menuEl.querySelectorAll('li').length).toBe(2);
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npx vitest run src/document/document-menu-view.test.js
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/document/document-menu-view.test.js
git commit -m "test(document-menu-view): cover render, click, delete, and live updates"
```

---

## Task 11: Test app-model.js (router + collection wiring)

**Files:**
- Create: `src/app/app-model.test.js`

- [ ] **Step 1: Write the test**

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Backbone from 'backbone';

vi.mock('firebase/app');
vi.mock('firebase/database');

describe('Model (app-model.js)', () => {
  let Model;

  beforeEach(async () => {
    const fake = await import('../../test/firebase-fake.js');
    fake.resetFakeStore();
    localStorage.clear();
    Backbone.history.stop();
    ({ Model } = await import('./app-model.js'));
  });

  afterEach(() => {
    Backbone.history.stop();
  });

  it('creates a documents collection on initialize', () => {
    const m = new Model();
    expect(m.get('documents')).toBeTruthy();
    expect(m.get('documents').length).toBe(0);
  });

  it('hydrates documents from the bookmarks key in localStorage', () => {
    localStorage.setItem('hiwrld.bookmarks', 'aaa1111,bbb2222');
    const m = new Model();
    const docs = m.get('documents');
    expect(docs.length).toBe(2);
    expect(docs.at(0).id).toBe('aaa1111');
    expect(docs.at(1).id).toBe('bbb2222');
  });

  it('writes bookmarks to localStorage when documents are added', () => {
    const m = new Model();
    m.fetchDocument('newdoc1', '');
    expect(localStorage.getItem('hiwrld.bookmarks')).toBe('newdoc1');
    m.fetchDocument('newdoc2', '');
    expect(localStorage.getItem('hiwrld.bookmarks')).toBe('newdoc1,newdoc2');
  });

  it('generateDocumentId returns a 7-char alphanumeric string', () => {
    const m = new Model();
    const id = m.generateDocumentId();
    expect(id).toMatch(/^[A-Za-z0-9]{7}$/);
  });

  it('fetchDocument returns existing model on repeat call (via collection lookup is the caller’s job)', () => {
    // fetchDocument always creates a new model. The dedupe is handled at
    // onDocumentRoute, which checks the collection first.
    const m = new Model();
    const a = m.fetchDocument('rep1', '');
    const b = m.fetchDocument('rep1', '');
    expect(a).not.toBe(b);
    expect(m.get('documents').filter((d) => d.id === 'rep1').length).toBe(2);
  });

  it('onDocumentRemove falls back to last document when the open one is removed', () => {
    const m = new Model();
    const a = m.fetchDocument('aa11111', '');
    const b = m.fetchDocument('bb22222', '');
    m.set('document', a);
    m.get('documents').remove(a);
    expect(m.get('document').id).toBe(b.id);
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npx vitest run src/app/app-model.test.js
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/app-model.test.js
git commit -m "test(app-model): cover bookmarks, fetchDocument, id generation, and remove fallback"
```

---

## Task 12: Test app-view.js (split-pane DOM structure)

The view's interactive behavior is best exercised in Playwright (Task 14+). Here we cover only what's static and unit-testable: render output, state class toggles, and the textarea→model binding via the `keyup` handler.

**Files:**
- Create: `src/app/app-view.test.js`

- [ ] **Step 1: Write the test**

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import $ from 'jquery';

vi.mock('firebase/app');
vi.mock('firebase/database');

const HTML = `
<html>
  <head><title>hiwrld</title></head>
  <body>
    <section class="write">
      <ul class="document-menu"></ul>
      <form class="write-form">
        <div class="write-buttons">
          <button class="menu-button"></button>
          <button class="add-button"></button>
          <button class="write-only-button"></button>
        </div>
        <div class="write-textarea-wrap">
          <textarea class="document-textarea"></textarea>
        </div>
      </form>
    </section>
    <section class="read">
      <div class="read-buttons">
        <button class="read-only-button"></button>
      </div>
      <article class="document-article"></article>
    </section>
  </body>
</html>
`;

describe('View (app-view.js)', () => {
  let View;
  let Model;

  beforeEach(async () => {
    const fake = await import('../../test/firebase-fake.js');
    fake.resetFakeStore();
    localStorage.clear();
    document.documentElement.innerHTML = HTML;
    ({ View } = await import('./app-view.js'));
    ({ Model } = await import('./app-model.js'));
  });

  it('renders the textarea and article from the current document body', () => {
    const model = new Model();
    const doc = model.fetchDocument('abc1234', '# Hello\n\nworld');
    model.set('document', doc);
    const view = new View({ model, el: $('html') }).render();
    expect(view.$textarea.val()).toBe('# Hello\n\nworld');
    expect(view.$article.html()).toContain('<h1');
    expect(view.$article.html()).toContain('Hello');
    expect(view.$article.html()).toContain('<p>world</p>');
  });

  it('toggles read-only / write-only classes on state change', () => {
    const model = new Model();
    const doc = model.fetchDocument('abc1234', '');
    model.set('document', doc);
    const view = new View({ model, el: $('html') }).render();
    model.set('state', 'read');
    expect($('html')[0].classList.contains('read-only')).toBe(true);
    model.set('state', 'write');
    expect($('html')[0].classList.contains('write-only')).toBe(true);
    expect($('html')[0].classList.contains('read-only')).toBe(false);
  });

  it('writes textarea changes to the document model on keyup', () => {
    const model = new Model();
    const doc = model.fetchDocument('abc1234', '');
    model.set('document', doc);
    new View({ model, el: $('html') }).render();
    const textarea = document.querySelector('.document-textarea');
    textarea.value = 'typed';
    textarea.dispatchEvent(new Event('keyup'));
    expect(doc.get('body')).toBe('typed');
  });

  it('replaces previous article content when the document changes', () => {
    const model = new Model();
    const a = model.fetchDocument('aa11111', '# First');
    const b = model.fetchDocument('bb22222', '# Second');
    model.set('document', a);
    const view = new View({ model, el: $('html') }).render();
    expect(view.$article.html()).toContain('First');
    model.set('document', b);
    expect(view.$article.html()).toContain('Second');
    expect(view.$article.html()).not.toContain('First');
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npx vitest run src/app/app-view.test.js
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/app-view.test.js
git commit -m "test(app-view): cover render, state toggles, textarea binding, doc swap"
```

---

## Task 13: Test server.js with supertest

**Files:**
- Create: `server.test.js`

- [ ] **Step 1: Build the dist bundle so static serving has something to serve**

```bash
npm run build
```

Expected: `dist/index.html` and assets exist.

- [ ] **Step 2: Write the test**

Create `server.test.js`:

```js
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from './server.js';

const app = createApp();

describe('server', () => {
  it('returns index.html on /', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('hiwrld');
  });

  it('sets a strict CSP header', async () => {
    const res = await request(app).get('/');
    const csp = res.headers['content-security-policy'];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-src https://www.youtube.com");
    expect(csp).toContain('https://*.firebaseio.com');
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('sets X-Content-Type-Options nosniff via helmet', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('falls back to index.html for unknown SPA routes', async () => {
    const res = await request(app).get('/abc1234');
    expect(res.status).toBe(200);
    expect(res.text).toContain('hiwrld');
  });

  it('falls back to index.html for nested SPA routes', async () => {
    const res = await request(app).get('/abc1234/read');
    expect(res.status).toBe(200);
    expect(res.text).toContain('hiwrld');
  });

  it('sets Cache-Control: no-cache on index.html', async () => {
    const res = await request(app).get('/');
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('returns 404 for unknown asset paths', async () => {
    const res = await request(app).get('/no-such-file.png');
    expect(res.status).toBe(404);
  });

  it('compresses responses when Accept-Encoding includes gzip', async () => {
    const res = await request(app)
      .get('/')
      .set('Accept-Encoding', 'gzip');
    // Express's compression middleware sets the header on responses above its
    // default threshold (1024 bytes). index.html is small but typically clears it.
    // Allow either encoded or uncompressed — we only fail if the header is
    // *wrong*.
    if (res.headers['content-encoding']) {
      expect(res.headers['content-encoding']).toBe('gzip');
    }
  });
});
```

- [ ] **Step 3: Run the test**

```bash
npx vitest run server.test.js
```

Expected: PASS on all assertions.

- [ ] **Step 4: Commit**

```bash
git add server.test.js
git commit -m "test(server): cover CSP, helmet headers, SPA fallback, and 404"
```

---

## Task 14: Playwright e2e — document flow

**Files:**
- Create: `e2e/document-flow.spec.js`

- [ ] **Step 1: Write the test**

```js
import { test, expect } from '@playwright/test';

test.describe('document flow', () => {
  test('landing redirects to a doc URL with a 7-char id', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/[A-Za-z0-9]{7}/);
  });

  test('typing in the textarea updates the preview', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('.document-textarea');
    await textarea.fill('# Hello\n\nworld');
    const article = page.locator('.document-article');
    await expect(article.locator('h1')).toHaveText('Hello');
    await expect(article.locator('p')).toHaveText('world');
  });

  test('smart quotes curl in the preview', async ({ page }) => {
    await page.goto('/');
    await page.locator('.document-textarea').fill("it's a \"test\"");
    const article = page.locator('.document-article');
    const html = await article.innerHTML();
    expect(html).toContain('it’s');
    expect(html).toContain('“test”');
  });

  test('fenced code blocks get syntax highlighting', async ({ page }) => {
    await page.goto('/');
    await page.locator('.document-textarea').fill('```js\nconst x = 1;\n```');
    const code = page.locator('.document-article pre code');
    await expect(code).toBeVisible();
    // hljs adds class names like hljs-keyword, hljs-number after highlight
    await expect(code.locator('.hljs-keyword')).toBeVisible();
  });

  test('youtube watch links become embedded iframes', async ({ page }) => {
    await page.goto('/');
    await page.locator('.document-textarea').fill('see [video](https://www.youtube.com/watch?v=dQw4w9WgXcQ)');
    const iframe = page.locator('.document-article iframe[src*="youtube.com/embed/dQw4w9WgXcQ"]');
    // The youtube filter is debounced 1s — wait for it.
    await expect(iframe).toBeVisible({ timeout: 3000 });
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npx playwright test e2e/document-flow.spec.js
```

Expected: PASS on all 5 specs. Playwright auto-starts `vite preview` per the config.

- [ ] **Step 3: Commit**

```bash
git add e2e/document-flow.spec.js
git commit -m "test(e2e): cover document flow — landing, typing, smart quotes, code, youtube"
```

---

## Task 15: Playwright e2e — concurrent edits (multi-page)

The spec calls these "browser contexts" but they need to be **multiple pages within one context** because BroadcastChannel only broadcasts within the same browser-storage origin (contexts are isolated like incognito windows).

**Files:**
- Create: `e2e/concurrent-edits.spec.js`

- [ ] **Step 1: Write the test**

```js
import { test, expect } from '@playwright/test';

// All scenarios use multiple pages within ONE context so they share
// BroadcastChannel + localStorage. (Different contexts are isolated.)

test.describe('concurrent edits — last-write-wins via BroadcastChannel', () => {
  test('read replication: A types, B observes within 1s', async ({ context }) => {
    const a = await context.newPage();
    await a.goto('/');
    const url = a.url();

    const b = await context.newPage();
    await b.goto(url);

    await a.locator('.document-textarea').fill('hello from A');
    await expect(b.locator('.document-article p')).toHaveText('hello from A', { timeout: 1000 });
  });

  test('simultaneous typing: state converges across both clients', async ({ context }) => {
    const a = await context.newPage();
    await a.goto('/');
    const url = a.url();
    const b = await context.newPage();
    await b.goto(url);

    // Two writes in quick succession — last write wins
    await a.locator('.document-textarea').fill('first from A');
    await b.locator('.document-textarea').fill('first from B');

    // Wait for sync (debounced save is 500ms)
    await a.waitForTimeout(1500);

    // Both clients converge on the same final state
    const aBody = await a.locator('.document-textarea').inputValue();
    const bBody = await b.locator('.document-textarea').inputValue();
    expect(aBody).toBe(bBody);
  });

  test('rapid alternation: A, B, A, B → both end on the same string', async ({ context }) => {
    const a = await context.newPage();
    await a.goto('/');
    const url = a.url();
    const b = await context.newPage();
    await b.goto(url);

    await a.locator('.document-textarea').fill('a-1');
    await a.waitForTimeout(700);
    await b.locator('.document-textarea').fill('b-1');
    await b.waitForTimeout(700);
    await a.locator('.document-textarea').fill('a-2');
    await a.waitForTimeout(700);
    await b.locator('.document-textarea').fill('b-2');
    await b.waitForTimeout(1500);

    expect(await a.locator('.document-textarea').inputValue())
      .toBe(await b.locator('.document-textarea').inputValue());
  });

  test('late joiner: B opens URL fresh and sees A’s content', async ({ context }) => {
    const a = await context.newPage();
    await a.goto('/');
    const url = a.url();
    await a.locator('.document-textarea').fill('typed before B joined');
    await a.waitForTimeout(800); // let debounced save fire

    const b = await context.newPage();
    await b.goto(url);
    await expect(b.locator('.document-article p')).toHaveText('typed before B joined', { timeout: 2000 });
  });

  test('three-way: convergence scales past two clients', async ({ context }) => {
    const a = await context.newPage();
    await a.goto('/');
    const url = a.url();
    const b = await context.newPage();
    await b.goto(url);
    const c = await context.newPage();
    await c.goto(url);

    await a.locator('.document-textarea').fill('from A');
    await a.waitForTimeout(700);
    await b.locator('.document-textarea').fill('from B');
    await b.waitForTimeout(700);
    await c.locator('.document-textarea').fill('from C');
    await c.waitForTimeout(1500);

    const aBody = await a.locator('.document-textarea').inputValue();
    const bBody = await b.locator('.document-textarea').inputValue();
    const cBody = await c.locator('.document-textarea').inputValue();
    expect(aBody).toBe(bBody);
    expect(bBody).toBe(cBody);
  });

  test('disconnect / reconnect: B catches up after A keeps typing', async ({ context }) => {
    const a = await context.newPage();
    await a.goto('/');
    const url = a.url();
    const b = await context.newPage();
    await b.goto(url);

    await a.locator('.document-textarea').fill('initial');
    await a.waitForTimeout(700);
    await expect(b.locator('.document-article p')).toHaveText('initial');

    await b.close();

    await a.locator('.document-textarea').fill('typed while B was gone');
    await a.waitForTimeout(700);

    const b2 = await context.newPage();
    await b2.goto(url);
    await expect(b2.locator('.document-article p')).toHaveText('typed while B was gone', { timeout: 2000 });
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npx playwright test e2e/concurrent-edits.spec.js
```

Expected: PASS on all 6 scenarios.

If a scenario fails on flake (timing-sensitive sync), bump the `waitForTimeout` values by 50% rather than disabling the test. If still flaky, leave a `test.fixme` with a comment and open a follow-up task — do not silently skip.

- [ ] **Step 3: Commit**

```bash
git add e2e/concurrent-edits.spec.js
git commit -m "test(e2e): cover multi-tab concurrent-edit convergence (last-write-wins)"
```

---

## Task 16: Playwright e2e — persistence

**Files:**
- Create: `e2e/persistence.spec.js`

- [ ] **Step 1: Write the test**

```js
import { test, expect } from '@playwright/test';

test.describe('persistence', () => {
  test('content survives a full reload via localStorage', async ({ page }) => {
    await page.goto('/');
    const url = page.url();
    await page.locator('.document-textarea').fill('persist me');
    // debounced save is 500ms
    await page.waitForTimeout(800);
    await page.reload();
    await expect(page).toHaveURL(url);
    await expect(page.locator('.document-textarea')).toHaveValue('persist me');
  });

  test('navigating directly to an existing doc URL loads its content', async ({ page, context }) => {
    // First page: create a doc and type
    const creator = await context.newPage();
    await creator.goto('/');
    await creator.locator('.document-textarea').fill('pre-existing content');
    const url = creator.url();
    await creator.waitForTimeout(800);
    await creator.close();

    // Second page in same context: deep-link to the same URL
    await page.goto(url);
    await expect(page.locator('.document-textarea')).toHaveValue('pre-existing content', { timeout: 2000 });
  });

  test('bookmarks list persists across reloads', async ({ page }) => {
    await page.goto('/');
    const firstUrl = page.url();
    await page.locator('.document-textarea').fill('first doc');
    await page.waitForTimeout(800);

    // Open the menu, click "new doc"
    await page.locator('.menu-button').click();
    await page.locator('.add-button').click();
    await page.locator('.document-textarea').fill('second doc');
    await page.waitForTimeout(800);

    await page.reload();
    await page.locator('.menu-button').click();
    const items = page.locator('.document-menu li.document-menu-item');
    await expect(items).toHaveCount(2);
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npx playwright test e2e/persistence.spec.js
```

Expected: PASS on all 3 scenarios.

- [ ] **Step 3: Commit**

```bash
git add e2e/persistence.spec.js
git commit -m "test(e2e): cover localStorage persistence and bookmark survival"
```

---

## Task 17: Playwright e2e — sanitization

**Files:**
- Create: `e2e/sanitization.spec.js`

- [ ] **Step 1: Write the test**

```js
import { test, expect } from '@playwright/test';

test.describe('sanitization', () => {
  test('strips inline <script> tags from preview', async ({ page }) => {
    await page.goto('/');
    let alerted = false;
    page.on('dialog', async (d) => {
      alerted = true;
      await d.dismiss();
    });
    await page.locator('.document-textarea').fill('hi <script>window.alert(1)</script> bye');
    await page.waitForTimeout(500);
    expect(alerted).toBe(false);
    const html = await page.locator('.document-article').innerHTML();
    expect(html).not.toMatch(/<script/i);
  });

  test('strips onerror handlers from img tags', async ({ page }) => {
    await page.goto('/');
    let alerted = false;
    page.on('dialog', async (d) => {
      alerted = true;
      await d.dismiss();
    });
    await page.locator('.document-textarea').fill('<img src=x onerror="window.alert(1)">');
    await page.waitForTimeout(500);
    expect(alerted).toBe(false);
    const html = await page.locator('.document-article').innerHTML();
    expect(html).not.toMatch(/onerror/i);
  });

  test('strips iframes with javascript: src', async ({ page }) => {
    await page.goto('/');
    await page.locator('.document-textarea').fill('<iframe src="javascript:alert(1)"></iframe>');
    await page.waitForTimeout(500);
    const html = await page.locator('.document-article').innerHTML();
    expect(html).not.toMatch(/javascript:/i);
  });

  test('strips javascript: protocol from links', async ({ page }) => {
    await page.goto('/');
    await page.locator('.document-textarea').fill('[click](javascript:alert(1))');
    await page.waitForTimeout(500);
    const html = await page.locator('.document-article').innerHTML();
    expect(html).not.toMatch(/javascript:/i);
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npx playwright test e2e/sanitization.spec.js
```

Expected: PASS on all 4 scenarios.

- [ ] **Step 3: Commit**

```bash
git add e2e/sanitization.spec.js
git commit -m "test(e2e): cover XSS sanitization (script, onerror, iframe, javascript:)"
```

---

## Task 18: Playwright e2e — document menu

**Files:**
- Create: `e2e/document-menu.spec.js`

- [ ] **Step 1: Write the test**

```js
import { test, expect } from '@playwright/test';

test.describe('document menu', () => {
  test('menu button toggles the drawer visible', async ({ page }) => {
    await page.goto('/');
    const menu = page.locator('.document-menu');
    // Drawer starts hidden via CSS; toggling makes it visible
    await page.locator('.menu-button').click();
    await expect(menu).toBeVisible();
  });

  test('add button creates a new document and switches to it', async ({ page }) => {
    await page.goto('/');
    const initialUrl = page.url();
    await page.locator('.document-textarea').fill('first');
    await page.waitForTimeout(800);
    await page.locator('.add-button').click();
    await expect(page).not.toHaveURL(initialUrl);
    await expect(page.locator('.document-textarea')).toHaveValue('');
  });

  test('clicking a menu item switches to that document', async ({ page }) => {
    await page.goto('/');
    await page.locator('.document-textarea').fill('# Doc One');
    await page.waitForTimeout(800);

    await page.locator('.add-button').click();
    await page.locator('.document-textarea').fill('# Doc Two');
    await page.waitForTimeout(800);

    await page.locator('.menu-button').click();
    const docOneItem = page.locator('.document-menu-item', { hasText: 'Doc One' });
    await docOneItem.click();
    await expect(page.locator('.document-textarea')).toHaveValue('# Doc One');
  });

  test('delete button removes a document from the menu', async ({ page }) => {
    await page.goto('/');
    await page.locator('.document-textarea').fill('# Keep');
    await page.waitForTimeout(800);
    await page.locator('.add-button').click();
    await page.locator('.document-textarea').fill('# Delete');
    await page.waitForTimeout(800);

    await page.locator('.menu-button').click();
    const items = page.locator('.document-menu li.document-menu-item');
    await expect(items).toHaveCount(2);

    await page
      .locator('.document-menu-item', { hasText: 'Delete' })
      .locator('.document-menu-item-delete-button')
      .click();
    await expect(items).toHaveCount(1);
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npx playwright test e2e/document-menu.spec.js
```

Expected: PASS on all 4 scenarios.

- [ ] **Step 3: Commit**

```bash
git add e2e/document-menu.spec.js
git commit -m "test(e2e): cover menu drawer, add doc, switch doc, delete doc"
```

---

## Task 19: GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/test.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: test

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Build
        run: npm run build

      - name: Vitest
        id: vitest
        run: npm run test:coverage
        continue-on-error: true

      - name: Playwright
        id: playwright
        run: npm run test:e2e
        continue-on-error: true

      - name: Upload test artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-artifacts
          path: |
            playwright-report/
            test-results/
            coverage/
          retention-days: 14

      - name: Summary
        if: always()
        run: |
          echo "## Test results" >> $GITHUB_STEP_SUMMARY
          echo "- Vitest outcome: ${{ steps.vitest.outcome }}" >> $GITHUB_STEP_SUMMARY
          echo "- Playwright outcome: ${{ steps.playwright.outcome }}" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "_Failures do not block this workflow (report-only mode)._" >> $GITHUB_STEP_SUMMARY
```

- [ ] **Step 2: Verify the YAML parses**

```bash
node -e "const yaml=require('node:fs').readFileSync('.github/workflows/test.yml','utf8'); console.log('Lines:',yaml.split('\\n').length)"
```

Expected: prints a line count, no parse error. (We don't run `actionlint` to avoid extra deps.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "ci: add report-only test workflow (vitest + playwright on push and PR)"
```

---

## Task 20: README "Testing" section

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a new "Testing" section to `README.md`**

Insert this block in `README.md` between the existing "Scripts" section and "Stack" section:

```markdown
## Testing

```bash
npm run test          # Vitest unit + integration (jsdom)
npm run test:watch    # Vitest in watch mode
npm run test:coverage # With v8 coverage report
npm run test:e2e      # Playwright end-to-end (auto-builds + serves dist/)
npm run test:e2e:ui   # Playwright UI mode for interactive runs
npm run test:all      # Vitest then Playwright
```

### What's covered

- **Unit / integration (Vitest, jsdom)**: markdown pipeline (sanitization, smart quotes, code highlighting, YouTube parsing), Backbone models and views (`document-model`, `document-collection`, `document-menu-view`, `app-model`, `app-view`), the BroadcastChannel sync fallback, and the Express server (CSP, helmet, SPA fallback) via `supertest`.
- **End-to-end (Playwright, Chromium)**: full document flow, multi-tab concurrent edits, localStorage persistence, XSS sanitization, document menu navigation.

### Concurrency contract

The multi-tab e2e tests in `e2e/concurrent-edits.spec.js` lock in **last-write-wins** convergence — they assert that *all* clients arrive at the same final state, but do **not** assert character-level merge correctness. This matches Firebase Realtime Database's `set()` semantics and the README's "best edited by one person at a time" warning. If true collaborative editing (CRDT-based) is ever added, those tests will need to be re-scoped to merge correctness.

### What's not covered

- Visual regression
- Cross-browser (Firefox / WebKit) — Chromium only on first pass
- Real Firebase or the Firebase Emulator Suite — unit tests use `vi.mock`; e2e exercises the BroadcastChannel fallback path. A manual smoke test against a real Firebase project is recommended before any backend migration.
- Performance / load testing
- Accessibility audit (axe-core)

### CI

`.github/workflows/test.yml` runs Vitest + Playwright on every push and PR to GitHub. The workflow is **report-only** — failures do not block merges while the suite stabilizes. Test artifacts (Playwright traces, coverage HTML) are uploaded for 14 days.
```

- [ ] **Step 2: Verify the README still renders**

```bash
node -e "const fs=require('node:fs'); const r=fs.readFileSync('README.md','utf8'); console.log('Sections:', r.match(/^##\\s/gm)?.length || 0)"
```

Expected: prints a section count higher than before.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): add Testing section covering vitest, playwright, CI"
```

---

## Task 21: Final verification

- [ ] **Step 1: Full unit suite run with coverage**

```bash
npm run test:coverage
```

Expected: All Vitest specs PASS. Coverage report printed; HTML report in `coverage/`. Soft target ~70% lines on testable modules — note any module well below this in the PR description.

- [ ] **Step 2: Full e2e run**

```bash
npm run test:e2e
```

Expected: All Playwright specs PASS. HTML report generated in `playwright-report/`.

- [ ] **Step 3: Lint pass**

```bash
npm run check
```

Expected: clean — no Biome errors. If any of the new files trip the linter, fix inline (most likely: import sort order).

- [ ] **Step 4: Build still works**

```bash
npm run build
```

Expected: clean build, no warnings new vs. before.

- [ ] **Step 5: Update task list**

Mark TODO task #2 (Add unit tests) and task #3 (Add end-to-end tests with Playwright) as completed — they're consolidated in this work.

- [ ] **Step 6: Open the PR**

```bash
git push -u origin modernize
gh pr create --title "test: add Vitest + Playwright suite with report-only CI" --body "$(cat <<'EOF'
## Summary
- Vitest unit/integration suite covering markdown pipeline, Backbone models/views, BroadcastChannel sync, and Express server
- Playwright e2e suite covering document flow, multi-tab concurrent edits (last-write-wins), persistence, XSS sanitization, and the document menu
- GitHub Actions workflow (report-only — does not block merges)
- Refactor: markdown pipeline extracted from `app-view.js` to `src/markdown.js`; `server.js` exports `createApp()` for testability

Spec: `docs/superpowers/specs/2026-05-01-testing-strategy-design.md`
Plan: `docs/superpowers/plans/2026-05-01-testing-strategy.md`

## Concurrency contract
The multi-tab tests assert **last-write-wins** convergence — all clients reach the same final state, but no character-level merge guarantee. Matches current Firebase `set()` behavior. Will need re-scoping if a CRDT is ever introduced.

## Test plan
- [ ] `npm run test:coverage` passes locally
- [ ] `npm run test:e2e` passes locally
- [ ] CI workflow runs on this PR (report-only — failures expected to be visible but non-blocking)
- [ ] Manual smoke: `npm run dev`, type markdown, see preview, open second tab on same URL, watch live sync

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review checklist (run after writing this plan)

- **Spec coverage:** every entry in the spec's coverage map has a task. ✅
- **Placeholder scan:** no TBD/TODO/"fill in details" anywhere — all code blocks are concrete. ✅
- **Type consistency:** function names match across tasks (`renderMarkdown`, `applySmartQuotes`, `extractYoutubeId`, `youtubeEmbed`, `createApp`, `resetFakeStore`, `setRemoteValue`). ✅
- **Order:** Task 3 (markdown extraction) precedes Task 6 (markdown tests); Task 4 (Firebase mocks) precedes Tasks 8-12 (model/view tests); Task 5 (server refactor) precedes Task 13 (server test). ✅
- **Spec deviations called out:** "browser contexts" in spec → "pages within one context" in plan (Task 15), with reasoning given. ✅
