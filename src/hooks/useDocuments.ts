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
  window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGED));
}

interface UseDocumentsResult {
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
    setDocs((prev) => {
      if (prev.some((d) => d.id === id)) return prev;
      const next = [...prev, { id, title: '' }];
      writeDocs(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setDocs((prev) => {
      const next = prev.filter((d) => d.id !== id);
      writeDocs(next);
      return next;
    });
  }, []);

  const setTitle = useCallback((id: string, title: string) => {
    setDocs((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, title } : d));
      writeDocs(next);
      return next;
    });
  }, []);

  return { docs, add, remove, setTitle };
}
