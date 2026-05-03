import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { generateTitle } from '../lib/generateTitle';
import { localSync } from '../lib/localSync';
import { supabase } from '../lib/supabase';
import type { Document } from '../types/document';

export interface UseDocumentResult {
  body: string;
  title: string;
  isLoading: boolean;
  setBody: (body: string) => void;
}

const WORKSPACE_STORAGE_KEY = 'hiwrld.workspace';

function getWorkspaceKey(): string | null {
  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { secret_key: string }).secret_key ?? null;
  } catch {
    return null;
  }
}

export function useDocument(id: string): UseDocumentResult {
  const queryClient = useQueryClient();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const path = `documents/${id}`;

  // Supabase path: TanStack Query for cached initial fetch
  const { data: queryData, isLoading: queryLoading } = useQuery<Document | null>({
    queryKey: ['document', id],
    queryFn: async () => {
      if (!supabase) return null;
      const { data } = await supabase.from('documents').select('*').eq('id', id).single();
      return data as Document | null;
    },
    enabled: !!supabase,
    staleTime: 1000 * 60 * 5,
  });

  // Local state for body and title (used for all paths)
  const [body, setBodyState] = useState('');
  const [title, setTitle] = useState('');

  // Sync body/title from query result (Supabase path)
  useEffect(() => {
    if (!supabase || !queryData) return;
    setBodyState(queryData.body ?? '');
    setTitle(queryData.title ?? generateTitle(queryData.body ?? '', new Date(queryData.created)));
  }, [queryData]);

  // API path: fetch from workspace API when no Supabase credentials
  useEffect(() => {
    if (supabase) return;
    const key = getWorkspaceKey();
    if (!key) return;
    fetch(`/api/workspaces/${key}/documents/${id}`)
      .then((r) => (r.ok ? (r.json() as Promise<Document>) : null))
      .then((doc) => {
        if (!doc) return;
        setBodyState(doc.body ?? '');
        setTitle(doc.title ?? generateTitle(doc.body ?? '', new Date(doc.created)));
      })
      .catch(() => {});
  }, [id]);

  // LocalSync path: initial load from localStorage (fallback when no workspace)
  useEffect(() => {
    if (supabase) return;
    if (getWorkspaceKey()) return; // API path handles this
    const stored = localStorage.getItem(`hiwrld:sync:${path}`);
    if (stored) {
      try {
        const val = JSON.parse(stored) as Partial<Document>;
        setBodyState(val.body ?? '');
        setTitle(val.title ?? generateTitle(val.body ?? ''));
      } catch {
        setBodyState('');
        setTitle('');
      }
    } else {
      setBodyState('');
      setTitle('');
    }
  }, [path]);

  // Realtime subscription (Supabase channel or localSync)
  useEffect(() => {
    if (supabase) {
      const channel = supabase
        .channel(`document:${id}`)
        .on(
          'postgres_changes' as never,
          { event: '*', schema: 'public', table: 'documents', filter: `id=eq.${id}` },
          (payload: { new: Document }) => {
            const doc = payload.new;
            setBodyState(doc.body ?? '');
            setTitle(doc.title ?? generateTitle(doc.body ?? '', new Date(doc.created)));
            queryClient.invalidateQueries({ queryKey: ['document', id] });
          }
        )
        .subscribe();
      return () => {
        supabase?.removeChannel(channel);
      };
    }
    if (getWorkspaceKey()) return; // No realtime in dev API mode
    return localSync.subscribe(path, (val) => {
      const doc = val as Partial<Document>;
      if (doc.body !== undefined) {
        setBodyState(doc.body);
        setTitle(doc.title ?? generateTitle(doc.body, new Date(doc.created ?? Date.now())));
      }
    });
  }, [id, queryClient, path]);

  // Cleanup debounced save on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const setBody = useCallback(
    (newBody: string) => {
      const newTitle = generateTitle(newBody);
      setBodyState(newBody);
      setTitle(newTitle);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const payload: Partial<Document> = {
          id,
          body: newBody,
          title: newTitle,
          updated_at: new Date().toISOString(),
        };
        if (supabase) {
          supabase
            .from('documents')
            .upsert(payload as Document)
            .then(({ error }) => {
              if (error) console.error('Document save failed:', error);
            });
        } else {
          const key = getWorkspaceKey();
          if (key) {
            fetch(`/api/workspaces/${key}/documents/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: newTitle, body: newBody }),
            }).catch(() => {});
          } else {
            localSync.publish(path, payload);
          }
        }
      }, 500);
    },
    [id, path]
  );

  // isLoading: true while Supabase query is in flight, or false for other paths
  const isLoading = supabase ? queryLoading : false;

  return { body, title, isLoading, setBody };
}
