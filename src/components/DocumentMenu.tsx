import { useNavigate } from '@tanstack/react-router';
import { flushSync } from 'react-dom';
import { documentMenu } from '../../styled-system/recipes';
import { useDocuments } from '../hooks/useDocuments';
import { generateDocumentId } from '../lib/generateId';
import { DocumentMenuItem } from './DocumentMenuItem';

export interface DocumentMenuProps {
  currentDocId: string;
}

export function DocumentMenu({ currentDocId }: DocumentMenuProps) {
  const { docs, remove, add } = useDocuments();
  const navigate = useNavigate();
  const dm = documentMenu();

  const handleDelete = (id: string) => {
    const remaining = docs.filter((d) => d.id !== id);
    flushSync(() => {
      remove(id);
    });
    if (id === currentDocId) {
      const next =
        remaining[remaining.length - 1]?.id ??
        (() => {
          const newId = generateDocumentId();
          add(newId);
          return newId;
        })();
      void navigate({ to: '/$docId', params: { docId: next } });
    }
  };

  return (
    <ul className={dm.list}>
      {docs.map(({ id, title }) => (
        <DocumentMenuItem key={id} id={id} title={title} onDelete={handleDelete} />
      ))}
    </ul>
  );
}
