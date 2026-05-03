import { useCallback, useEffect, useState } from 'react';
import type { TreeNode, Workspace } from '../types/workspace';

const STORAGE_KEY = 'hiwrld.workspace';
const API_BASE = '/api/workspaces';

function loadStored(): Workspace | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Workspace) : null;
  } catch { return null; }
}

export interface UseWorkspaceResult {
  workspace: Workspace | null;
  tree: TreeNode | null;
  isLoading: boolean;
  createWorkspace: (name: string) => Promise<void>;
  refreshTree: () => Promise<void>;
  createFolder: (name: string, parentId?: string) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  createDocument: (title: string, folderId?: string) => Promise<{ id: string }>;
  moveDocument: (id: string, folderId: string | null) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

export function useWorkspace(): UseWorkspaceResult {
  const [workspace, setWorkspace] = useState<Workspace | null>(loadStored);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const apiFetch = useCallback(async (path: string, options?: RequestInit) => {
    if (!workspace) throw new Error('no workspace');
    const res = await fetch(`${API_BASE}/${workspace.secret_key}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    if (res.status === 204) return null;
    return res.json() as Promise<unknown>;
  }, [workspace]);

  const refreshTree = useCallback(async () => {
    if (!workspace) return;
    setIsLoading(true);
    try {
      const t = await fetch(`${API_BASE}/${workspace.secret_key}/tree`).then((r) => r.json()) as TreeNode;
      setTree(t);
    } finally { setIsLoading(false); }
  }, [workspace]);

  useEffect(() => { if (workspace) void refreshTree(); }, [workspace, refreshTree]);

  const createWorkspace = useCallback(async (name: string) => {
    const res = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to create workspace');
    const ws = await res.json() as Workspace;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ws));
    setWorkspace(ws);
  }, []);

  const createFolder = useCallback(async (name: string, parentId?: string) => {
    await apiFetch('/folders', { method: 'POST', body: JSON.stringify({ name, parent_id: parentId }) });
    await refreshTree();
  }, [apiFetch, refreshTree]);

  const renameFolder = useCallback(async (id: string, name: string) => {
    await apiFetch(`/folders/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
    await refreshTree();
  }, [apiFetch, refreshTree]);

  const deleteFolder = useCallback(async (id: string) => {
    await apiFetch(`/folders/${id}`, { method: 'DELETE' });
    await refreshTree();
  }, [apiFetch, refreshTree]);

  const createDocument = useCallback(async (title: string, folderId?: string) => {
    const doc = await apiFetch('/documents', {
      method: 'POST',
      body: JSON.stringify({ title, body: '', folder_id: folderId ?? null }),
    }) as { id: string };
    await refreshTree();
    return doc;
  }, [apiFetch, refreshTree]);

  const moveDocument = useCallback(async (id: string, folderId: string | null) => {
    await apiFetch(`/documents/${id}/move`, { method: 'PATCH', body: JSON.stringify({ folder_id: folderId }) });
    await refreshTree();
  }, [apiFetch, refreshTree]);

  const deleteDocument = useCallback(async (id: string) => {
    await apiFetch(`/documents/${id}`, { method: 'DELETE' });
    await refreshTree();
  }, [apiFetch, refreshTree]);

  return { workspace, tree, isLoading, createWorkspace, refreshTree, createFolder, renameFolder, deleteFolder, createDocument, moveDocument, deleteDocument };
}
