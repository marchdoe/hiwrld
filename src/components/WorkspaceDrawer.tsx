import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';
import type { TreeNode } from '../types/workspace';
import type { ContextMenuItem } from './ContextMenu';
import { DocumentMenu } from './DocumentMenu';
import { FolderTree } from './FolderTree';
import { WorkspaceCreate } from './WorkspaceCreate';
import { workspaceDrawer } from '../../styled-system/recipes';

export interface WorkspaceDrawerProps {
  currentDocId: string;
  onClose: () => void;
}

export function WorkspaceDrawer({ currentDocId, onClose }: WorkspaceDrawerProps) {
  const {
    workspace,
    tree,
    createWorkspace,
    createFolder,
    renameFolder,
    deleteFolder,
    createDocument,
    deleteDocument,
  } = useWorkspace();
  const navigate = useNavigate();
  const wsd = workspaceDrawer();
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'folder' | 'document';
    id: string;
    name: string;
  } | null>(null);

  const handleDocClick = (id: string) => {
    void navigate({ to: '/$docId', params: { docId: id } });
    onClose();
  };

  const handleNewFile = async () => {
    if (workspace) {
      const doc = await createDocument('Untitled');
      void navigate({ to: '/$docId', params: { docId: doc.id } });
    }
  };

  const handleNewFolder = async () => {
    const name = prompt('Folder name:');
    if (name?.trim()) await createFolder(name.trim());
  };

  const folderMenuItems = (node: TreeNode): ContextMenuItem[] => [
    {
      label: 'New file here',
      icon: '📄',
      onClick: async () => {
        const doc = await createDocument('Untitled', node.id);
        void navigate({ to: '/$docId', params: { docId: doc.id } });
      },
    },
    {
      label: 'New folder here',
      icon: '📁',
      onClick: async () => {
        const name = prompt('Folder name:');
        if (name?.trim()) await createFolder(name.trim(), node.id);
      },
    },
    {
      label: 'Rename',
      icon: '✏️',
      onClick: async () => {
        const name = prompt('New name:', node.name);
        if (name?.trim()) await renameFolder(node.id, name.trim());
      },
    },
    {
      label: 'Delete folder',
      icon: '🗑️',
      danger: true,
      onClick: () => setConfirmDelete({ type: 'folder', id: node.id, name: node.name }),
    },
  ];

  const docMenuItems = (node: TreeNode): ContextMenuItem[] => [
    {
      label: 'Delete',
      icon: '🗑️',
      danger: true,
      onClick: () => setConfirmDelete({ type: 'document', id: node.id, name: node.name }),
    },
  ];

  return (
    <div className={wsd.root}>
      {workspace ? (
        <>
          {/* Header */}
          <div className={wsd.header}>
            <div className={wsd.title}>
              <span className={wsd.titleIcon}>📁</span>
              <span>{workspace.name}</span>
            </div>
            <div className={wsd.actions}>
              <button
                type="button"
                title="New file"
                aria-label="New file"
                className={wsd.actionBtn}
                onClick={() => void handleNewFile()}
              >
                📄+
              </button>
              <button
                type="button"
                title="New folder"
                aria-label="New folder"
                className={wsd.actionBtn}
                onClick={() => void handleNewFolder()}
              >
                📁+
              </button>
            </div>
          </div>
          {/* Tree */}
          <div className={wsd.tree}>
            {tree && (
              <FolderTree
                nodes={tree.children}
                activeDocId={currentDocId}
                onDocClick={handleDocClick}
                onFolderMenu={folderMenuItems}
                onDocMenu={docMenuItems}
              />
            )}
          </div>
          {/* Workspace key */}
          <div className={wsd.key}>
            <span>🔑</span>
            <span className={wsd.keyValue}>{workspace.secret_key.slice(0, 12)}…</span>
            <button
              type="button"
              className={wsd.keyCopy}
              onClick={() => void navigator.clipboard.writeText(workspace.secret_key)}
            >
              copy
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Flat doc list (existing behaviour) */}
          <div className={wsd.header}>
            <span className={wsd.title}>Files</span>
          </div>
          <DocumentMenu currentDocId={currentDocId} />
          <div className={wsd.createCta}>
            <WorkspaceCreate onCreate={createWorkspace} />
          </div>
        </>
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className={wsd.confirmOverlay} role="dialog" aria-modal="true">
          <div className={wsd.confirm}>
            <p>
              Delete <strong>{confirmDelete.name}</strong>?
              {confirmDelete.type === 'folder' && ' All contents will be removed.'}
            </p>
            <div className={wsd.confirmActions}>
              <button type="button" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={wsd.confirmDelete}
                onClick={async () => {
                  if (confirmDelete.type === 'folder') await deleteFolder(confirmDelete.id);
                  else await deleteDocument(confirmDelete.id);
                  setConfirmDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
