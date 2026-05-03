import { Link } from '@tanstack/react-router';
import { documentMenu } from '../../styled-system/recipes';

export interface DocumentMenuItemProps {
  id: string;
  title: string;
  onDelete: (id: string) => void;
}

export function DocumentMenuItem({ id, title, onDelete }: DocumentMenuItemProps) {
  const dm = documentMenu();
  return (
    <li className={dm.item} data-id={id}>
      <div className={dm.itemWrap}>
        <Link to="/$docId" params={{ docId: id }} className={dm.itemTitle}>
          {title || id}
        </Link>
        <button
          type="button"
          title="Delete Document"
          aria-label="Delete Document"
          className={`${dm.deleteBtn} ss-trash`}
          onClick={(e) => {
            e.preventDefault();
            onDelete(id);
          }}
        />
      </div>
    </li>
  );
}
