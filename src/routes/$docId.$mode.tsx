import { createFileRoute, notFound } from '@tanstack/react-router';
import { SplitPane } from '../components/SplitPane';
import type { AppMode } from '../types/document';

export const Route = createFileRoute('/$docId/$mode')({
  params: {
    parse: (raw) => {
      if (!/^[a-zA-Z0-9]{7}$/.test(raw.docId)) throw notFound();
      if (raw.mode !== 'read' && raw.mode !== 'write') throw notFound();
      return { docId: raw.docId, mode: raw.mode as AppMode };
    },
    stringify: (p) => ({ docId: p.docId, mode: p.mode }),
  },
  component: function DocModePage() {
    const { docId, mode } = Route.useParams();
    return <SplitPane docId={docId} mode={mode} />;
  },
});
