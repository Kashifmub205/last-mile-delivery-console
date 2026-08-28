import type { StorageKey } from './keys';
import { getStorage } from './mmkv';

export function getJson<T>(key: StorageKey): T | null {
  const raw = getStorage().getString(key);

  if (raw == null) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setJson(key: StorageKey, value: unknown): void {
  getStorage().set(key, JSON.stringify(value));
}

export function removeJson(key: StorageKey): void {
  getStorage().remove(key);
}

export function hasKey(key: StorageKey): boolean {
  return getStorage().contains(key);
}
