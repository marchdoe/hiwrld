import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { contextMenu } from '../../styled-system/recipes';

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onClick: () => void;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const ctx = contextMenu();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={ctx.root}
      style={{ position: 'fixed', top: y, left: x, zIndex: 1000 }}
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          className={contextMenu({ danger: item.danger }).item}
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.icon && <span className={ctx.icon}>{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}
