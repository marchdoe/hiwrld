import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useDocument } from '../hooks/useDocument';
import { useDocuments } from '../hooks/useDocuments';
import type { AppMode } from '../types/document';
import { ReadPane } from './ReadPane';
import { WritePane } from './WritePane';

export interface SplitPaneProps {
  docId: string;
  mode: AppMode | null;
}

export function SplitPane({ docId, mode }: SplitPaneProps) {
  const { body, title, setBody } = useDocument(docId);
  const { add, setTitle } = useDocuments();
  const navigate = useNavigate();

  // Register doc in bookmark list
  useEffect(() => {
    add(docId);
  }, [docId, add]);

  // Update cached title whenever title changes
  useEffect(() => {
    setTitle(docId, title);
  }, [docId, title, setTitle]);

  // Apply mode classes to <html> (mirrors Backbone renderState)
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('read-only', mode === 'read');
    html.classList.toggle('write-only', mode === 'write');
    return () => {
      html.classList.remove('read-only', 'write-only');
    };
  }, [mode]);

  const handleModeChange = (newMode: AppMode | null) => {
    if (newMode === null) {
      void navigate({ to: '/$docId', params: { docId } });
    } else {
      void navigate({ to: '/$docId/$mode', params: { docId, mode: newMode } });
    }
  };

  return (
    <>
      <WritePane
        docId={docId}
        body={body}
        mode={mode}
        onBodyChange={setBody}
        onModeChange={handleModeChange}
        style={mode === 'read' ? { display: 'none' } : mode === 'write' ? { flex: 1 } : undefined}
      />
      <ReadPane
        body={body}
        mode={mode}
        onModeChange={handleModeChange}
        style={mode === 'write' ? { display: 'none' } : undefined}
      />
    </>
  );
}
