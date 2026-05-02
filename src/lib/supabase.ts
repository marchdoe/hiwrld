import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import type { Document } from '../types/document';

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: Document;
        Insert: Omit<Document, 'created' | 'updated_at'>;
        Update: Partial<Document>;
      };
    };
  };
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient<Database> | null =
  url && anonKey ? createClient<Database>(url, anonKey) : null;
