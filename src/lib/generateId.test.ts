import { describe, expect, it } from 'vitest';
import { generateDocumentId, generateWorkspaceKey } from './generateId';

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

describe('generateWorkspaceKey', () => {
  it('generates a 32-character alphanumeric string', () => {
    const key = generateWorkspaceKey();
    expect(key).toMatch(/^[a-zA-Z0-9]{32}$/);
  });

  it('generates unique keys', () => {
    const keys = new Set(Array.from({ length: 100 }, generateWorkspaceKey));
    expect(keys.size).toBe(100);
  });
});
