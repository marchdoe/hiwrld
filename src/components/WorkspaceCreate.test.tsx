import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceCreate } from './WorkspaceCreate';

describe('WorkspaceCreate', () => {
  it('calls onCreate with the entered name', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<WorkspaceCreate onCreate={onCreate} />);
    await userEvent.type(screen.getByPlaceholderText('Workspace name'), 'my-workspace');
    await userEvent.click(screen.getByRole('button', { name: /create workspace/i }));
    expect(onCreate).toHaveBeenCalledWith('my-workspace');
  });

  it('does not call onCreate when name is empty', async () => {
    const onCreate = vi.fn();
    render(<WorkspaceCreate onCreate={onCreate} />);
    await userEvent.click(screen.getByRole('button', { name: /create workspace/i }));
    expect(onCreate).not.toHaveBeenCalled();
  });
});
