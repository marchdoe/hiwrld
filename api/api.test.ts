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
    const ws = { id: 'ws1', name: 'test', secret_key: 'sk_abc', created_at: '2026-01-01' };
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
  beforeEach(() => vi.clearAllMocks());

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
  beforeEach(() => vi.clearAllMocks());

  it('deletes folder and returns 204', async () => {
    const ws = { id: 'ws1', secret_key: 'sk_abc' };
    vi.mocked(getAdminClient).mockReturnValue({
      from: vi.fn((table: string) => table === 'workspaces'
        ? { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: ws, error: null }) }
        : {
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
      ),
    } as never);

    const res = await request(app).delete('/api/workspaces/sk_abc/folders/fld1');
    expect(res.status).toBe(204);
  });
});
