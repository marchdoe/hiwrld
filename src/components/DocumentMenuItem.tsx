import { Link } from '@tanstack/react-router';

interface DocumentMenuItemProps {
  id: string;
  title: string;
  onDelete: (id: string) => void;
}

export function DocumentMenuItem({ id, title, onDelete }: DocumentMenuItemProps) {
  return (
    <li className="document-menu-item" data-id={id}>
      <div className="document-menu-item-wrap">
        <Link to="/$docId" params={{ docId: id }} className="document-menu-item-title">
          {title || id}
        </Link>
        <button
          type="button"
          title="Delete Document"
          aria-label="Delete Document"
          className="document-menu-item-delete-button ss-trash"
          onClick={(e) => {
            e.preventDefault();
            onDelete(id);
          }}
        />
      </div>
    </li>
  );
}
