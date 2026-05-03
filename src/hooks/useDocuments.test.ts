import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useDocuments } from './useDocuments';

describe('useDocuments', () => {
  beforeEach(() => localStorage.clear());

  it('starts with an empty list when localStorage has no bookmarks', () => {
    const { result } = renderHook(() => useDocuments());
    expect(result.current.docs).toEqual([]);
  });

  it('hydrates from hiwrld.bookmarks in localStorage', () => {
    localStorage.setItem(
      'hiwrld.bookmarks',
      JSON.stringify([
        { id: 'aaa1111', title: 'First' },
        { id: 'bbb2222', title: 'Second' },
      ])
    );
    const { result } = renderHook(() => useDocuments());
    expect(result.current.docs).toHaveLength(2);
    expect(result.current.docs[0]).toEqual({ id: 'aaa1111', title: 'First' });
  });

  it('add() appends a doc with empty title', () => {
    const { result } = renderHook(() => useDocuments());
    act(() => result.current.add('newid1'));
    expect(result.current.docs).toEqual([{ id: 'newid1', title: '' }]);
    expect(JSON.parse(localStorage.getItem('hiwrld.bookmarks') ?? 'null')).toEqual([
      { id: 'newid1', title: '' },
    ]);
  });

  it('remove() filters out the doc by id', () => {
    localStorage.setItem(
      'hiwrld.bookmarks',
      JSON.stringify([
        { id: 'aaa', title: 'A' },
        { id: 'bbb', title: 'B' },
      ])
    );
    const { result } = renderHook(() => useDocuments());
    act(() => result.current.remove('aaa'));
    expect(result.current.docs).toEqual([{ id: 'bbb', title: 'B' }]);
  });

  it('setTitle() updates the title for a doc id', () => {
    localStorage.setItem('hiwrld.bookmarks', JSON.stringify([{ id: 'aaa', title: '' }]));
    const { result } = renderHook(() => useDocuments());
    act(() => result.current.setTitle('aaa', 'My Doc'));
    expect(result.current.docs[0]?.title).toBe('My Doc');
  });
});

const KEY = 'hiwrld.bookmarks';

describe('useDocuments — multi-instance isolation', () => {
  afterEach(() => localStorage.clear());

  it('remove() on one instance is not overwritten by setTitle() on another', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B' },
      ])
    );

    const { result: r1 } = renderHook(() => useDocuments());
    const { result: r2 } = renderHook(() => useDocuments());

    act(() => {
      r1.current.remove('a');
    });
    act(() => {
      r2.current.setTitle('b', 'Updated B');
    });

    const stored = JSON.parse(localStorage.getItem(KEY) ?? '[]') as Array<{
      id: string;
      title: string;
    }>;
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual({ id: 'b', title: 'Updated B' });
  });

  it('add() on one instance is visible to setTitle() on another', () => {
    localStorage.setItem(KEY, JSON.stringify([{ id: 'a', title: 'A' }]));

    const { result: r1 } = renderHook(() => useDocuments());
    const { result: r2 } = renderHook(() => useDocuments());

    act(() => {
      r1.current.add('b');
    });
    act(() => {
      r2.current.setTitle('a', 'Updated A');
    });

    const stored = JSON.parse(localStorage.getItem(KEY) ?? '[]') as Array<{
      id: string;
      title: string;
    }>;
    expect(stored).toHaveLength(2);
    expect(stored.find((d) => d.id === 'a')?.title).toBe('Updated A');
    expect(stored.find((d) => d.id === 'b')).toBeDefined();
  });
});
