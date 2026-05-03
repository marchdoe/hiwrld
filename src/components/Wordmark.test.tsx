import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Wordmark } from './Wordmark';

describe('Wordmark', () => {
  it('primary mode shows hi and wrld', () => {
    render(<Wordmark size={24} />);
    expect(screen.getByText('hi')).toBeInTheDocument();
    expect(screen.getByText('wrld')).toBeInTheDocument();
  });

  it('short mode shows hi but not wrld', () => {
    render(<Wordmark size={24} variant="short" />);
    expect(screen.getByText('hi')).toBeInTheDocument();
    expect(screen.queryByText('wrld')).not.toBeInTheDocument();
  });

  it('renders mono variant without throwing', () => {
    render(<Wordmark size={24} variant="mono" />);
    expect(screen.getByText('hi')).toBeInTheDocument();
  });

  it('renders reversed variant without throwing', () => {
    render(<Wordmark size={24} reversed />);
    expect(screen.getByText('hi')).toBeInTheDocument();
  });
});
