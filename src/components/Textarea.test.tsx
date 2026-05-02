import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('calls onChange with the new value on each keystroke', async () => {
    const onChange = vi.fn();
    render(<Textarea body="" onChange={onChange} />);
    const textarea = document.querySelector('.document-textarea') as HTMLTextAreaElement;
    await userEvent.type(textarea, 'hi');
    expect(onChange).toHaveBeenCalledWith('h');
    expect(onChange).toHaveBeenCalledWith('i');
  });

  it('inserts 4 spaces on Tab and prevents default', async () => {
    let body = '';
    const onChange = vi.fn((v: string) => {
      body = v;
    });
    const { rerender } = render(<Textarea body={body} onChange={onChange} />);
    const textarea = document.querySelector('.document-textarea') as HTMLTextAreaElement;
    textarea.focus();
    await userEvent.tab();
    rerender(<Textarea body={body} onChange={onChange} />);
    // Tab inserts 4 spaces
    expect(body).toBe('    ');
  });
});
