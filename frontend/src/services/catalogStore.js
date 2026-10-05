/**
 * Local persistence for the PIM catalog (localStorage).
 * Kept behind an async API so a real backend/database could replace it later.
 */
import { loadJSON, saveJSON, removeKey } from '../utils/storage.js';
import { seedProducts } from '../data/seedProducts.js';
import { resetMockServer } from './mockWooServer.js';
import { USE_BACKEND, apiFetch } from './backendApi.js';

const KEY = 'pim.catalog.v1';
const LOAD_LATENCY_MS = 350; // simulates a network/db read so loading states are visible

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function seedState() {
  const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();
  return {
    products: seedProducts,
    pendingDeletes: [],
    syncHistory: [
      {
        id: 'sync-seed', startedAt: hoursAgo(144), finishedAt: hoursAgo(144), status: 'success',
        synced: 6, failed: 0, created: 6, updated: 0, deleted: 0, imported: 0, errors: [],
      },
    ],
  };
}

export async function loadCatalog() {
  let saved;
  if (USE_BACKEND) {
    saved = (await apiFetch('GET', '/catalog')).data.catalog; // null until the first save → seed data
  } else {
    await sleep(LOAD_LATENCY_MS);
    saved = loadJSON(KEY, null);
  }
  if (!saved) return seedState();
  if (!Array.isArray(saved.products) || !Array.isArray(saved.pendingDeletes) || !Array.isArray(saved.syncHistory)) {
    throw new Error('The saved catalog data is corrupted and could not be read.');
  }
  return saved;
}

// Backend saves are coalesced: while one request is in flight, only the latest state is kept.
let saving = null;
let queued = null;
function pushToBackend(payload) {
  queued = payload;
  if (saving) return saving;
  saving = (async () => {
    try {
      while (queued) {
        const next = queued;
        queued = null;
        await apiFetch('PUT', '/catalog', next);
      }
    } finally {
      saving = null;
    }
  })();
  return saving;
}

/** Returns a promise (rejects when the save failed). */
export async function saveCatalog(state) {
  const payload = { products: state.products, pendingDeletes: state.pendingDeletes, syncHistory: state.syncHistory };
  if (USE_BACKEND) return pushToBackend(payload);
  saveJSON(KEY, payload);
}

/** Wipes the local catalog AND the simulated remote store, restoring the demo data. */
export async function resetCatalog() {
  if (USE_BACKEND) {
    queued = null;
    await apiFetch('POST', '/reset');
    return;
  }
  removeKey(KEY);
  resetMockServer();
}
