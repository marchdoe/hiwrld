import { Router } from 'express';
import { generateDocumentId, generateWorkspaceKey } from '../src/lib/generateId';
import type { Folder, TreeNode, WorkspaceDoc } from '../src/types/workspace';
import { getAdminClient } from './supabaseAdmin';

export const workspacesRouter = Router();

// POST /api/workspaces
workspacesRouter.post('/', async (req, res, next) => {
  try {
    const { name } = req.body as { name?: unknown };
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    const db = getAdminClient();
    const { data, error } = await db
      .from('workspaces')
      .insert({ id: generateDocumentId(), name, secret_key: generateWorkspaceKey() })
      .select()
      .single();
    if (error) return next(error);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/workspaces/:key
workspacesRouter.get('/:key', async (req, res, next) => {
  try {
    const db = getAdminClient();
    const { data, error } = await db
      .from('workspaces')
      .select('id, name, created_at')
      .eq('secret_key', req.params.key)
      .single();
    if (error?.code === 'PGRST116' || !data) return res.status(404).json({ error: 'not found' });
    if (error) return next(error);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/workspaces/:key/tree
// fallow-ignore-next-line complexity
workspacesRouter.get('/:key/tree', async (req, res, next) => {
  try {
    const db = getAdminClient();
    const { data: ws, error: wsErr } = await db
      .from('workspaces')
      .select('id')
      .eq('secret_key', req.params.key)
      .single();
    if (wsErr?.code === 'PGRST116' || !ws) return res.status(404).json({ error: 'not found' });
    if (wsErr) return next(wsErr);

    const [{ data: folders, error: fErr }, { data: docs, error: dErr }] = await Promise.all([
      db.from('folders').select('*').eq('workspace_id', ws.id),
      db.from('documents').select('id,title,folder_id').eq('workspace_id', ws.id),
    ]);
    if (fErr) return next(fErr);
    if (dErr) return next(dErr);

    const tree = buildTree(ws.id, (folders ?? []) as Folder[], (docs ?? []) as WorkspaceDoc[]);
    res.json(tree);
  } catch (err) {
    next(err);
  }
});

function buildTree(workspaceId: string, folders: Folder[], docs: WorkspaceDoc[]): TreeNode {
  const folderMap = new Map<string | null, TreeNode[]>();

  for (const f of folders) {
    const node: TreeNode = { id: f.id, name: f.name, type: 'folder', children: [] };
    const siblings = folderMap.get(f.parent_id) ?? [];
    siblings.push(node);
    folderMap.set(f.parent_id, siblings);
  }
  for (const d of docs) {
    const node: TreeNode = {
      id: d.id,
      name: d.title || d.id,
      type: 'document',
      title: d.title,
      children: [],
    };
    const siblings = folderMap.get(d.folder_id ?? null) ?? [];
    siblings.push(node);
    folderMap.set(d.folder_id ?? null, siblings);
  }

  const rootChildren = folderMap.get(null) ?? [];
  function attachChildren(nodes: TreeNode[]): void {
    for (const node of nodes) {
      if (node.type === 'folder') {
        node.children = folderMap.get(node.id) ?? [];
        attachChildren(node.children);
      }
    }
  }
  attachChildren(rootChildren);

  return { id: workspaceId, name: 'root', type: 'folder', children: rootChildren };
}
