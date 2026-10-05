/**
 * Tiny JSON-file database. Everything lives in one document:
 *   { woo: { nextId, products[] }, settings: {...}, catalog: {...} | null }
 * Writes are atomic (temp file + rename) and serialised through a promise chain,
 * so concurrent requests can never corrupt the file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedRemoteProducts, defaultSettings } from './seed.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export const freshState = () => ({
  woo: { nextId: 1000, products: seedRemoteProducts() },
  settings: { ...defaultSettings },
  catalog: null,
});

export function createDb(file = process.env.DATA_FILE || path.join(here, '..', 'data', 'db.json')) {
  let state;
  try {
    state = { ...freshState(), ...JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch {
    state = freshState(); // missing or unreadable file → start clean
  }

  let queue = Promise.resolve();
  const persist = () => {
    const snapshot = JSON.stringify(state, null, 2);
    queue = queue.then(async () => {
      await fs.promises.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.tmp`;
      await fs.promises.writeFile(tmp, snapshot);
      await fs.promises.rename(tmp, file);
    }).catch((err) => console.error('Failed to write database file:', err.message));
    return queue;
  };

  return {
    get: () => state,
    save: persist,
    reset() {
      state = freshState();
      return persist();
    },
    flush: () => queue,
  };
}
