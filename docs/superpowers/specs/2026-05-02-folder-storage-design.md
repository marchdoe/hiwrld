# Folder Storage — Design Spec

**Branch:** `feature/folder-storage`  
**Status:** Ready for implementation planning

---

## Goal

Extend hiwrld from a flat list of documents into a structured workspace with folders, unlimited nesting, and an API surface that both humans and AI agents can use to read and write markdown files. The app must remain fully functional with no workspace configured (localStorage fallback is always available).

---

## What We're Building

- A **workspace** concept: a named collection of folders and documents identified by a secret key. No account required — anyone with the key can read and write.
- An **enhanced slide-in drawer** that shows a folder tree instead of a flat document list. Header buttons create new items at the root; right-click context menu manages existing items.
- A **REST API** that exposes workspaces, folders, and documents over HTTP, authenticated via `?key=secret_key`.
- An **MCP server** that wraps the same REST logic as named tools, letting AI agents (Claude, Cursor, etc.) connect natively without custom code.

---

## Data Model

Three Supabase tables. The `documents` table already exists — two nullable columns are added. `workspace_id = null` on a document means it is local-only (today's behaviour, unchanged).

### `workspaces`

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | Generated server-side |
| `name` | text | Human-readable label |
| `secret_key` | text UNIQUE | The shareable token; used as auth for all API calls |
| `created_at` | timestamptz | |

### `folders`

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | |
| `workspace_id` | text FK → workspaces | |
| `parent_id` | text FK → folders, nullable | `null` = root-level folder |
| `name` | text | |
| `created_at` | timestamptz | |

### `documents` (additions only)

| Column | Type | Notes |
|---|---|---|
| `workspace_id` | text FK → workspaces, nullable | `null` = local-only document |
| `folder_id` | text FK → folders, nullable | `null` = lives at workspace root |

Existing columns (`id`, `body`, `title`, `created`, `updated_at`) are unchanged.

**Backward compatibility:** Documents with `workspace_id = null` continue to work exactly as today. No migration of existing documents is required.

---

## REST API

All endpoints are mounted on the existing Express server under `/api`. Authenticated via `?key=<secret_key>` query parameter.

### Workspaces

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/workspaces` | Create a workspace. Body: `{ name }`. Returns `{ id, name, secret_key }`. |
| `GET` | `/api/workspaces/:key` | Get workspace metadata by secret key. |

### Tree

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/workspaces/:key/tree` | Returns the full folder+file tree as nested JSON. Used by the drawer and MCP `list_workspace`. |

### Folders

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/workspaces/:key/folders` | Create a folder. Body: `{ name, parent_id? }`. |
| `PATCH` | `/api/workspaces/:key/folders/:id` | Rename a folder. Body: `{ name }`. |
| `DELETE` | `/api/workspaces/:key/folders/:id` | Delete a folder and all its contents recursively. Requires confirmation from the caller. |

### Documents

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/workspaces/:key/documents/:id` | Get a document's body and metadata. |
| `POST` | `/api/workspaces/:key/documents` | Create a document. Body: `{ title, body, folder_id? }`. |
| `PATCH` | `/api/workspaces/:key/documents/:id` | Update body and/or title. |
| `PATCH` | `/api/workspaces/:key/documents/:id/move` | Move to a different folder. Body: `{ folder_id }`. |
| `DELETE` | `/api/workspaces/:key/documents/:id` | Delete a document. |

**Auth note:** `?key=secret_key` is acceptable for MVP. Before any real production deployment, this should move to an `Authorization: Bearer <key>` header to avoid keys appearing in server logs and browser history.

---

## MCP Server

A standalone MCP server (`src/mcp/server.ts`) that wraps the REST API. AI agents connect to it via the Model Context Protocol — no custom integration code required for Claude, Cursor, or other MCP-compatible tools.

The server is configured with a workspace key at startup (e.g. via environment variable `HIWRLD_WORKSPACE_KEY`).

### Tools

| Tool | Parameters | Description |
|---|---|---|
| `list_workspace` | — | Returns the full folder+file tree. Call this first to understand structure. |
| `read_document` | `path: string` | Read a document by human-readable path, e.g. `/projects/client-a/brief`. Returns body + metadata. |
| `write_document` | `path: string, body: string` | Create or update a document at a path. Creates intermediate folders automatically if they don't exist. |
| `create_folder` | `path: string` | Create a folder at a path, including any missing parent folders. |
| `move_item` | `from: string, to: string` | Move a file or folder to a new path. Works recursively for folders. |
| `delete_item` | `path: string` | Delete a file or folder. Deleting a folder removes all contents recursively. |

**Path resolution:** MCP tools accept human-readable paths (`/research/2026/notes`) and resolve them to Supabase IDs internally. This lets AI agents reason about structure naturally without knowing database internals.

---

## UI Changes

### Drawer

The existing slide-in drawer is extended from a flat document list into a full folder tree.

**Header:**
- Workspace name shown on the left
- Two icon buttons on the right: `📄+` (new file at root) and `📁+` (new folder at root)
- Workspace secret key shown at the bottom with a copy button — makes it easy to share with an AI agent

**Tree:**
- Folders show a collapse/expand chevron (`▼`/`▶`)
- Active document is highlighted with a left accent border
- Indentation increases by 14px per nesting level
- No maximum depth enforced in the UI

**Right-click context menu** (on any folder or file):
- **New file here** — creates a document inside that folder
- **New folder here** — creates a subfolder (folders only)
- Separator
- **Rename** — inline rename with an editable input field
- Separator
- **Delete** — shows a confirmation dialog before removing; folder deletion warns that all contents will be removed

### Workspace creation

For MVP, the app supports **one active workspace at a time**, stored in `localStorage` as `hiwrld.workspace` (`{ id, name, secret_key }`). Switching between multiple workspaces is a post-MVP concern that requires accounts.

When no workspace is configured, the drawer shows the flat local document list (today's behaviour) with a "Create workspace" call-to-action at the top. Clicking it opens a simple modal: a name field and a create button. The secret key is generated server-side and displayed once after creation with a prominent copy prompt.

### Offline / no Supabase

If `VITE_SUPABASE_URL` is not set, workspace features are hidden entirely. The app operates in localStorage-only mode — the drawer shows a flat local document list, and no "Create workspace" CTA is shown.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Invalid workspace key | `403 Forbidden` from API; drawer shows "Invalid key" state |
| Deleting a folder with contents | Confirmation dialog required; recursive delete on confirm |
| `write_document` to a path with missing parent folders | MCP server creates intermediate folders automatically |
| Network error during save | Existing debounced save error logging (`console.error`) — unchanged for now |
| Duplicate folder/file name in same parent | `409 Conflict` from API; drawer shows inline error |

---

## Out of Scope

- User accounts and authentication (design separately; `workspace_id` already has a clean path to adding `owner_id`)
- Dark mode (captured in TODO.md; design separately)
- Moving items via drag-and-drop (future enhancement)
- Sharing a workspace with specific users (requires accounts)
- Real-time collaboration on the folder tree (requires Supabase Realtime on `folders` table — can be added later)
- In-editor AI writing assistance (separate feature)
- `Authorization` header migration from `?key=` query param (post-MVP hardening)

---

## Testing

### Unit / integration (Vitest)
- `useWorkspace` hook: create workspace, fetch tree, error states
- REST API handlers: CRUD for workspaces, folders, documents; path resolution logic for MCP tools; auth rejection on invalid key
- Path resolver utility: string path → Supabase ID resolution, auto-create intermediate folders

### E2E (Playwright)
- Create a workspace, create folders and documents, navigate the tree
- Right-click rename and delete (with confirmation)
- Workspace key copy and workspace key re-entry
- Verify documents with `workspace_id = null` still work as before (backward compat)

### MCP
- Integration test connecting a local MCP client to the server, exercising all six tools against a real Supabase test project
