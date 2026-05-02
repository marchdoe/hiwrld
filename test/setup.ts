import { vi } from 'vitest';
import '@testing-library/jest-dom';

vi.stubEnv('VITE_SUPABASE_URL', 'https://fake.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'fake-anon-key');

// @testing-library/dom checks for a global `jest` object to detect fake timers.
// Vitest doesn't set this global, so we alias it here so waitFor works correctly
// when vi.useFakeTimers() is active (it checks setTimeout.clock).
// biome-ignore lint/suspicious/noExplicitAny: necessary to inject jest global for @testing-library/dom fake timer detection
(globalThis as any).jest = vi;
