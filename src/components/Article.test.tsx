import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Article } from './Article';

describe('Article', () => {
  it('renders markdown body as HTML', () => {
    render(<Article body={'# Hello\n\nworld'} />);
    expect(document.querySelector('h1')?.textContent).toBe('Hello');
    expect(document.querySelector('p')?.textContent).toBe('world');
  });

  it('sanitizes script tags via DOMPurify', () => {
    render(<Article body="hi <script>alert(1)</script> bye" />);
    expect(document.querySelector('script')).toBeNull();
  });
});
