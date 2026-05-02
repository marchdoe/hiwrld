import { createFileRoute, redirect } from '@tanstack/react-router';
import { generateDocumentId } from '../lib/generateId';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: '/$docId',
      params: { docId: generateDocumentId() },
    });
  },
  component: () => null,
});
