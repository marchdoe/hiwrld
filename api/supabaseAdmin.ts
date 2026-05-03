// api/supabaseAdmin.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/supabase';
import { createDevClient } from './devStore';

// biome-ignore lint/suspicious/noExplicitAny: dev store satisfies the same interface at runtime
let _client: SupabaseClient<Database> | any = null;

export function getAdminClient(): SupabaseClient<Database> {
  if (_client) return _client as SupabaseClient<Database>;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.log('[dev] No Supabase credentials — using local JSON store (.dev-store.json)');
    _client = createDevClient();
    return _client as unknown as SupabaseClient<Database>;
  }
  _client = createClient<Database>(url, key);
  return _client;
}

/** Reset the cached client — for use in tests only. */
export function _resetAdminClient(): void {
  _client = null;
}
