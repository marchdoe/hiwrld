import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import type { Document } from '../types/document';
import type { Folder, Workspace } from '../types/workspace';

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: Document & { workspace_id?: string | null; folder_id?: string | null };
        Insert: Omit<Document, 'created' | 'updated_at'> & {
          workspace_id?: string | null;
          folder_id?: string | null;
        };
        Update: Partial<Document & { workspace_id?: string | null; folder_id?: string | null }>;
      };
      workspaces: {
        Row: Workspace;
        Insert: Omit<Workspace, 'created_at'>;
        Update: Partial<Workspace>;
      };
      folders: {
        Row: Folder;
        Insert: Omit<Folder, 'created_at'>;
        Update: Partial<Folder>;
      };
    };
  };
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient<Database> | null =
  url && anonKey ? createClient<Database>(url, anonKey) : null;
