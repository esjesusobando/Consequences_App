// Safe LocalStorage access layer (CONSEQ-FIX P0-5)
// JSON-only reads/writes that never throw: corrupt payloads fall back to a
// default, quota errors are swallowed and reported as `false`.

export const STORAGE_SCHEMA_VERSION_KEY = 'sota_storage_v1';
export const STORAGE_SCHEMA_VERSION = 1;

export function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`safeGet: unreadable localStorage key "${key}", using fallback`, e);
    return fallback;
  }
}

export function safeSet(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`safeSet: failed to write localStorage key "${key}"`, e);
    return false;
  }
}

// Idempotent schema stamp. ponytail: version bookkeeping only — real
// migrations register here when v1 data actually has to change shape.
export function ensureStorageVersion(): void {
  if (safeGet<number | null>(STORAGE_SCHEMA_VERSION_KEY, null) === null) {
    safeSet(STORAGE_SCHEMA_VERSION_KEY, STORAGE_SCHEMA_VERSION);
  }
}
