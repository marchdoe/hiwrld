import { useNavigate } from '@tanstack/react-router';
import { useDocuments } from '../hooks/useDocuments';
import { generateDocumentId } from '../lib/generateId';
import { DocumentMenuItem } from './DocumentMenuItem';

export interface DocumentMenuProps {
  currentDocId: string;
}

export function DocumentMenu({ currentDocId }: DocumentMenuProps) {
  const { docs, remove, add } = useDocuments();
  const navigate = useNavigate();

  const handleDelete = (id: string) => {
    const remaining = docs.filter((d) => d.id !== id);
    remove(id);
    if (id === currentDocId) {
      const next =
        remaining[remaining.length - 1]?.id ??
        (() => {
          const id = generateDocumentId();
          add(id);
          return id;
        })();
      void navigate({ to: '/$docId', params: { docId: next } });
    }
  };

  return (
    <ul className="document-menu">
      {docs.map(({ id, title }) => (
        <DocumentMenuItem key={id} id={id} title={title} onDelete={handleDelete} />
      ))}
    </ul>
  );
}
