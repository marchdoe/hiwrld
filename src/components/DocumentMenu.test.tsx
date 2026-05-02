import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BookmarkEntry } from '../hooks/useDocuments';
import * as useDocumentsModule from '../hooks/useDocuments';
import { DocumentMenu } from './DocumentMenu';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
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
    useNavigate: () => vi.fn(),
  };
});

function mockDocs(docs: BookmarkEntry[]) {
  const add = vi.fn();
  const remove = vi.fn();
  const setTitle = vi.fn();
  vi.spyOn(useDocumentsModule, 'useDocuments').mockReturnValue({ docs, add, remove, setTitle });
  return { add, remove, setTitle };
}

describe('DocumentMenu', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders one <li> per doc with the cached title', () => {
    mockDocs([
      { id: 'a', title: 'First' },
      { id: 'b', title: 'Second' },
    ]);
    render(<DocumentMenu currentDocId="a" />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(document.querySelectorAll('li.document-menu-item')).toHaveLength(2);
  });

  it('calls remove() when delete button is clicked', async () => {
    const { remove } = mockDocs([{ id: 'a', title: 'A' }]);
    render(<DocumentMenu currentDocId="current" />);
    await userEvent.click(document.querySelector('.document-menu-item-delete-button')!);
    expect(remove).toHaveBeenCalledWith('a');
  });
});
