import { beforeEach, describe, expect, it, vi } from 'vitest';
import { localSync } from './localSync';

describe('localSync', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('publish writes to localStorage with hiwrld:sync: prefix', () => {
    localSync.publish('documents/abc', { body: 'hello' });
    expect(localStorage.getItem('hiwrld:sync:documents/abc')).toBe(
      JSON.stringify({ body: 'hello' })
    );
  });

  it('subscribe replays last value to new subscriber', () => {
    localStorage.setItem('hiwrld:sync:documents/xyz', JSON.stringify({ body: 'cached' }));
    const cb = vi.fn();
    const unsub = localSync.subscribe('documents/xyz', cb);
    expect(cb).toHaveBeenCalledWith({ body: 'cached' });
    unsub();
  });

  it('subscribe ignores corrupt JSON in localStorage', () => {
    localStorage.setItem('hiwrld:sync:documents/bad', '{not-json');
    const cb = vi.fn();
    const unsub = localSync.subscribe('documents/bad', cb);
    expect(cb).not.toHaveBeenCalled();
    unsub();
  });
});
