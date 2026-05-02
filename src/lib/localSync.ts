const PREFIX = 'hiwrld:sync:';

export const localSync = {
  subscribe(path: string, callback: (val: unknown) => void): () => void {
    const key = PREFIX + path;
    const channel = new BroadcastChannel(key);
    channel.addEventListener('message', (event) => callback(event.data));
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        callback(JSON.parse(stored));
      } catch {
        /* ignore corrupt entries */
      }
    }
    return () => channel.close();
  },

  publish(path: string, value: unknown): void {
    const key = PREFIX + path;
    localStorage.setItem(key, JSON.stringify(value));
    const channel = new BroadcastChannel(key);
    channel.postMessage(value);
    channel.close();
  },
};
