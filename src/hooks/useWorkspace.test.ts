import { act, renderHook, waitFor } from '@testing-library/react';
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
    localStorage.setItem(
      'hiwrld.workspace',
      JSON.stringify({ id: 'ws1', name: 'test', secret_key: 'sk_abc' })
    );
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
    await act(async () => {
      await result.current.createWorkspace('new');
    });
    expect(result.current.workspace?.secret_key).toBe('sk_xyz');
    expect(JSON.parse(localStorage.getItem('hiwrld.workspace') ?? '{}')).toMatchObject({
      secret_key: 'sk_xyz',
    });
  });
});
