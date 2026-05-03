import { useCallback, useEffect, useState } from 'react';

const BOOKMARKS_KEY = 'hiwrld.bookmarks';

export interface BookmarkEntry {
  id: string;
  title: string;
}

function readDocs(): BookmarkEntry[] {
  const raw = localStorage.getItem(BOOKMARKS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BookmarkEntry[];
  } catch {
    return [];
  }
}

const BOOKMARKS_CHANGED = 'hiwrld:bookmarks-changed';

function writeDocs(docs: BookmarkEntry[]): void {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(docs));
  // Defer dispatch so it never fires inside a React state updater (which would
  // synchronously trigger setState on sibling components and cause the
  // "Cannot update a component while rendering a different component" warning).
  setTimeout(() => window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGED)), 0);
}

export interface UseDocumentsResult {
  docs: BookmarkEntry[];
  add: (id: string) => void;
  remove: (id: string) => void;
  setTitle: (id: string, title: string) => void;
}

export function useDocuments(): UseDocumentsResult {
  const [docs, setDocs] = useState<BookmarkEntry[]>(readDocs);

  useEffect(() => {
    const handler = () => setDocs(readDocs());
    window.addEventListener('storage', handler);
    window.addEventListener(BOOKMARKS_CHANGED, handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener(BOOKMARKS_CHANGED, handler);
    };
  }, []);

  const add = useCallback((id: string) => {
    setDocs(() => {
      const current = readDocs();
      if (current.some((d) => d.id === id)) return current;
      const next = [...current, { id, title: '' }];
      writeDocs(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setDocs(() => {
      const current = readDocs();
      const next = current.filter((d) => d.id !== id);
      writeDocs(next);
      return next;
    });
  }, []);

  const setTitle = useCallback((id: string, title: string) => {
    setDocs(() => {
      const current = readDocs();
      const next = current.map((d) => (d.id === id ? { ...d, title } : d));
      writeDocs(next);
      return next;
    });
  }, []);

  return { docs, add, remove, setTitle };
}
