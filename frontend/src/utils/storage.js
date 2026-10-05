// Thin, safe wrapper around localStorage (falls back to memory if unavailable).
const memory = new Map();

function getStore() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch { /* ignore */ }
  return null;
}

export function loadJSON(key, fallback) {
  try {
    const store = getStore();
    const raw = store ? store.getItem(key) : memory.get(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  const raw = JSON.stringify(value);
  const store = getStore();
  if (store) store.setItem(key, raw);
  else memory.set(key, raw);
}

export function removeKey(key) {
  const store = getStore();
  if (store) store.removeItem(key);
  else memory.delete(key);
}
