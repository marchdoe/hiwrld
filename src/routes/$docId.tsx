import { createFileRoute, notFound, Outlet } from '@tanstack/react-router';

// Layout route — renders <Outlet /> so child routes ($docId.index and $docId.$mode)
// mount correctly. Without this, $docId.$mode never renders and mode is always null.
export const Route = createFileRoute('/$docId')({
  params: {
    parse: (raw) => {
      if (!/^[a-zA-Z0-9]{7}$/.test(raw.docId)) throw notFound();
      return { docId: raw.docId };
    },
    stringify: (p) => ({ docId: p.docId }),
  },
  component: function DocLayout() {
    return <Outlet />;
  },
});
