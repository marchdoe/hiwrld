import { getAdminClient } from './supabaseAdmin';

export async function resolveWorkspace(key: string) {
  const db = getAdminClient();
  const { data, error } = await db.from('workspaces').select('id').eq('secret_key', key).single();
  if (error?.code === 'PGRST116' || !data) return null;
  if (error) throw error;
  return data;
}
