import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock TanStack Router — we only test the page renders, not routing
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => config,
  Link: ({ children, ...props }: { children: React.ReactNode; to: string }) =>
    <a href={props.to}>{children}</a>,
}));

vi.mock('../lib/generateId', () => ({
  generateDocumentId: () => 'test123',
}));

// Import the component function from the route config
import { Route } from './index';

describe('Landing page', () => {
  it('renders write and read hero numerals', () => {
    const Component = Route.component as React.ComponentType;
    render(<Component />);
    expect(screen.getByText('write.')).toBeInTheDocument();
    expect(screen.getByText('read.')).toBeInTheDocument();
  });

  it('renders nav wordmark', () => {
    const Component = Route.component as React.ComponentType;
    render(<Component />);
    expect(screen.getAllByText('hi').length).toBeGreaterThan(0);
  });

  it('renders all 4 feature rows', () => {
    const Component = Route.component as React.ComponentType;
    render(<Component />);
    expect(screen.getByText('split pane')).toBeInTheDocument();
    expect(screen.getAllByText('realtime').length).toBeGreaterThan(0);
    expect(screen.getByText('no account')).toBeInTheDocument();
    expect(screen.getByText('offline-ready')).toBeInTheDocument();
  });
});
