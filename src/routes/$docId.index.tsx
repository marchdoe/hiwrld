import { createFileRoute } from '@tanstack/react-router';
import { SplitPane } from '../components/SplitPane';

export const Route = createFileRoute('/$docId/')({
  component: function DocPage() {
    const { docId } = Route.useParams();
    return <SplitPane docId={docId} mode={null} />;
  },
});
