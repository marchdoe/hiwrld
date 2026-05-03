import { vi } from 'vitest';
import * as useWorkspaceModule from '../src/hooks/useWorkspace';

export function mockWorkspace() {
  vi.spyOn(useWorkspaceModule, 'useWorkspace').mockReturnValue({
    workspace: null,
    tree: null,
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
