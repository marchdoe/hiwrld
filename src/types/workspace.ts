export interface Workspace {
  id: string;
  name: string;
  secret_key: string;
  created_at: string;
}

export interface Folder {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
}

export interface WorkspaceDoc {
  id: string;
  workspace_id: string;
  folder_id: string | null;
  body: string;
  title: string;
  created: string;
  updated_at: string | null;
}

export interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'document';
  children: TreeNode[]; // always present (empty array for docs and empty folders)
  // document-only fields:
  title?: string;
  body?: string;
}
