import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as useDocumentModule from '../hooks/useDocument';
import * as useDocumentsModule from '../hooks/useDocuments';
import * as useWorkspaceModule from '../hooks/useWorkspace';
import { SplitPane } from './SplitPane';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({
      children,
      className,
      href,
    }: {
      children: React.ReactNode;
      className?: string;
      href?: string;
    }) => (
      <a className={className} href={href ?? '#'}>
        {children}
      </a>
    ),
  };
});

function mockDocument(overrides = {}) {
  vi.spyOn(useDocumentModule, 'useDocument').mockReturnValue({
    body: '',
    title: 'Untitled',
    isLoading: false,
    setBody: vi.fn(),
    ...overrides,
  });
}

function mockDocuments() {
  vi.spyOn(useDocumentsModule, 'useDocuments').mockReturnValue({
    docs: [],
    add: vi.fn(),
    remove: vi.fn(),
    setTitle: vi.fn(),
  });
}

function mockWorkspace() {
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

describe('SplitPane', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.documentElement.className = '';
  });

  it('renders textarea with body from useDocument', () => {
    mockDocument({ body: '# Hello', title: 'Hello' });
    mockDocuments();
    mockWorkspace();
    render(<SplitPane docId="abc1234" mode={null} />);
    const textarea = document.querySelector<HTMLTextAreaElement>('.document-textarea');
    expect(textarea?.value).toBe('# Hello');
  });

  it('adds read-only class to <html> when mode is read', () => {
    mockDocument();
    mockDocuments();
    mockWorkspace();
    render(<SplitPane docId="abc1234" mode="read" />);
    expect(document.documentElement.classList.contains('read-only')).toBe(true);
  });

  it('adds write-only class to <html> when mode is write', () => {
    mockDocument();
    mockDocuments();
    mockWorkspace();
    render(<SplitPane docId="abc1234" mode="write" />);
    expect(document.documentElement.classList.contains('write-only')).toBe(true);
  });

  it('calls setBody when textarea changes', async () => {
    const setBody = vi.fn();
    mockDocument({ setBody });
    mockDocuments();
    mockWorkspace();
    render(<SplitPane docId="abc1234" mode={null} />);
    const textarea = document.querySelector<HTMLTextAreaElement>('.document-textarea');
    if (!textarea) throw new Error('textarea not found');
    await userEvent.type(textarea, 'a');
    expect(setBody).toHaveBeenCalled();
  });
});
