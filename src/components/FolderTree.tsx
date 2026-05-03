import { useState } from 'react';
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
            className={`tree-row${node.type === 'document' && node.id === activeDocId ? ' tree-row--active' : ''}`}
            style={{ paddingLeft: `${12 + depth * 14}px` }}
            onContextMenu={(e) => handleContextMenu(e, node)}
            role="none"
          >
            {node.type === 'folder' ? (
              <button
                type="button"
                className="tree-folder-btn"
                onClick={() => toggleFolder(node.id)}
              >
                <span className="tree-chevron">{openFolders.has(node.id) ? '▼' : '▶'}</span>
                <span className="tree-icon">📁</span>
                <span className="tree-label">{node.name}</span>
              </button>
            ) : (
              <button type="button" className="tree-doc-btn" onClick={() => onDocClick(node.id)}>
                <span className="tree-icon">📄</span>
                <span className="tree-label">{node.name}</span>
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
