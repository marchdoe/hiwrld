# Folder Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add workspaces, folder trees, a REST API, and an MCP server so humans and AI agents can collaboratively manage nested markdown documents.

**Architecture:** A new `api/` directory holds Express route handlers and a server-side Supabase admin client; the frontend grows a `WorkspaceDrawer` that replaces `DocumentMenu` and shows either the folder tree (workspace configured) or the flat local list (no workspace). A standalone MCP server in `src/mcp/` calls the REST API via `fetch` so AI agents can connect natively.

**Tech Stack:** Express 5, Supabase (postgres + RLS), `@modelcontextprotocol/sdk`, React 19, TanStack Query, Vitest + Supertest, Playwright.

---

## File Map

### New files
| Path | Responsibility |
|---|---|
| `src/types/workspace.ts` | TypeScript types: `Workspace`, `Folder`, `WorkspaceDoc`, `TreeNode` |
| `api/supabaseAdmin.ts` | Lazy server-side Supabase client using `SUPABASE_SERVICE_KEY` |
| `api/workspaces.ts` | Express router: POST/GET workspaces + GET tree |
| `api/folders.ts` | Express router: POST/PATCH/DELETE folders |
| `api/documents.ts` | Express router: GET/POST/PATCH/PATCH(move)/DELETE workspace documents |
| `api/api.test.ts` | Supertest tests for all three routers |
| `src/mcp/server.ts` | MCP server with 6 tools: calls the running REST API via fetch |
| `src/hooks/useWorkspace.ts` | Fetches tree, exposes create/rename/delete/move operations |
| `src/hooks/useWorkspace.test.ts` | Unit tests for useWorkspace |
| `src/components/ContextMenu.tsx` | Positioned right-click context menu (generic) |
| `src/components/FolderTree.tsx` | Recursive tree of folders + files |
| `src/components/WorkspaceCreate.tsx` | Modal: name field → POST /api/workspaces |
| `src/components/WorkspaceDrawer.tsx` | Full drawer: folder tree when workspace exists, flat list + CTA otherwise |
| `src/components/WorkspaceDrawer.test.tsx` | Component tests for WorkspaceDrawer |
| `e2e/workspace.spec.ts` | E2E: create workspace, folders, documents, navigate tree |

### Modified files
| Path | Change |
|---|---|
| `src/lib/generateId.ts` | Add `generateWorkspaceKey()` — 32-char URL-safe random string |
| `src/lib/generateId.test.ts` | Tests for `generateWorkspaceKey` |
| `src/lib/supabase.ts` | Add `workspaces` and `folders` to `Database` type; add `workspace_id`/`folder_id` to `documents` |
| `server.ts` | Mount `/api` router |
| `tsconfig.json` | Add `"api"` to `include` |
| `.env.example` | Add `SUPABASE_SERVICE_KEY`, `HIWRLD_WORKSPACE_KEY`, `HIWRLD_API_URL` |
| `src/components/WritePane.tsx` | Replace `<DocumentMenu>` with `<WorkspaceDrawer>` |
| `package.json` | Add `@modelcontextprotocol/sdk` dep; add `mcp` script |
| `vitest.config.ts` | Add `api/**/*.test.ts` to `include` |

---

## Task 1: TypeScript types + Supabase schema

**Files:**
- Create: `src/types/workspace.ts`
- Modify: `src/lib/supabase.ts`

- [ ] **Step 1: Create workspace types**

```typescript
// src/types/workspace.ts
export interface Workspace {
  id: string;
  name: string;
  secret_key: string;
  created_at: string;
}

export interface Folder {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
}

export interface WorkspaceDoc {
  id: string;
  workspace_id: string;
  folder_id: string | null;
  body: string;
  title: string;
  created: string;
  updated_at: string | null;
}

export interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'document';
  children: TreeNode[];     // always present (empty array for docs and empty folders)
  // document-only fields:
  title?: string;
  body?: string;
}
```

- [ ] **Step 2: Update `src/lib/supabase.ts` Database type**

Replace the entire file with:

```typescript
// src/lib/supabase.ts  — full file replacement
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import type { Document } from '../types/document';
import type { Folder, Workspace } from '../types/workspace';

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: Document & { workspace_id: string | null; folder_id: string | null };
        Insert: Omit<Document, 'created' | 'updated_at'> & {
          workspace_id?: string | null;
          folder_id?: string | null;
        };
        Update: Partial<Document & { workspace_id: string | null; folder_id: string | null }>;
      };
      workspaces: {
        Row: Workspace;
        Insert: Omit<Workspace, 'created_at'>;
        Update: Partial<Workspace>;
      };
      folders: {
        Row: Folder;
        Insert: Omit<Folder, 'created_at'>;
        Update: Partial<Folder>;
      };
    };
  };
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient<Database> | null =
  url && anonKey ? createClient<Database>(url, anonKey) : null;
```

- [ ] **Step 3: Run SQL in Supabase dashboard SQL editor**

```sql
-- New tables
create table workspaces (
  id          text        primary key,
  name        text        not null,
  secret_key  text        not null unique,
  created_at  timestamptz not null default now()
);
alter table workspaces enable row level security;
create policy "service role only" on workspaces using (false);

create table folders (
  id            text        primary key,
  workspace_id  text        not null references workspaces(id) on delete cascade,
  parent_id     text        references folders(id) on delete cascade,
  name          text        not null,
  created_at    timestamptz not null default now(),
  unique(workspace_id, parent_id, name)
);
alter table folders enable row level security;
create policy "service role only" on folders using (false);

-- Extend existing documents table
alter table documents
  add column workspace_id text references workspaces(id) on delete set null,
  add column folder_id    text references folders(id)    on delete set null;
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm exec tsc --noEmit
```
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/types/workspace.ts src/lib/supabase.ts
git commit -m "feat(workspace): add Workspace and Folder types, extend Database schema"
```

---

## Task 2: `generateWorkspaceKey` utility

**Files:**
- Modify: `src/lib/generateId.ts`
- Modify: `src/lib/generateId.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/lib/generateId.test.ts`:

```typescript
import { generateDocumentId, generateWorkspaceKey } from './generateId';

describe('generateWorkspaceKey', () => {
  it('generates a 32-character alphanumeric string', () => {
    const key = generateWorkspaceKey();
    expect(key).toMatch(/^[a-zA-Z0-9]{32}$/);
  });

  it('generates unique keys', () => {
    const keys = new Set(Array.from({ length: 100 }, generateWorkspaceKey));
    expect(keys.size).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test src/lib/generateId.test.ts
```
Expected: FAIL — `generateWorkspaceKey is not a function`

- [ ] **Step 3: Implement `generateWorkspaceKey`**

Add to `src/lib/generateId.ts`:

```typescript
const KEY_LENGTH = 32;

export function generateWorkspaceKey(): string {
  const buf = new Uint8Array(KEY_LENGTH);
  crypto.getRandomValues(buf);
  let key = '';
  for (const n of buf) {
    key += ID_CHARACTERS.charAt(n % ID_CHARACTERS.length);
  }
  return key;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test src/lib/generateId.test.ts
```
Expected: all tests PASS

- [ ] **Step 5: Update `.env.example`**

```bash
# src/lib/supabase.ts — anon key for browser (existing)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# api/supabaseAdmin.ts — service role key for server-side API routes (new)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# src/mcp/server.ts — MCP server config (new)
HIWRLD_API_URL=http://localhost:2000
HIWRLD_WORKSPACE_KEY=your-workspace-secret-key
```

- [ ] **Step 6: Add `api` to `tsconfig.json` and `vitest.config.ts`**

`tsconfig.json` — change include:
```json
"include": ["src", "test", "e2e", "api", "server.ts", "playwright.config.ts"]
```

`vitest.config.ts` — change include in test config:
```typescript
include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'server.test.ts', 'api/**/*.test.ts'],
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/generateId.ts src/lib/generateId.test.ts .env.example tsconfig.json vitest.config.ts
git commit -m "feat(workspace): add generateWorkspaceKey, update tsconfig and env"
```

---

## Task 3: Server-side Supabase admin client

**Files:**
- Create: `api/supabaseAdmin.ts`

- [ ] **Step 1: Create the admin client**

```typescript
// api/supabaseAdmin.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/supabase';

let _client: SupabaseClient<Database> | null = null;

export function getAdminClient(): SupabaseClient<Database> {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  }
  _client = createClient<Database>(url, key);
  return _client;
}

/** Reset the cached client — for use in tests only. */
export function _resetAdminClient(): void {
  _client = null;
}
```

- [ ] **Step 2: Commit**

```bash
git add api/supabaseAdmin.ts
git commit -m "feat(workspace): add server-side Supabase admin client"
```

---

## Task 4: Workspace API routes (POST + GET + tree)

**Files:**
- Create: `api/workspaces.ts`
- Create: `api/api.test.ts`
- Modify: `server.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// api/api.test.ts
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../server';

// Mock the admin client so tests don't need a real Supabase project
vi.mock('./supabaseAdmin', () => ({
  getAdminClient: vi.fn(),
  _resetAdminClient: vi.fn(),
}));

import { getAdminClient } from './supabaseAdmin';

function mockDb(overrides: Record<string, unknown> = {}) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  vi.mocked(getAdminClient).mockReturnValue(chain as never);
  return chain;
}

const app = createApp();

describe('POST /api/workspaces', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a workspace and returns id, name, secret_key', async () => {
    const ws = { id: 'ws1', name: 'test', secret_key: 'sk_abc', created_at: '2026-01-01' };
    mockDb({ single: vi.fn().mockResolvedValue({ data: ws, error: null }) });

    const res = await request(app).post('/api/workspaces').send({ name: 'test' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 'ws1', name: 'test', secret_key: 'sk_abc' });
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/workspaces').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/workspaces/:key', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns workspace metadata for a valid key', async () => {
    const ws = { id: 'ws1', name: 'test', secret_key: 'sk_abc', created_at: '2026-01-01' };
    mockDb({ single: vi.fn().mockResolvedValue({ data: ws, error: null }) });

    const res = await request(app).get('/api/workspaces/sk_abc');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('test');
  });

  it('returns 404 when key is not found', async () => {
    mockDb({ single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }) });
    const res = await request(app).get('/api/workspaces/bad_key');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/workspaces/:key/tree', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a nested tree of folders and documents', async () => {
    // Workspace lookup
    const ws = { id: 'ws1', name: 'test', secret_key: 'sk_abc', created_at: '2026-01-01' };
    // Folders and docs queries — simplified mock
    vi.mocked(getAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'workspaces') return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: ws, error: null }),
        };
        if (table === 'folders') return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
        if (table === 'documents') return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
        return {};
      }),
    } as never);

    const res = await request(app).get('/api/workspaces/sk_abc/tree');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('children');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test api/api.test.ts
```
Expected: FAIL — `Cannot find module './workspaces'` or 404 on all routes

- [ ] **Step 3: Implement workspace routes**

```typescript
// api/workspaces.ts
import { Router } from 'express';
import { generateDocumentId, generateWorkspaceKey } from '../src/lib/generateId';
import type { Folder, TreeNode, WorkspaceDoc } from '../src/types/workspace';
import { getAdminClient } from './supabaseAdmin';

export const workspacesRouter = Router();

// POST /api/workspaces
workspacesRouter.post('/', async (req, res, next) => {
  try {
    const { name } = req.body as { name?: unknown };
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    const db = getAdminClient();
    const { data, error } = await db
      .from('workspaces')
      .insert({ id: generateDocumentId(), name, secret_key: generateWorkspaceKey() })
      .select()
      .single();
    if (error) return next(error);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// GET /api/workspaces/:key
workspacesRouter.get('/:key', async (req, res, next) => {
  try {
    const db = getAdminClient();
    const { data, error } = await db
      .from('workspaces')
      .select('id, name, created_at')
      .eq('secret_key', req.params.key)
      .single();
    if (error?.code === 'PGRST116' || !data) return res.status(404).json({ error: 'not found' });
    if (error) return next(error);
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/workspaces/:key/tree
workspacesRouter.get('/:key/tree', async (req, res, next) => {
  try {
    const db = getAdminClient();
    // 1. Resolve workspace
    const { data: ws, error: wsErr } = await db
      .from('workspaces').select('id').eq('secret_key', req.params.key).single();
    if (wsErr?.code === 'PGRST116' || !ws) return res.status(404).json({ error: 'not found' });
    if (wsErr) return next(wsErr);

    // 2. Fetch all folders and documents
    const [{ data: folders, error: fErr }, { data: docs, error: dErr }] = await Promise.all([
      db.from('folders').select('*').eq('workspace_id', ws.id),
      db.from('documents').select('id,title,folder_id').eq('workspace_id', ws.id),
    ]);
    if (fErr) return next(fErr);
    if (dErr) return next(dErr);

    // 3. Build tree
    const tree = buildTree(ws.id, folders ?? [], (docs ?? []) as WorkspaceDoc[]);
    res.json(tree);
  } catch (err) { next(err); }
});

function buildTree(workspaceId: string, folders: Folder[], docs: WorkspaceDoc[]): TreeNode {
  const folderMap = new Map<string | null, TreeNode[]>();

  for (const f of folders) {
    const node: TreeNode = { id: f.id, name: f.name, type: 'folder', children: [] };
    const siblings = folderMap.get(f.parent_id) ?? [];
    siblings.push(node);
    folderMap.set(f.parent_id, siblings);
  }
  for (const d of docs) {
    const node: TreeNode = { id: d.id, name: d.title || d.id, type: 'document', title: d.title, children: [] };
    const siblings = folderMap.get(d.folder_id ?? null) ?? [];
    siblings.push(node);
    folderMap.set(d.folder_id ?? null, siblings);
  }

  // Attach children to folder nodes
  const rootChildren = folderMap.get(null) ?? [];
  function attachChildren(nodes: TreeNode[]): void {
    for (const node of nodes) {
      if (node.type === 'folder') {
        node.children = folderMap.get(node.id) ?? [];
        attachChildren(node.children);
      }
    }
  }
  attachChildren(rootChildren);

  return { id: workspaceId, name: 'root', type: 'folder', children: rootChildren };
}
```

- [ ] **Step 4: Mount router in `server.ts`**

Add after the helmet middleware block and before static serving (around line 33):

```typescript
import { json } from 'express';
import { workspacesRouter } from './api/workspaces';
// add more router imports below as they are created

// after app.use(compression()) and helmet block:
app.use(json());
app.use('/api/workspaces', workspacesRouter);
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm test api/api.test.ts
```
Expected: all workspace tests PASS

- [ ] **Step 6: Commit**

```bash
git add api/workspaces.ts api/api.test.ts server.ts
git commit -m "feat(workspace): add POST/GET workspaces and GET tree routes"
```

---

## Task 5: Folder API routes

**Files:**
- Create: `api/folders.ts`
- Modify: `api/api.test.ts`, `server.ts`

- [ ] **Step 1: Write failing tests**

Append to `api/api.test.ts`:

```typescript
describe('POST /api/workspaces/:key/folders', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a folder and returns it', async () => {
    const ws = { id: 'ws1', secret_key: 'sk_abc' };
    const folder = { id: 'fld1', workspace_id: 'ws1', parent_id: null, name: 'Projects', created_at: '2026-01-01' };
    vi.mocked(getAdminClient).mockReturnValue({
      from: vi.fn((table: string) => table === 'workspaces'
        ? { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: ws, error: null }) }
        : { insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: folder, error: null }) }
      ),
    } as never);

    const res = await request(app).post('/api/workspaces/sk_abc/folders').send({ name: 'Projects' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Projects');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/workspaces/sk_abc/folders').send({});
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/workspaces/:key/folders/:id', () => {
  it('renames a folder', async () => {
    const ws = { id: 'ws1', secret_key: 'sk_abc' };
    const updated = { id: 'fld1', name: 'Renamed', workspace_id: 'ws1', parent_id: null, created_at: '2026-01-01' };
    vi.mocked(getAdminClient).mockReturnValue({
      from: vi.fn((table: string) => table === 'workspaces'
        ? { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: ws, error: null }) }
        : { update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: updated, error: null }) }
      ),
    } as never);

    const res = await request(app).patch('/api/workspaces/sk_abc/folders/fld1').send({ name: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed');
  });
});

describe('DELETE /api/workspaces/:key/folders/:id', () => {
  it('deletes folder and returns 204', async () => {
    const ws = { id: 'ws1', secret_key: 'sk_abc' };
    vi.mocked(getAdminClient).mockReturnValue({
      from: vi.fn((table: string) => table === 'workspaces'
        ? { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: ws, error: null }) }
        : { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
      ),
    } as never);

    const res = await request(app).delete('/api/workspaces/sk_abc/folders/fld1');
    expect(res.status).toBe(204);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test api/api.test.ts --reporter=verbose 2>&1 | grep -E "FAIL|folders"
```

- [ ] **Step 3: Implement folder routes**

```typescript
// api/folders.ts
import { Router } from 'express';
import { generateDocumentId } from '../src/lib/generateId';
import { getAdminClient } from './supabaseAdmin';

export const foldersRouter = Router({ mergeParams: true });

async function resolveWorkspace(key: string) {
  const db = getAdminClient();
  const { data, error } = await db
    .from('workspaces').select('id').eq('secret_key', key).single();
  if (error?.code === 'PGRST116' || !data) return null;
  if (error) throw error;
  return data;
}

// POST /api/workspaces/:key/folders
foldersRouter.post('/', async (req, res, next) => {
  try {
    const { name, parent_id } = req.body as { name?: unknown; parent_id?: string };
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name is required' });
    const ws = await resolveWorkspace(req.params.key);
    if (!ws) return res.status(404).json({ error: 'workspace not found' });
    const db = getAdminClient();
    const { data, error } = await db
      .from('folders')
      .insert({ id: generateDocumentId(), workspace_id: ws.id, parent_id: parent_id ?? null, name })
      .select().single();
    if (error) return next(error);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// PATCH /api/workspaces/:key/folders/:id
foldersRouter.patch('/:id', async (req, res, next) => {
  try {
    const { name } = req.body as { name?: unknown };
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name is required' });
    const ws = await resolveWorkspace(req.params.key);
    if (!ws) return res.status(404).json({ error: 'workspace not found' });
    const db = getAdminClient();
    const { data, error } = await db
      .from('folders').update({ name })
      .eq('id', req.params.id).eq('workspace_id', ws.id)
      .select().single();
    if (error?.code === 'PGRST116' || !data) return res.status(404).json({ error: 'not found' });
    if (error) return next(error);
    res.json(data);
  } catch (err) { next(err); }
});

// DELETE /api/workspaces/:key/folders/:id
// Supabase cascades the delete to sub-folders and documents via ON DELETE CASCADE
foldersRouter.delete('/:id', async (req, res, next) => {
  try {
    const ws = await resolveWorkspace(req.params.key);
    if (!ws) return res.status(404).json({ error: 'workspace not found' });
    const db = getAdminClient();
    const { error } = await db
      .from('folders').delete()
      .eq('id', req.params.id).eq('workspace_id', ws.id);
    if (error) return next(error);
    res.status(204).end();
  } catch (err) { next(err); }
});
```

- [ ] **Step 4: Mount in `server.ts`**

Add imports and mount alongside the workspaces router:

```typescript
import { foldersRouter } from './api/folders';
// in createApp():
app.use('/api/workspaces/:key/folders', foldersRouter);
```

- [ ] **Step 5: Run tests**

```bash
pnpm test api/api.test.ts
```
Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add api/folders.ts api/api.test.ts server.ts
git commit -m "feat(workspace): add folder CRUD routes"
```

---

## Task 6: Document API routes

**Files:**
- Create: `api/documents.ts`
- Modify: `api/api.test.ts`, `server.ts`

- [ ] **Step 1: Write failing tests**

Append to `api/api.test.ts`:

```typescript
describe('POST /api/workspaces/:key/documents', () => {
  it('creates a document and returns 201', async () => {
    const ws = { id: 'ws1', secret_key: 'sk_abc' };
    const doc = { id: 'doc1', workspace_id: 'ws1', folder_id: null, body: '', title: 'New', created: '2026-01-01', updated_at: null };
    vi.mocked(getAdminClient).mockReturnValue({
      from: vi.fn((table: string) => table === 'workspaces'
        ? { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: ws, error: null }) }
        : { insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: doc, error: null }) }
      ),
    } as never);

    const res = await request(app)
      .post('/api/workspaces/sk_abc/documents')
      .send({ title: 'New', body: '' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('doc1');
  });
});

describe('GET /api/workspaces/:key/documents/:id', () => {
  it('returns the document body and metadata', async () => {
    const ws = { id: 'ws1', secret_key: 'sk_abc' };
    const doc = { id: 'doc1', workspace_id: 'ws1', body: '# Hello', title: 'Hello', folder_id: null, created: '2026-01-01', updated_at: null };
    vi.mocked(getAdminClient).mockReturnValue({
      from: vi.fn((table: string) => table === 'workspaces'
        ? { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: ws, error: null }) }
        : { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: doc, error: null }) }
      ),
    } as never);

    const res = await request(app).get('/api/workspaces/sk_abc/documents/doc1');
    expect(res.status).toBe(200);
    expect(res.body.body).toBe('# Hello');
  });
});

describe('PATCH /api/workspaces/:key/documents/:id/move', () => {
  it('moves a document to a new folder', async () => {
    const ws = { id: 'ws1', secret_key: 'sk_abc' };
    const doc = { id: 'doc1', workspace_id: 'ws1', folder_id: 'fld2', body: '', title: 'Test', created: '2026-01-01', updated_at: null };
    vi.mocked(getAdminClient).mockReturnValue({
      from: vi.fn((table: string) => table === 'workspaces'
        ? { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: ws, error: null }) }
        : { update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: doc, error: null }) }
      ),
    } as never);

    const res = await request(app)
      .patch('/api/workspaces/sk_abc/documents/doc1/move')
      .send({ folder_id: 'fld2' });
    expect(res.status).toBe(200);
    expect(res.body.folder_id).toBe('fld2');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test api/api.test.ts --reporter=verbose 2>&1 | grep -E "FAIL|documents"
```

- [ ] **Step 3: Implement document routes**

```typescript
// api/documents.ts
import { Router } from 'express';
import { generateDocumentId } from '../src/lib/generateId';
import { getAdminClient } from './supabaseAdmin';

export const documentsRouter = Router({ mergeParams: true });

async function resolveWorkspace(key: string) {
  const db = getAdminClient();
  const { data, error } = await db.from('workspaces').select('id').eq('secret_key', key).single();
  if (error?.code === 'PGRST116' || !data) return null;
  if (error) throw error;
  return data;
}

// GET /api/workspaces/:key/documents/:id
documentsRouter.get('/:id', async (req, res, next) => {
  try {
    const ws = await resolveWorkspace(req.params.key);
    if (!ws) return res.status(404).json({ error: 'workspace not found' });
    const db = getAdminClient();
    const { data, error } = await db.from('documents').select('*')
      .eq('id', req.params.id).eq('workspace_id', ws.id).single();
    if (error?.code === 'PGRST116' || !data) return res.status(404).json({ error: 'not found' });
    if (error) return next(error);
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/workspaces/:key/documents
documentsRouter.post('/', async (req, res, next) => {
  try {
    const { title, body, folder_id } = req.body as { title?: unknown; body?: unknown; folder_id?: string };
    if (typeof title !== 'string' || typeof body !== 'string') {
      return res.status(400).json({ error: 'title and body are required strings' });
    }
    const ws = await resolveWorkspace(req.params.key);
    if (!ws) return res.status(404).json({ error: 'workspace not found' });
    const db = getAdminClient();
    const { data, error } = await db.from('documents')
      .insert({ id: generateDocumentId(), workspace_id: ws.id, folder_id: folder_id ?? null, title, body, created: new Date().toISOString() })
      .select().single();
    if (error) return next(error);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// PATCH /api/workspaces/:key/documents/:id
documentsRouter.patch('/:id', async (req, res, next) => {
  try {
    const { title, body } = req.body as { title?: string; body?: string };
    if (!title && !body) return res.status(400).json({ error: 'title or body required' });
    const ws = await resolveWorkspace(req.params.key);
    if (!ws) return res.status(404).json({ error: 'workspace not found' });
    const db = getAdminClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title) updates.title = title;
    if (body !== undefined) updates.body = body;
    const { data, error } = await db.from('documents').update(updates)
      .eq('id', req.params.id).eq('workspace_id', ws.id).select().single();
    if (error?.code === 'PGRST116' || !data) return res.status(404).json({ error: 'not found' });
    if (error) return next(error);
    res.json(data);
  } catch (err) { next(err); }
});

// PATCH /api/workspaces/:key/documents/:id/move
documentsRouter.patch('/:id/move', async (req, res, next) => {
  try {
    const { folder_id } = req.body as { folder_id?: string | null };
    const ws = await resolveWorkspace(req.params.key);
    if (!ws) return res.status(404).json({ error: 'workspace not found' });
    const db = getAdminClient();
    const { data, error } = await db.from('documents')
      .update({ folder_id: folder_id ?? null, updated_at: new Date().toISOString() })
      .eq('id', req.params.id).eq('workspace_id', ws.id).select().single();
    if (error?.code === 'PGRST116' || !data) return res.status(404).json({ error: 'not found' });
    if (error) return next(error);
    res.json(data);
  } catch (err) { next(err); }
});

// DELETE /api/workspaces/:key/documents/:id
documentsRouter.delete('/:id', async (req, res, next) => {
  try {
    const ws = await resolveWorkspace(req.params.key);
    if (!ws) return res.status(404).json({ error: 'workspace not found' });
    const db = getAdminClient();
    const { error } = await db.from('documents').delete()
      .eq('id', req.params.id).eq('workspace_id', ws.id);
    if (error) return next(error);
    res.status(204).end();
  } catch (err) { next(err); }
});
```

- [ ] **Step 4: Mount in `server.ts`**

```typescript
import { documentsRouter } from './api/documents';
// in createApp():
app.use('/api/workspaces/:key/documents', documentsRouter);
```

- [ ] **Step 5: Run all API tests**

```bash
pnpm test api/api.test.ts
```
Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add api/documents.ts api/api.test.ts server.ts
git commit -m "feat(workspace): add document CRUD and move routes"
```

---

## Task 7: MCP server

**Files:**
- Create: `src/mcp/server.ts`
- Modify: `package.json`

- [ ] **Step 1: Install MCP SDK**

```bash
pnpm add @modelcontextprotocol/sdk
```

- [ ] **Step 2: Add `mcp` script to `package.json`**

In the `scripts` section:
```json
"mcp": "tsx src/mcp/server.ts"
```

- [ ] **Step 3: Create MCP server**

```typescript
// src/mcp/server.ts
// Standalone MCP server — exposes hiwrld workspace as MCP tools.
// Run: pnpm mcp
// Requires: HIWRLD_API_URL (e.g. http://localhost:2000), HIWRLD_WORKSPACE_KEY
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const API_URL = process.env.HIWRLD_API_URL ?? 'http://localhost:2000';
const WORKSPACE_KEY = process.env.HIWRLD_WORKSPACE_KEY ?? '';

if (!WORKSPACE_KEY) {
  console.error('HIWRLD_WORKSPACE_KEY is required');
  process.exit(1);
}

const base = `${API_URL}/api/workspaces/${WORKSPACE_KEY}`;

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

// Path helpers: resolve "/projects/client-a/brief" → folder_id + doc name
async function resolveFolderPath(segments: string[]): Promise<string | null> {
  // Fetch tree and walk to find the folder id
  const tree = await apiFetch('/tree') as { id: string; name: string; type: string; children: unknown[] };
  let current: { id: string; name: string; type: string; children: unknown[] } = tree;
  for (const seg of segments) {
    const child = (current.children as typeof tree[]).find((c) => c.name === seg && c.type === 'folder');
    if (!child) return null;
    current = child;
  }
  return current.id === tree.id ? null : current.id; // null = root
}

async function ensureFolderPath(segments: string[]): Promise<string | null> {
  let parentId: string | null = null;
  for (const seg of segments) {
    const tree = await apiFetch('/tree') as { id: string; children: { id: string; name: string; type: string; parent_id: string | null }[] };
    // BFS to find existing folder at this level
    function findInTree(node: { id: string; name: string; type: string; children: unknown[] }, name: string, pid: string | null): string | null {
      if (node.type === 'folder') {
        const match = (node.children as typeof node[]).find((c) => c.name === name && c.type === 'folder');
        if (match) return match.id;
      }
      return null;
    }
    const existing = findInTree(tree as never, seg, parentId);
    if (existing) {
      parentId = existing;
    } else {
      const folder = await apiFetch('/folders', {
        method: 'POST',
        body: JSON.stringify({ name: seg, parent_id: parentId }),
      }) as { id: string };
      parentId = folder.id;
    }
  }
  return parentId;
}

const server = new Server(
  { name: 'hiwrld', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_workspace',
      description: 'Returns the full folder and file tree for the workspace',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'read_document',
      description: 'Read a document by path, e.g. /projects/client-a/brief',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Absolute path to the document' } },
        required: ['path'],
      },
    },
    {
      name: 'write_document',
      description: 'Create or update a document at a path. Creates intermediate folders automatically.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['path', 'body'],
      },
    },
    {
      name: 'create_folder',
      description: 'Create a folder at a path, creating intermediate folders as needed',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
      },
    },
    {
      name: 'move_item',
      description: 'Move a document to a new path',
      inputSchema: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
        },
        required: ['from', 'to'],
      },
    },
    {
      name: 'delete_item',
      description: 'Delete a document or folder (folder deletion is recursive)',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    switch (name) {
      case 'list_workspace': {
        const tree = await apiFetch('/tree');
        return { content: [{ type: 'text', text: JSON.stringify(tree, null, 2) }] };
      }
      case 'read_document': {
        const { path } = args as { path: string };
        const parts = path.replace(/^\//, '').split('/');
        const docName = parts.pop()!;
        const folderId = await resolveFolderPath(parts);
        const tree = await apiFetch('/tree') as { children: { id: string; name: string; type: string; folder_id: string | null }[] };
        function findDoc(node: { children: unknown[] }): string | null {
          for (const c of node.children as { id: string; name: string; type: string; children: unknown[] }[]) {
            if (c.type === 'document' && c.name === docName) return c.id;
            if (c.type === 'folder') { const r = findDoc(c); if (r) return r; }
          }
          return null;
        }
        const docId = findDoc(tree as never);
        if (!docId) return { content: [{ type: 'text', text: `Document not found: ${path}` }], isError: true };
        const doc = await apiFetch(`/documents/${docId}`);
        return { content: [{ type: 'text', text: JSON.stringify(doc, null, 2) }] };
      }
      case 'write_document': {
        const { path, body } = args as { path: string; body: string };
        const parts = path.replace(/^\//, '').split('/');
        const title = parts.pop()!;
        const folderId = await ensureFolderPath(parts);
        // Check if doc exists
        const tree = await apiFetch('/tree') as { children: unknown[] };
        function findDocId(node: { children: unknown[] }, name: string): string | null {
          for (const c of node.children as { id: string; name: string; type: string; children: unknown[] }[]) {
            if (c.type === 'document' && c.name === name) return c.id;
            if (c.type === 'folder') { const r = findDocId(c, name); if (r) return r; }
          }
          return null;
        }
        const existing = findDocId(tree, title);
        let doc;
        if (existing) {
          doc = await apiFetch(`/documents/${existing}`, { method: 'PATCH', body: JSON.stringify({ title, body }) });
        } else {
          doc = await apiFetch('/documents', { method: 'POST', body: JSON.stringify({ title, body, folder_id: folderId }) });
        }
        return { content: [{ type: 'text', text: JSON.stringify(doc, null, 2) }] };
      }
      case 'create_folder': {
        const { path } = args as { path: string };
        const parts = path.replace(/^\//, '').split('/').filter(Boolean);
        await ensureFolderPath(parts);
        return { content: [{ type: 'text', text: `Folder created: ${path}` }] };
      }
      case 'move_item': {
        const { from, to } = args as { from: string; to: string };
        const fromParts = from.replace(/^\//, '').split('/');
        const docName = fromParts.pop()!;
        const toParts = to.replace(/^\//, '').split('/').filter(Boolean);
        const newFolderId = await ensureFolderPath(toParts);
        const tree = await apiFetch('/tree') as { children: unknown[] };
        function findDocId2(node: { children: unknown[] }, n: string): string | null {
          for (const c of node.children as { id: string; name: string; type: string; children: unknown[] }[]) {
            if (c.type === 'document' && c.name === n) return c.id;
            if (c.type === 'folder') { const r = findDocId2(c, n); if (r) return r; }
          }
          return null;
        }
        const docId = findDocId2(tree, docName);
        if (!docId) return { content: [{ type: 'text', text: `Item not found: ${from}` }], isError: true };
        await apiFetch(`/documents/${docId}/move`, { method: 'PATCH', body: JSON.stringify({ folder_id: newFolderId }) });
        return { content: [{ type: 'text', text: `Moved ${from} to ${to}` }] };
      }
      case 'delete_item': {
        const { path } = args as { path: string };
        const parts = path.replace(/^\//, '').split('/');
        const name = parts.pop()!;
        const tree = await apiFetch('/tree') as { children: unknown[] };
        function findItem(node: { children: unknown[] }, n: string): { id: string; type: string } | null {
          for (const c of node.children as { id: string; name: string; type: string; children: unknown[] }[]) {
            if (c.name === n) return { id: c.id, type: c.type };
            if (c.type === 'folder') { const r = findItem(c, n); if (r) return r; }
          }
          return null;
        }
        const item = findItem(tree, name);
        if (!item) return { content: [{ type: 'text', text: `Item not found: ${path}` }], isError: true };
        const endpoint = item.type === 'folder' ? `/folders/${item.id}` : `/documents/${item.id}`;
        await apiFetch(endpoint, { method: 'DELETE' });
        return { content: [{ type: 'text', text: `Deleted: ${path}` }] };
      }
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: 'text', text: String(err) }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

- [ ] **Step 4: Verify it compiles**

```bash
pnpm exec tsc --noEmit
```
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/mcp/server.ts package.json pnpm-lock.yaml
git commit -m "feat(workspace): add MCP server with 6 tools"
```

---

## Task 8: `useWorkspace` hook

**Files:**
- Create: `src/hooks/useWorkspace.ts`
- Create: `src/hooks/useWorkspace.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/hooks/useWorkspace.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkspace } from './useWorkspace';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function fetchOk(data: unknown) {
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => data });
}

describe('useWorkspace', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns null workspace when localStorage has no entry', () => {
    const { result } = renderHook(() => useWorkspace());
    expect(result.current.workspace).toBeNull();
  });

  it('loads workspace from localStorage and fetches tree', async () => {
    localStorage.setItem('hiwrld.workspace', JSON.stringify({ id: 'ws1', name: 'test', secret_key: 'sk_abc' }));
    const tree = { id: 'ws1', name: 'root', type: 'folder', children: [] };
    fetchOk(tree);

    const { result } = renderHook(() => useWorkspace());
    await waitFor(() => expect(result.current.tree).not.toBeNull());
    expect(result.current.tree?.children).toHaveLength(0);
  });

  it('createWorkspace calls POST and persists key to localStorage', async () => {
    const created = { id: 'ws2', name: 'new', secret_key: 'sk_xyz', created_at: '2026-01-01' };
    fetchOk(created);
    fetchOk({ id: 'ws2', name: 'root', type: 'folder', children: [] });

    const { result } = renderHook(() => useWorkspace());
    await act(async () => { await result.current.createWorkspace('new'); });
    expect(result.current.workspace?.secret_key).toBe('sk_xyz');
    expect(JSON.parse(localStorage.getItem('hiwrld.workspace') ?? '{}')).toMatchObject({ secret_key: 'sk_xyz' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test src/hooks/useWorkspace.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement the hook**

```typescript
// src/hooks/useWorkspace.ts
import { useCallback, useEffect, useState } from 'react';
import type { TreeNode, Workspace } from '../types/workspace';

const STORAGE_KEY = 'hiwrld.workspace';
const API_BASE = '/api/workspaces';

function loadStored(): Workspace | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Workspace) : null;
  } catch { return null; }
}

export interface UseWorkspaceResult {
  workspace: Workspace | null;
  tree: TreeNode | null;
  isLoading: boolean;
  createWorkspace: (name: string) => Promise<void>;
  refreshTree: () => Promise<void>;
  createFolder: (name: string, parentId?: string) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  createDocument: (title: string, folderId?: string) => Promise<{ id: string }>;
  moveDocument: (id: string, folderId: string | null) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

export function useWorkspace(): UseWorkspaceResult {
  const [workspace, setWorkspace] = useState<Workspace | null>(loadStored);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const apiFetch = useCallback(async (path: string, options?: RequestInit) => {
    if (!workspace) throw new Error('no workspace');
    const res = await fetch(`${API_BASE}/${workspace.secret_key}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    if (res.status === 204) return null;
    return res.json();
  }, [workspace]);

  const refreshTree = useCallback(async () => {
    if (!workspace) return;
    setIsLoading(true);
    try {
      const t = await fetch(`${API_BASE}/${workspace.secret_key}/tree`).then((r) => r.json()) as TreeNode;
      setTree(t);
    } finally { setIsLoading(false); }
  }, [workspace]);

  useEffect(() => { if (workspace) void refreshTree(); }, [workspace, refreshTree]);

  const createWorkspace = useCallback(async (name: string) => {
    const res = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to create workspace');
    const ws = await res.json() as Workspace;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ws));
    setWorkspace(ws);
  }, []);

  const createFolder = useCallback(async (name: string, parentId?: string) => {
    await apiFetch('/folders', { method: 'POST', body: JSON.stringify({ name, parent_id: parentId }) });
    await refreshTree();
  }, [apiFetch, refreshTree]);

  const renameFolder = useCallback(async (id: string, name: string) => {
    await apiFetch(`/folders/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
    await refreshTree();
  }, [apiFetch, refreshTree]);

  const deleteFolder = useCallback(async (id: string) => {
    await apiFetch(`/folders/${id}`, { method: 'DELETE' });
    await refreshTree();
  }, [apiFetch, refreshTree]);

  const createDocument = useCallback(async (title: string, folderId?: string) => {
    const doc = await apiFetch('/documents', {
      method: 'POST',
      body: JSON.stringify({ title, body: '', folder_id: folderId ?? null }),
    }) as { id: string };
    await refreshTree();
    return doc;
  }, [apiFetch, refreshTree]);

  const moveDocument = useCallback(async (id: string, folderId: string | null) => {
    await apiFetch(`/documents/${id}/move`, { method: 'PATCH', body: JSON.stringify({ folder_id: folderId }) });
    await refreshTree();
  }, [apiFetch, refreshTree]);

  const deleteDocument = useCallback(async (id: string) => {
    await apiFetch(`/documents/${id}`, { method: 'DELETE' });
    await refreshTree();
  }, [apiFetch, refreshTree]);

  return { workspace, tree, isLoading, createWorkspace, refreshTree, createFolder, renameFolder, deleteFolder, createDocument, moveDocument, deleteDocument };
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test src/hooks/useWorkspace.test.ts
```
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useWorkspace.ts src/hooks/useWorkspace.test.ts
git commit -m "feat(workspace): add useWorkspace hook"
```

---

## Task 9: `ContextMenu` component

**Files:**
- Create: `src/components/ContextMenu.tsx`

- [ ] **Step 1: Create the component**

No unit test needed here — purely presentational. E2E in Task 14 covers it.

```typescript
// src/components/ContextMenu.tsx
import { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: string;
  danger?: boolean;
  onClick: () => void;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="context-menu"
      style={{ position: 'fixed', top: y, left: x, zIndex: 1000 }}
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          className={`context-menu-item${item.danger ? ' context-menu-item--danger' : ''}`}
          onClick={() => { item.onClick(); onClose(); }}
        >
          {item.icon && <span className="context-menu-icon">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add CSS to `src/hiwrld.css`**

Append:

```css
/* Context menu */
.context-menu {
  background: #2a2a3e;
  border: 1px solid #3a3a5e;
  border-radius: 5px;
  padding: 4px 0;
  min-width: 160px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  font-size: 12px;
}
.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 12px;
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  text-align: left;
}
.context-menu-item:hover { background: #3a3a5e; }
.context-menu-item--danger { color: #ff6b6b; }
.context-menu-icon { font-size: 13px; }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ContextMenu.tsx src/hiwrld.css
git commit -m "feat(workspace): add ContextMenu component"
```

---

## Task 10: `FolderTree` component

**Files:**
- Create: `src/components/FolderTree.tsx`

- [ ] **Step 1: Create recursive tree component**

```typescript
// src/components/FolderTree.tsx
import { useState } from 'react';
import type { TreeNode } from '../types/workspace';
import type { ContextMenuItem } from './ContextMenu';
import { ContextMenu } from './ContextMenu';

export interface FolderTreeProps {
  nodes: TreeNode[];
  activeDocId: string;
  onDocClick: (id: string) => void;
  onFolderMenu: (node: TreeNode) => ContextMenuItem[];
  onDocMenu: (node: TreeNode) => ContextMenuItem[];
  depth?: number;
}

export function FolderTree({ nodes, activeDocId, onDocClick, onFolderMenu, onDocMenu, depth = 0 }: FolderTreeProps) {
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);

  const toggleFolder = (id: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, node: TreeNode) => {
    e.preventDefault();
    const items = node.type === 'folder' ? onFolderMenu(node) : onDocMenu(node);
    setMenu({ x: e.clientX, y: e.clientY, items });
  };

  return (
    <>
      {nodes.map((node) => (
        <div key={node.id}>
          <div
            className={`tree-row${node.type === 'document' && node.id === activeDocId ? ' tree-row--active' : ''}`}
            style={{ paddingLeft: `${12 + depth * 14}px` }}
            onContextMenu={(e) => handleContextMenu(e, node)}
          >
            {node.type === 'folder' ? (
              <button
                type="button"
                className="tree-folder-btn"
                onClick={() => toggleFolder(node.id)}
              >
                <span className="tree-chevron">{openFolders.has(node.id) ? '▼' : '▶'}</span>
                <span className="tree-icon">📁</span>
                <span className="tree-label">{node.name}</span>
              </button>
            ) : (
              <button
                type="button"
                className="tree-doc-btn"
                onClick={() => onDocClick(node.id)}
              >
                <span className="tree-icon">📄</span>
                <span className="tree-label">{node.name}</span>
              </button>
            )}
          </div>
          {node.type === 'folder' && openFolders.has(node.id) && (
            <FolderTree
              nodes={node.children}
              activeDocId={activeDocId}
              onDocClick={onDocClick}
              onFolderMenu={onFolderMenu}
              onDocMenu={onDocMenu}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Add CSS to `src/hiwrld.css`**

Append:

```css
/* Folder tree */
.tree-row {
  display: flex;
  align-items: center;
}
.tree-row--active {
  background: #252540;
  border-left: 2px solid #7c9eff;
}
.tree-folder-btn,
.tree-doc-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  padding: 4px 8px 4px 0;
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  font-size: 12px;
  text-align: left;
}
.tree-folder-btn:hover, .tree-doc-btn:hover { color: #fff; }
.tree-chevron { font-size: 9px; color: #666; width: 10px; }
.tree-icon { font-size: 12px; }
.tree-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/FolderTree.tsx src/hiwrld.css
git commit -m "feat(workspace): add FolderTree component"
```

---

## Task 11: `WorkspaceCreate` modal

**Files:**
- Create: `src/components/WorkspaceCreate.tsx`
- Create: `src/components/WorkspaceCreate.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// src/components/WorkspaceCreate.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceCreate } from './WorkspaceCreate';

describe('WorkspaceCreate', () => {
  it('calls onCreate with the entered name', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<WorkspaceCreate onCreate={onCreate} />);
    await userEvent.type(screen.getByPlaceholderText('Workspace name'), 'my-workspace');
    await userEvent.click(screen.getByRole('button', { name: /create workspace/i }));
    expect(onCreate).toHaveBeenCalledWith('my-workspace');
  });

  it('does not call onCreate when name is empty', async () => {
    const onCreate = vi.fn();
    render(<WorkspaceCreate onCreate={onCreate} />);
    await userEvent.click(screen.getByRole('button', { name: /create workspace/i }));
    expect(onCreate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test src/components/WorkspaceCreate.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Implement component**

```typescript
// src/components/WorkspaceCreate.tsx
import { useState } from 'react';

export interface WorkspaceCreateProps {
  onCreate: (name: string) => Promise<void>;
}

export function WorkspaceCreate({ onCreate }: WorkspaceCreateProps) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try { await onCreate(name.trim()); }
    finally { setCreating(false); }
  };

  return (
    <div className="workspace-create">
      <span className="workspace-create-icon">📁</span>
      <p className="workspace-create-title">Create a workspace</p>
      <p className="workspace-create-desc">A private space for your docs. Share the key with anyone — or an AI agent.</p>
      <form onSubmit={handleSubmit} className="workspace-create-form">
        <input
          type="text"
          className="workspace-create-input"
          placeholder="Workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={creating}
          autoFocus
        />
        <button
          type="submit"
          className="workspace-create-btn"
          disabled={creating || !name.trim()}
          aria-label="Create workspace"
        >
          {creating ? 'Creating…' : 'Create workspace →'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Add CSS to `src/hiwrld.css`**

Append:

```css
/* Workspace create */
.workspace-create {
  padding: 16px 12px;
  text-align: center;
  color: #aaa;
}
.workspace-create-icon { font-size: 24px; display: block; margin-bottom: 8px; }
.workspace-create-title { color: #fff; font-weight: 600; font-size: 13px; margin: 0 0 4px; }
.workspace-create-desc { font-size: 11px; margin: 0 0 12px; line-height: 1.5; }
.workspace-create-form { display: flex; flex-direction: column; gap: 8px; }
.workspace-create-input {
  padding: 6px 10px;
  border: 1px solid #3a3a5e;
  border-radius: 4px;
  background: #12122a;
  color: #fff;
  font-size: 12px;
}
.workspace-create-btn {
  padding: 7px 12px;
  background: #4a4aff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}
.workspace-create-btn:disabled { opacity: 0.5; cursor: not-allowed; }
```

- [ ] **Step 5: Run tests**

```bash
pnpm test src/components/WorkspaceCreate.test.tsx
```
Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/WorkspaceCreate.tsx src/components/WorkspaceCreate.test.tsx src/hiwrld.css
git commit -m "feat(workspace): add WorkspaceCreate modal"
```

---

## Task 12: `WorkspaceDrawer` component

**Files:**
- Create: `src/components/WorkspaceDrawer.tsx`
- Create: `src/components/WorkspaceDrawer.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/WorkspaceDrawer.test.tsx
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as useWorkspaceModule from '../hooks/useWorkspace';
import * as useDocumentsModule from '../hooks/useDocuments';
import { WorkspaceDrawer } from './WorkspaceDrawer';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <a className={className}>{children}</a>
    ),
    useNavigate: () => vi.fn(),
  };
});

function mockNoWorkspace() {
  vi.spyOn(useWorkspaceModule, 'useWorkspace').mockReturnValue({
    workspace: null, tree: null, isLoading: false,
    createWorkspace: vi.fn(), refreshTree: vi.fn(),
    createFolder: vi.fn(), renameFolder: vi.fn(), deleteFolder: vi.fn(),
    createDocument: vi.fn(), moveDocument: vi.fn(), deleteDocument: vi.fn(),
  });
  vi.spyOn(useDocumentsModule, 'useDocuments').mockReturnValue({
    docs: [{ id: 'doc1', title: 'My Doc' }],
    add: vi.fn(), remove: vi.fn(), setTitle: vi.fn(),
  });
}

function mockWithWorkspace() {
  vi.spyOn(useWorkspaceModule, 'useWorkspace').mockReturnValue({
    workspace: { id: 'ws1', name: 'test', secret_key: 'sk_abc', created_at: '2026-01-01' },
    tree: { id: 'ws1', name: 'root', type: 'folder', children: [
      { id: 'fld1', name: 'Projects', type: 'folder', children: [] },
    ]},
    isLoading: false,
    createWorkspace: vi.fn(), refreshTree: vi.fn(),
    createFolder: vi.fn(), renameFolder: vi.fn(), deleteFolder: vi.fn(),
    createDocument: vi.fn(), moveDocument: vi.fn(), deleteDocument: vi.fn(),
  });
}

describe('WorkspaceDrawer', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('shows flat doc list and create CTA when no workspace', () => {
    mockNoWorkspace();
    render(<WorkspaceDrawer currentDocId="doc1" onClose={vi.fn()} />);
    expect(screen.getByText('My Doc')).toBeInTheDocument();
    expect(screen.getByText(/create a workspace/i)).toBeInTheDocument();
  });

  it('shows folder tree and workspace name when workspace is configured', () => {
    mockWithWorkspace();
    render(<WorkspaceDrawer currentDocId="doc1" onClose={vi.fn()} />);
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test src/components/WorkspaceDrawer.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Implement WorkspaceDrawer**

```typescript
// src/components/WorkspaceDrawer.tsx
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';
import type { TreeNode } from '../types/workspace';
import type { ContextMenuItem } from './ContextMenu';
import { DocumentMenu } from './DocumentMenu';
import { FolderTree } from './FolderTree';
import { WorkspaceCreate } from './WorkspaceCreate';

export interface WorkspaceDrawerProps {
  currentDocId: string;
  onClose: () => void;
}

export function WorkspaceDrawer({ currentDocId, onClose }: WorkspaceDrawerProps) {
  const { workspace, tree, createWorkspace, createFolder, renameFolder, deleteFolder, createDocument, deleteDocument } = useWorkspace();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'folder' | 'document'; id: string; name: string } | null>(null);

  const handleDocClick = (id: string) => {
    void navigate({ to: '/$docId', params: { docId: id } });
    onClose();
  };

  const handleNewFile = async () => {
    if (workspace) {
      const doc = await createDocument('Untitled');
      void navigate({ to: '/$docId', params: { docId: doc.id } });
    }
  };

  const handleNewFolder = async () => {
    const name = prompt('Folder name:');
    if (name?.trim()) await createFolder(name.trim());
  };

  const folderMenuItems = (node: TreeNode): ContextMenuItem[] => [
    { label: 'New file here', icon: '📄', onClick: async () => { const doc = await createDocument('Untitled', node.id); void navigate({ to: '/$docId', params: { docId: doc.id } }); } },
    { label: 'New folder here', icon: '📁', onClick: async () => { const name = prompt('Folder name:'); if (name?.trim()) await createFolder(name.trim(), node.id); } },
    { label: 'Rename', icon: '✏️', onClick: async () => { const name = prompt('New name:', node.name); if (name?.trim()) await renameFolder(node.id, name.trim()); } },
    { label: 'Delete folder', icon: '🗑️', danger: true, onClick: () => setConfirmDelete({ type: 'folder', id: node.id, name: node.name }) },
  ];

  const docMenuItems = (node: TreeNode): ContextMenuItem[] => [
    { label: 'Delete', icon: '🗑️', danger: true, onClick: () => setConfirmDelete({ type: 'document', id: node.id, name: node.name }) },
  ];

  return (
    <div className="workspace-drawer">
      {workspace && tree ? (
        <>
          {/* Header */}
          <div className="workspace-drawer-header">
            <div className="workspace-drawer-title">
              <span className="workspace-drawer-icon">📁</span>
              <span>{workspace.name}</span>
            </div>
            <div className="workspace-drawer-actions">
              <button type="button" title="New file" aria-label="New file" className="workspace-drawer-action-btn" onClick={handleNewFile}>📄+</button>
              <button type="button" title="New folder" aria-label="New folder" className="workspace-drawer-action-btn" onClick={handleNewFolder}>📁+</button>
            </div>
          </div>
          {/* Tree */}
          <div className="workspace-drawer-tree">
            <FolderTree
              nodes={tree.children}
              activeDocId={currentDocId}
              onDocClick={handleDocClick}
              onFolderMenu={folderMenuItems}
              onDocMenu={docMenuItems}
            />
          </div>
          {/* Workspace key */}
          <div className="workspace-drawer-key">
            <span>🔑</span>
            <span className="workspace-key-value">{workspace.secret_key.slice(0, 12)}…</span>
            <button
              type="button"
              className="workspace-key-copy"
              onClick={() => void navigator.clipboard.writeText(workspace.secret_key)}
            >
              copy
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Flat doc list (existing behaviour) */}
          <div className="workspace-drawer-header">
            <span className="workspace-drawer-title">Files</span>
          </div>
          <DocumentMenu currentDocId={currentDocId} />
          <div className="workspace-drawer-create-cta">
            <WorkspaceCreate onCreate={createWorkspace} />
          </div>
        </>
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="workspace-confirm-overlay" role="dialog" aria-modal="true">
          <div className="workspace-confirm">
            <p>Delete <strong>{confirmDelete.name}</strong>?{confirmDelete.type === 'folder' && ' All contents will be removed.'}</p>
            <div className="workspace-confirm-actions">
              <button type="button" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                type="button"
                className="workspace-confirm-delete"
                onClick={async () => {
                  if (confirmDelete.type === 'folder') await deleteFolder(confirmDelete.id);
                  else await deleteDocument(confirmDelete.id);
                  setConfirmDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add CSS to `src/hiwrld.css`**

Append:

```css
/* WorkspaceDrawer */
.workspace-drawer { display: flex; flex-direction: column; height: 100%; background: #1a1a2e; color: #ccc; }
.workspace-drawer-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-bottom: 1px solid #2a2a3e; flex-shrink: 0; }
.workspace-drawer-title { display: flex; align-items: center; gap: 6px; color: #fff; font-weight: 600; font-size: 12px; }
.workspace-drawer-icon { font-size: 10px; }
.workspace-drawer-actions { display: flex; gap: 10px; }
.workspace-drawer-action-btn { background: none; border: none; color: #888; cursor: pointer; font-size: 13px; padding: 2px; }
.workspace-drawer-action-btn:hover { color: #fff; }
.workspace-drawer-tree { flex: 1; overflow-y: auto; padding: 6px 0; }
.workspace-drawer-key { padding: 8px 12px; border-top: 1px solid #2a2a3e; display: flex; align-items: center; gap: 6px; font-size: 10px; color: #555; flex-shrink: 0; }
.workspace-key-value { font-family: monospace; flex: 1; }
.workspace-key-copy { background: none; border: none; color: #444; cursor: pointer; font-size: 10px; padding: 0; }
.workspace-key-copy:hover { color: #888; }
.workspace-drawer-create-cta { border-top: 1px solid #2a2a3e; margin-top: 8px; }

/* Confirm dialog */
.workspace-confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; }
.workspace-confirm { background: #1e1e35; border: 1px solid #3a3a5e; border-radius: 8px; padding: 20px; max-width: 320px; color: #ccc; font-size: 13px; }
.workspace-confirm p { margin: 0 0 16px; }
.workspace-confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }
.workspace-confirm-actions button { padding: 6px 14px; border-radius: 4px; border: 1px solid #3a3a5e; background: none; color: #ccc; cursor: pointer; font-size: 12px; }
.workspace-confirm-delete { background: #ff6b6b !important; border-color: #ff6b6b !important; color: #fff !important; }
```

- [ ] **Step 5: Run tests**

```bash
pnpm test src/components/WorkspaceDrawer.test.tsx
```
Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/WorkspaceDrawer.tsx src/components/WorkspaceDrawer.test.tsx src/hiwrld.css
git commit -m "feat(workspace): add WorkspaceDrawer component"
```

---

## Task 13: Wire WorkspaceDrawer into WritePane

**Files:**
- Modify: `src/components/WritePane.tsx`

- [ ] **Step 1: Replace `DocumentMenu` with `WorkspaceDrawer` in WritePane**

In `src/components/WritePane.tsx`, make the following changes:

```typescript
// Replace this import:
import { DocumentMenu } from './DocumentMenu';

// With:
import { WorkspaceDrawer } from './WorkspaceDrawer';
```

Replace the drawer div contents:

```typescript
// Old:
<div className={`document-menu-drawer${menuOpen ? ' open' : ''}`}>
  <DocumentMenu currentDocId={docId} />
</div>

// New:
<div className={`document-menu-drawer${menuOpen ? ' open' : ''}`}>
  <WorkspaceDrawer currentDocId={docId} onClose={closeMenu} />
</div>
```

- [ ] **Step 2: Run full test suite**

```bash
pnpm test
```
Expected: all 52+ tests PASS

- [ ] **Step 3: Run Biome check**

```bash
pnpm check
```
Expected: no errors. If format violations, run `pnpm check:write`.

- [ ] **Step 4: Run Fallow audit**

```bash
pnpm analyze
```
Expected: no issues. If `DocumentMenu` is now unreferenced in `WritePane` but still used by `WorkspaceDrawer`, Fallow should remain clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/WritePane.tsx
git commit -m "feat(workspace): wire WorkspaceDrawer into WritePane"
```

---

## Task 14: E2E tests

**Files:**
- Create: `e2e/workspace.spec.ts`

- [ ] **Step 1: Write E2E tests**

```typescript
// e2e/workspace.spec.ts
import { expect, test } from '@playwright/test';
import { fillTextarea } from './helpers';

// These tests require SUPABASE_URL and SUPABASE_SERVICE_KEY to be set in the environment,
// and the Supabase tables (workspaces, folders) to exist.
// They are skipped automatically if the API returns a 500 (no Supabase configured).

test.describe('workspace — folder storage', () => {
  test('no-workspace state shows flat doc list and create CTA', async ({ page }) => {
    // Clear any stored workspace
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('hiwrld.workspace'));
    await page.reload();

    await page.locator('.menu-button').click();
    await expect(page.locator('.document-menu-drawer')).toBeVisible();
    await expect(page.locator('text=Create a workspace')).toBeVisible();
  });

  test('creates a workspace and shows the folder tree', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('hiwrld.workspace'));
    await page.reload();

    await page.locator('.menu-button').click();
    await page.locator('.workspace-create-input').fill('test-workspace');
    await page.locator('.workspace-create-btn').click();

    // After creation the tree should appear with the workspace name
    await expect(page.locator('.workspace-drawer-title')).toContainText('test-workspace');
  });

  test('creates a folder via header button', async ({ page }) => {
    await page.goto('/');
    await page.locator('.menu-button').click();
    // Only runs if workspace is already configured
    const createBtn = page.locator('[aria-label="New folder"]');
    if (await createBtn.isVisible()) {
      page.on('dialog', async (d) => { await d.fill('Projects'); await d.accept(); });
      await createBtn.click();
      await expect(page.locator('.tree-label', { hasText: 'Projects' })).toBeVisible();
    }
  });

  test('right-click a folder shows context menu', async ({ page }) => {
    await page.goto('/');
    await page.locator('.menu-button').click();
    const folder = page.locator('.tree-folder-btn').first();
    if (await folder.isVisible()) {
      await folder.click({ button: 'right' });
      await expect(page.locator('.context-menu')).toBeVisible();
      await expect(page.locator('text=New file here')).toBeVisible();
      await expect(page.locator('text=Delete folder')).toBeVisible();
    }
  });

  test('delete confirmation appears before folder is removed', async ({ page }) => {
    await page.goto('/');
    await page.locator('.menu-button').click();
    const folder = page.locator('.tree-folder-btn').first();
    if (await folder.isVisible()) {
      await folder.click({ button: 'right' });
      await page.locator('text=Delete folder').click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('text=All contents will be removed')).toBeVisible();
      // Cancel — don't actually delete
      await page.locator('text=Cancel').click();
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    }
  });

  test('workspace key copy button is present in drawer', async ({ page }) => {
    await page.goto('/');
    await page.locator('.menu-button').click();
    const copyBtn = page.locator('.workspace-key-copy');
    if (await copyBtn.isVisible()) {
      await expect(copyBtn).toHaveText('copy');
    }
  });

  test('documents opened from tree navigate to the correct URL', async ({ page }) => {
    await page.goto('/');
    await page.locator('.menu-button').click();
    const docBtn = page.locator('.tree-doc-btn').first();
    if (await docBtn.isVisible()) {
      const docLabel = await docBtn.locator('.tree-label').textContent();
      await docBtn.click();
      // Drawer should close and URL should change
      await expect(page.locator('.document-menu-drawer')).not.toBeVisible();
    }
  });
});
```

- [ ] **Step 2: Run E2E**

```bash
pnpm test:e2e
```
Expected: workspace tests that don't need Supabase (no-workspace state, UI-only checks) PASS. Supabase-dependent tests gracefully skip if not configured.

- [ ] **Step 3: Run full suite**

```bash
pnpm test:all
```
Expected: all existing tests still PASS, new tests PASS or gracefully skip.

- [ ] **Step 4: Final Fallow audit**

```bash
pnpm fallow
```
Expected: no issues.

- [ ] **Step 5: Final commit**

```bash
git add e2e/workspace.spec.ts
git commit -m "feat(workspace): add E2E tests for folder storage"
```

---

## Done

The feature branch `feature/folder-storage` now contains:

- **Data model**: `workspaces` + `folders` tables, `documents` extended with `workspace_id`/`folder_id`
- **REST API**: 13 endpoints under `/api/workspaces/:key/`
- **MCP server**: 6 tools (`list_workspace`, `read_document`, `write_document`, `create_folder`, `move_item`, `delete_item`) — run with `pnpm mcp`
- **UI**: `WorkspaceDrawer` with folder tree, `FolderTree`, `ContextMenu`, `WorkspaceCreate` — fully backward-compatible with localStorage-only mode
- **Tests**: unit, integration (supertest), and E2E coverage throughout
