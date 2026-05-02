import { describe, expect, it } from 'vitest';
import { generateDocumentId } from './generateId';

describe('generateDocumentId', () => {
  it('returns a 7-character alphanumeric string', () => {
    const id = generateDocumentId();
    expect(id).toMatch(/^[A-Za-z0-9]{7}$/);
  });

  it('generates unique ids across 100 calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateDocumentId()));
    expect(ids.size).toBe(100);
  });
});
