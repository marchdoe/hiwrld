import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Split } from './Split';

describe('Split', () => {
  it('renders left and right content', () => {
    render(<Split left={<span>left side</span>} right={<span>right side</span>} />);
    expect(screen.getByText('left side')).toBeInTheDocument();
    expect(screen.getByText('right side')).toBeInTheDocument();
  });

  it('accepts custom ratio', () => {
    const { container } = render(
      <Split left={<span>a</span>} right={<span>b</span>} ratio="1fr 2fr" />
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.gridTemplateColumns).toBe('1fr 2fr');
  });
});
