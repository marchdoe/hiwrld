import { Router } from 'express';
import { generateDocumentId } from '../src/lib/generateId';
import { getAdminClient } from './supabaseAdmin';

export const foldersRouter = Router({ mergeParams: true });

async function resolveWorkspace(key: string) {
  const db = getAdminClient();
  const { data, error } = await db.from('workspaces').select('id').eq('secret_key', key).single();
  if (error?.code === 'PGRST116' || !data) return null;
  if (error) throw error;
  return data;
}

// POST /api/workspaces/:key/folders
foldersRouter.post('/', async (req, res, next) => {
  try {
    const { name, parent_id } = req.body as { name?: unknown; parent_id?: string };
    if (!name || typeof name !== 'string')
      return res.status(400).json({ error: 'name is required' });
    const ws = await resolveWorkspace(req.params.key);
    if (!ws) return res.status(404).json({ error: 'workspace not found' });
    const db = getAdminClient();
    const { data, error } = await db
      .from('folders')
      .insert({ id: generateDocumentId(), workspace_id: ws.id, parent_id: parent_id ?? null, name })
      .select()
      .single();
    if (error) return next(error);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/workspaces/:key/folders/:id
foldersRouter.patch('/:id', async (req, res, next) => {
  try {
    const { name } = req.body as { name?: unknown };
    if (!name || typeof name !== 'string')
      return res.status(400).json({ error: 'name is required' });
    const ws = await resolveWorkspace(req.params.key);
    if (!ws) return res.status(404).json({ error: 'workspace not found' });
    const db = getAdminClient();
    const { data, error } = await db
      .from('folders')
      .update({ name })
      .eq('id', req.params.id)
      .eq('workspace_id', ws.id)
      .select()
      .single();
    if (error?.code === 'PGRST116' || !data) return res.status(404).json({ error: 'not found' });
    if (error) return next(error);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/workspaces/:key/folders/:id
// Supabase cascades the delete to sub-folders and documents via ON DELETE CASCADE
foldersRouter.delete('/:id', async (req, res, next) => {
  try {
    const ws = await resolveWorkspace(req.params.key);
    if (!ws) return res.status(404).json({ error: 'workspace not found' });
    const db = getAdminClient();
    const { error } = await db
      .from('folders')
      .delete()
      .eq('id', req.params.id)
      .eq('workspace_id', ws.id);
    if (error) return next(error);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
