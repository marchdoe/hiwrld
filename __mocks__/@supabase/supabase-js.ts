import { vi } from 'vitest';

// In-memory store: docId → Document partial
const store = new Map<string, Record<string, unknown>>();
// Realtime listeners: channel key → callback set
const listeners = new Map<string, Set<(payload: unknown) => void>>();

export const createClient = vi.fn(() => ({
  from: vi.fn((_table: string) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn((_col: string, val: string) => ({
      single: vi.fn(() => Promise.resolve({ data: store.get(val) ?? null, error: null })),
    })),
    upsert: vi.fn((data: Record<string, unknown>) => {
      // biome-ignore lint/complexity/useLiteralKeys: data is Record<string,unknown>, dot access loses type
      const id = data['id'] as string;
      store.set(id, { ...(store.get(id) ?? {}), ...data });
      // Notify realtime listeners
      const key = `document:${id}`;
      for (const cb of listeners.get(key) ?? []) cb({ new: store.get(id) });
      return Promise.resolve({ error: null });
    }),
  })),
  channel: vi.fn((key: string) => {
    const channelObj = {
      on: vi.fn((_event: string, _opts: unknown, cb: (payload: unknown) => void) => {
        if (!listeners.has(key)) listeners.set(key, new Set());
        // biome-ignore lint/style/noNonNullAssertion: guaranteed by the has() check above
        listeners.get(key)!.add(cb);
        return channelObj;
      }),
      subscribe: vi.fn(() => channelObj),
    };
    return channelObj;
  }),
  removeChannel: vi.fn(),
}));

export const __resetStore = (): void => {
  store.clear();
  listeners.clear();
};

export const __setDoc = (id: string, data: Record<string, unknown>): void => {
  store.set(id, data);
  const key = `document:${id}`;
  for (const cb of listeners.get(key) ?? []) cb({ new: data });
};

export const __getStore = (): Map<string, Record<string, unknown>> => store;
