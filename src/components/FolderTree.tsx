import { ChevronDown, ChevronRight, FileText, Folder } from 'lucide-react';
import { useState } from 'react';
import { folderTree } from '../../styled-system/recipes';
import type { TreeNode } from '../types/workspace';
import type { ContextMenuItem } from './ContextMenu';
import { ContextMenu } from './ContextMenu';

export interface FolderTreeProps {
  nodes: TreeNode[];
  activeDocId: string;
  onDocClick: (id: string) => void;
  onFolderMenu: (node: TreeNode) => ContextMenuItem[];
  onDocMenu: (node: TreeNode) => ContextMenuItem[];
  depth?: number;
}

export function FolderTree({
  nodes,
  activeDocId,
  onDocClick,
  onFolderMenu,
  onDocMenu,
  depth = 0,
}: FolderTreeProps) {
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const ft = folderTree();

  const toggleFolder = (id: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, node: TreeNode) => {
    e.preventDefault();
    const items = node.type === 'folder' ? onFolderMenu(node) : onDocMenu(node);
    setMenu({ x: e.clientX, y: e.clientY, items });
  };

  return (
    <>
      {nodes.map((node) => (
        <div key={node.id}>
          <div
            className={
              folderTree({ active: node.type === 'document' && node.id === activeDocId }).row
            }
            style={{ paddingLeft: `${12 + depth * 14}px` }}
            onContextMenu={(e) => handleContextMenu(e, node)}
            role="none"
          >
            {node.type === 'folder' ? (
              <button type="button" className={ft.folderBtn} onClick={() => toggleFolder(node.id)}>
                <span className={ft.chevron}>
                  {openFolders.has(node.id) ? (
                    <ChevronDown size={10} strokeWidth={2} />
                  ) : (
                    <ChevronRight size={10} strokeWidth={2} />
                  )}
                </span>
                <span className={ft.icon}>
                  <Folder size={12} strokeWidth={1.5} />
                </span>
                <span className={ft.label}>{node.name}</span>
              </button>
            ) : (
              <button type="button" className={ft.docBtn} onClick={() => onDocClick(node.id)}>
                <span className={ft.icon}>
                  <FileText size={12} strokeWidth={1.5} />
                </span>
                <span className={ft.label}>{node.name}</span>
              </button>
            )}
          </div>
          {node.type === 'folder' && openFolders.has(node.id) && (
            <FolderTree
              nodes={node.children}
              activeDocId={activeDocId}
              onDocClick={onDocClick}
              onFolderMenu={onFolderMenu}
              onDocMenu={onDocMenu}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />
      )}
    </>
  );
}
