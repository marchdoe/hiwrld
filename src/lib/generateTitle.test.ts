import { describe, expect, it } from 'vitest';
import { generateTitle } from './generateTitle';

describe('generateTitle', () => {
  it('returns Untitled with date when body has no heading', () => {
    const title = generateTitle('just plain text', new Date(2026, 4, 1));
    expect(title).toMatch(/^Untitled - Friday, May 1st, 2026$/);
  });

  it('extracts the first H1 as title', () => {
    expect(generateTitle('# My Heading\n\nbody')).toBe('My Heading');
  });

  it('extracts H2-H6 when no H1', () => {
    expect(generateTitle('### deep\n\nbody')).toBe('deep');
  });
});
