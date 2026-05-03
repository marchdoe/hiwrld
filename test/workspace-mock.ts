import { vi } from 'vitest';
import type { UseWorkspaceResult } from '../src/hooks/useWorkspace';
import * as useWorkspaceModule from '../src/hooks/useWorkspace';

export function mockWorkspace(overrides: Partial<UseWorkspaceResult> = {}) {
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
    ...overrides,
  });
}
