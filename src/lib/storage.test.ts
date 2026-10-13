import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  safeGet,
  safeSet,
  ensureStorageVersion,
  STORAGE_SCHEMA_VERSION_KEY,
} from './storage';

// localStorage does not exist in the default (node) vitest environment,
// so every test stubs its own minimal implementation.
let store: Record<string, string>;

const stubStorage = (opts: { setThrows?: boolean } = {}) => {
  store = {};
  const getItem = vi.fn((key: string) => (key in store ? store[key] : null));
  const setItem = vi.fn((key: string, value: string) => {
    if (opts.setThrows) throw new Error('QuotaExceededError');
    store[key] = String(value);
  });
  const removeItem = vi.fn((key: string) => {
    delete store[key];
  });
  vi.stubGlobal('localStorage', { getItem, setItem, removeItem });
  return { getItem, setItem, removeItem };
};

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('safeGet', () => {
  it('returns the parsed value for valid JSON', () => {
    stubStorage();
    store['cfg'] = JSON.stringify({ volume: 40 });
    expect(safeGet<{ volume: number }>('cfg', { volume: 0 })).toEqual({ volume: 40 });
  });

  it('returns the fallback when the key is missing', () => {
    stubStorage();
    expect(safeGet('cfg', 'fallback')).toBe('fallback');
  });

  it('returns the fallback instead of throwing on corrupt JSON', () => {
    stubStorage();
    store['cfg'] = '{definitely-not-json';
    expect(safeGet('cfg', null)).toBeNull();
    expect(safeGet('cfg', { ok: true })).toEqual({ ok: true });
  });
});

describe('safeSet', () => {
  it('serializes the value as JSON and reports success', () => {
    stubStorage();
    expect(safeSet('cfg', { a: 1 })).toBe(true);
    expect(store['cfg']).toBe('{"a":1}');
  });

  it('swallows quota errors and reports failure', () => {
    stubStorage({ setThrows: true });
    expect(() => safeSet('cfg', { a: 1 })).not.toThrow();
    expect(safeSet('cfg', { a: 1 })).toBe(false);
  });
});

describe('ensureStorageVersion', () => {
  it('stamps the schema version exactly once across repeated calls', () => {
    const { setItem } = stubStorage();
    ensureStorageVersion();
    ensureStorageVersion();
    const stampCalls = setItem.mock.calls.filter(([key]) => key === STORAGE_SCHEMA_VERSION_KEY);
    expect(stampCalls).toHaveLength(1);
    expect(safeGet<number | null>(STORAGE_SCHEMA_VERSION_KEY, null)).toBe(1);
  });
});
