// src/mcp/server.ts
// Standalone MCP server — exposes hiwrld workspace as MCP tools.
// Run: pnpm mcp
// Requires: HIWRLD_API_URL (e.g. http://localhost:2000), HIWRLD_WORKSPACE_KEY
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const API_URL = process.env.HIWRLD_API_URL ?? 'http://localhost:2000';
const WORKSPACE_KEY = process.env.HIWRLD_WORKSPACE_KEY ?? '';

if (!WORKSPACE_KEY) {
  console.error('HIWRLD_WORKSPACE_KEY is required');
  process.exit(1);
}

const base = `${API_URL}/api/workspaces/${WORKSPACE_KEY}`;

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

interface TreeNodeLike {
  id: string;
  name: string;
  type: string;
  children: TreeNodeLike[];
  title?: string;
}

async function resolveFolderPath(segments: string[]): Promise<string | null> {
  if (segments.length === 0) return null;
  const tree = (await apiFetch('/tree')) as TreeNodeLike;
  let current: TreeNodeLike = tree;
  for (const seg of segments) {
    const child = current.children.find((c) => c.name === seg && c.type === 'folder');
    if (!child) return null;
    current = child;
  }
  return current.id === tree.id ? null : current.id;
}

async function ensureFolderPath(segments: string[]): Promise<string | null> {
  let parentId: string | null = null;
  for (const seg of segments) {
    const tree = (await apiFetch('/tree')) as TreeNodeLike;
    function findFolder(node: TreeNodeLike, name: string): string | null {
      for (const c of node.children) {
        if (c.name === name && c.type === 'folder') return c.id;
        const r = findFolder(c, name);
        if (r) return r;
      }
      return null;
    }
    const existing = findFolder(tree, seg);
    if (existing) {
      parentId = existing;
    } else {
      const folder = (await apiFetch('/folders', {
        method: 'POST',
        body: JSON.stringify({ name: seg, parent_id: parentId }),
      })) as { id: string };
      parentId = folder.id;
    }
  }
  return parentId;
}

function findDocId(node: TreeNodeLike, name: string): string | null {
  for (const c of node.children) {
    if (c.type === 'document' && c.name === name) return c.id;
    if (c.type === 'folder') {
      const r = findDocId(c, name);
      if (r) return r;
    }
  }
  return null;
}

function findItem(node: TreeNodeLike, name: string): { id: string; type: string } | null {
  for (const c of node.children) {
    if (c.name === name) return { id: c.id, type: c.type };
    if (c.type === 'folder') {
      const r = findItem(c, name);
      if (r) return r;
    }
  }
  return null;
}

const server = new Server({ name: 'hiwrld', version: '1.0.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_workspace',
      description: 'Returns the full folder and file tree for the workspace',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'read_document',
      description: 'Read a document by path, e.g. /projects/client-a/brief',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Absolute path to the document' } },
        required: ['path'],
      },
    },
    {
      name: 'write_document',
      description:
        'Create or update a document at a path. Creates intermediate folders automatically.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['path', 'body'],
      },
    },
    {
      name: 'create_folder',
      description: 'Create a folder at a path, creating intermediate folders as needed',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
      },
    },
    {
      name: 'move_item',
      description: 'Move a document to a new folder path',
      inputSchema: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
        },
        required: ['from', 'to'],
      },
    },
    {
      name: 'delete_item',
      description: 'Delete a document or folder (folder deletion is recursive)',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    switch (name) {
      case 'list_workspace': {
        const tree = await apiFetch('/tree');
        return { content: [{ type: 'text', text: JSON.stringify(tree, null, 2) }] };
      }
      case 'read_document': {
        const { path } = args as { path: string };
        const parts = path.replace(/^\//, '').split('/');
        const docName = parts.pop()!;
        const tree = (await apiFetch('/tree')) as TreeNodeLike;
        const docId = findDocId(tree, docName);
        if (!docId)
          return {
            content: [{ type: 'text', text: `Document not found: ${path}` }],
            isError: true,
          };
        const doc = await apiFetch(`/documents/${docId}`);
        return { content: [{ type: 'text', text: JSON.stringify(doc, null, 2) }] };
      }
      case 'write_document': {
        const { path, body } = args as { path: string; body: string };
        const parts = path.replace(/^\//, '').split('/');
        const title = parts.pop()!;
        const folderId = await ensureFolderPath(parts);
        const tree = (await apiFetch('/tree')) as TreeNodeLike;
        const existing = findDocId(tree, title);
        let doc;
        if (existing) {
          doc = await apiFetch(`/documents/${existing}`, {
            method: 'PATCH',
            body: JSON.stringify({ title, body }),
          });
        } else {
          doc = await apiFetch('/documents', {
            method: 'POST',
            body: JSON.stringify({ title, body, folder_id: folderId }),
          });
        }
        return { content: [{ type: 'text', text: JSON.stringify(doc, null, 2) }] };
      }
      case 'create_folder': {
        const { path } = args as { path: string };
        const parts = path.replace(/^\//, '').split('/').filter(Boolean);
        await ensureFolderPath(parts);
        return { content: [{ type: 'text', text: `Folder created: ${path}` }] };
      }
      case 'move_item': {
        const { from, to } = args as { from: string; to: string };
        const fromParts = from.replace(/^\//, '').split('/');
        const docName = fromParts.pop()!;
        const toParts = to.replace(/^\//, '').split('/').filter(Boolean);
        const newFolderId = await ensureFolderPath(toParts);
        const tree = (await apiFetch('/tree')) as TreeNodeLike;
        const docId = findDocId(tree, docName);
        if (!docId)
          return { content: [{ type: 'text', text: `Item not found: ${from}` }], isError: true };
        await apiFetch(`/documents/${docId}/move`, {
          method: 'PATCH',
          body: JSON.stringify({ folder_id: newFolderId }),
        });
        return { content: [{ type: 'text', text: `Moved ${from} to ${to}` }] };
      }
      case 'delete_item': {
        const { path } = args as { path: string };
        const parts = path.replace(/^\//, '').split('/');
        const itemName = parts.pop()!;
        const tree = (await apiFetch('/tree')) as TreeNodeLike;
        const item = findItem(tree, itemName);
        if (!item)
          return { content: [{ type: 'text', text: `Item not found: ${path}` }], isError: true };
        const endpoint = item.type === 'folder' ? `/folders/${item.id}` : `/documents/${item.id}`;
        await apiFetch(endpoint, { method: 'DELETE' });
        return { content: [{ type: 'text', text: `Deleted: ${path}` }] };
      }
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: 'text', text: String(err) }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
