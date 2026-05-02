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

  // Local state for body and title (used for both paths)
  const [body, setBodyState] = useState('');
  const [title, setTitle] = useState('');

  // Sync body/title from query result (Supabase path)
  useEffect(() => {
    if (!supabase || !queryData) return;
    setBodyState(queryData.body ?? '');
    setTitle(queryData.title ?? generateTitle(queryData.body ?? '', new Date(queryData.created)));
  }, [queryData]);

  // LocalSync path: initial load from localStorage
  useEffect(() => {
    if (supabase) return; // Supabase path handles this
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
    } else {
      return localSync.subscribe(path, (val) => {
        const doc = val as Partial<Document>;
        if (doc.body !== undefined) {
          setBodyState(doc.body);
          setTitle(doc.title ?? generateTitle(doc.body, new Date(doc.created ?? Date.now())));
        }
      });
    }
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
          localSync.publish(path, payload);
        }
      }, 500);
    },
    [id, path]
  );

  // isLoading: true while Supabase query is in flight, or false for localSync
  const isLoading = supabase ? queryLoading : false;

  return { body, title, isLoading, setBody };
}
