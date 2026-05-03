// api/supabaseAdmin.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/supabase';

let _client: SupabaseClient<Database> | null = null;

export function getAdminClient(): SupabaseClient<Database> {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  }
  _client = createClient<Database>(url, key);
  return _client;
}

/** Reset the cached client — for use in tests only. */
export function _resetAdminClient(): void {
  _client = null;
}
