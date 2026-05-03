import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockWorkspace } from '../../test/workspace-mock';
import * as useDocumentsModule from '../hooks/useDocuments';
import * as useWorkspaceModule from '../hooks/useWorkspace';
import { WorkspaceDrawer } from './WorkspaceDrawer';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <a href="/mock" className={className}>
        {children}
      </a>
    ),
    useNavigate: () => vi.fn(),
  };
});

function mockNoWorkspace() {
  mockWorkspace();
  vi.spyOn(useDocumentsModule, 'useDocuments').mockReturnValue({
    docs: [{ id: 'doc1', title: 'My Doc' }],
    add: vi.fn(),
    remove: vi.fn(),
    setTitle: vi.fn(),
  });
}

function mockWithWorkspace() {
  vi.spyOn(useWorkspaceModule, 'useWorkspace').mockReturnValue({
    workspace: { id: 'ws1', name: 'test', secret_key: 'sk_abc', created_at: '2026-01-01' },
    tree: {
      id: 'ws1',
      name: 'root',
      type: 'folder',
      children: [{ id: 'fld1', name: 'Projects', type: 'folder', children: [] }],
    },
    isLoading: false,
    createWorkspace: vi.fn(),
    refreshTree: vi.fn(),
    createFolder: vi.fn(),
    renameFolder: vi.fn(),
    deleteFolder: vi.fn(),
    createDocument: vi.fn(),
    moveDocument: vi.fn(),
    deleteDocument: vi.fn(),
  });
}

describe('WorkspaceDrawer', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('shows flat doc list and create CTA when no workspace', () => {
    mockNoWorkspace();
    render(<WorkspaceDrawer currentDocId="doc1" onClose={vi.fn()} />);
    expect(screen.getByText('My Doc')).toBeInTheDocument();
    expect(screen.getByText(/create a workspace/i)).toBeInTheDocument();
  });

  it('shows folder tree and workspace name when workspace is configured', () => {
    mockWithWorkspace();
    render(<WorkspaceDrawer currentDocId="doc1" onClose={vi.fn()} />);
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });
});
