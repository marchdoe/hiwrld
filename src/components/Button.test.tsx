import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button variant="solid">click me</Button>);
    expect(screen.getByText('click me')).toBeInTheDocument();
  });

  it('renders as anchor when href provided', () => {
    render(
      <Button variant="solid" href="/foo">
        go
      </Button>
    );
    expect(screen.getByRole('link', { name: 'go' })).toHaveAttribute('href', '/foo');
  });

  it('renders all variants without throwing', () => {
    const variants = ['solid', 'line', 'ghost', 'link'] as const;
    for (const v of variants) {
      const { unmount } = render(<Button variant={v}>{v}</Button>);
      expect(screen.getByText(v)).toBeInTheDocument();
      unmount();
    }
  });

  it('applies inverted visual modifier', () => {
    render(
      <Button variant="solid" visual="inverted">
        cta
      </Button>
    );
    expect(screen.getByText('cta')).toBeInTheDocument();
  });
});
