export interface Document {
  id: string;
  body: string;
  title: string;
  created: string; // ISO 8601
  updated_at?: string;
}

export type AppMode = 'read' | 'write';
