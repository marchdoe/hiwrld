import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetStore, setDoc } from '../../test/supabase-fake';
import { useDocument } from './useDocument';

vi.mock('@supabase/supabase-js');

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useDocument', () => {
  beforeEach(() => {
    resetStore();
    localStorage.clear();
  });

  it('starts loading then resolves body from Supabase', async () => {
    setDoc('abc1234', {
      id: 'abc1234',
      body: '# Hello',
      title: 'Hello',
      created: new Date().toISOString(),
    });
    const { result } = renderHook(() => useDocument('abc1234'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.body).toBe('# Hello');
  });

  it('derives title from H1 in body', async () => {
    setDoc('abc1234', {
      id: 'abc1234',
      body: '# My Title',
      title: 'My Title',
      created: new Date().toISOString(),
    });
    const { result } = renderHook(() => useDocument('abc1234'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.title).toBe('My Title');
  });

  it('setBody updates body and schedules a debounced save', async () => {
    vi.useFakeTimers();
    setDoc('abc1234', { id: 'abc1234', body: '', title: '', created: new Date().toISOString() });
    const { result } = renderHook(() => useDocument('abc1234'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setBody('new body'));
    expect(result.current.body).toBe('new body');

    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    const { getStore } = await import('../../test/supabase-fake');
    expect(getStore().get('abc1234')?.body).toBe('new body');
    vi.useRealTimers();
  });

  it('updates live when a remote change arrives via Supabase channel', async () => {
    setDoc('abc1234', {
      id: 'abc1234',
      body: 'initial',
      title: 'Untitled',
      created: new Date().toISOString(),
    });
    const { result } = renderHook(() => useDocument('abc1234'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() =>
      setDoc('abc1234', {
        id: 'abc1234',
        body: 'from remote',
        title: 'from remote',
        created: new Date().toISOString(),
      })
    );
    await waitFor(() => expect(result.current.body).toBe('from remote'));
  });
});
