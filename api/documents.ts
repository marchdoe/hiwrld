import { Router } from 'express';
import { generateDocumentId } from '../src/lib/generateId';
import { getAdminClient } from './supabaseAdmin';
import { resolveWorkspace } from './utils';

export const documentsRouter = Router({ mergeParams: true });

// GET /api/workspaces/:key/documents/:id
documentsRouter.get('/:id', async (req, res, next) => {
  try {
    const ws = await resolveWorkspace(req.params.key);
    if (!ws) return res.status(404).json({ error: 'workspace not found' });
    const db = getAdminClient();
    const { data, error } = await db
      .from('documents')
      .select('*')
      .eq('id', req.params.id)
      .eq('workspace_id', ws.id)
      .single();
    if (error?.code === 'PGRST116' || !data) return res.status(404).json({ error: 'not found' });
    if (error) return next(error);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/workspaces/:key/documents
documentsRouter.post('/', async (req, res, next) => {
  try {
    const { title, body, folder_id } = req.body as {
      title?: unknown;
      body?: unknown;
      folder_id?: string;
    };
    if (typeof title !== 'string' || typeof body !== 'string') {
      return res.status(400).json({ error: 'title and body are required strings' });
    }
    const ws = await resolveWorkspace(req.params.key);
    if (!ws) return res.status(404).json({ error: 'workspace not found' });
    const db = getAdminClient();
    const { data, error } = await db
      .from('documents')
      .insert({
        id: generateDocumentId(),
        workspace_id: ws.id,
        folder_id: folder_id ?? null,
        title,
        body,
        created: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) return next(error);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/workspaces/:key/documents/:id/move
documentsRouter.patch('/:id/move', async (req, res, next) => {
  try {
    const { folder_id } = req.body as { folder_id?: string | null };
    const ws = await resolveWorkspace(req.params.key);
    if (!ws) return res.status(404).json({ error: 'workspace not found' });
    const db = getAdminClient();
    const { data, error } = await db
      .from('documents')
      .update({ folder_id: folder_id ?? null, updated_at: new Date().toISOString() })
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

// PATCH /api/workspaces/:key/documents/:id
// fallow-ignore-next-line complexity
documentsRouter.patch('/:id', async (req, res, next) => {
  try {
    const { title, body } = req.body as { title?: string; body?: string };
    if (!title && !body) return res.status(400).json({ error: 'title or body required' });
    const ws = await resolveWorkspace(req.params.key);
    if (!ws) return res.status(404).json({ error: 'workspace not found' });
    const db = getAdminClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title) updates.title = title;
    if (body !== undefined) updates.body = body;
    const { data, error } = await db
      .from('documents')
      .update(updates)
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

// DELETE /api/workspaces/:key/documents/:id
documentsRouter.delete('/:id', async (req, res, next) => {
  try {
    const ws = await resolveWorkspace(req.params.key);
    if (!ws) return res.status(404).json({ error: 'workspace not found' });
    const db = getAdminClient();
    const { error } = await db
      .from('documents')
      .delete()
      .eq('id', req.params.id)
      .eq('workspace_id', ws.id);
    if (error) return next(error);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
