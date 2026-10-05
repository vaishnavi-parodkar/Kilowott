/**
 * MOCK WooCommerce REST server (simulation only).
 *
 * WooCommerce credentials are NOT provided for this project, so this module stands in for
 * `https://<store>/wp-json/wc/v3`. It exposes a single `request(method, path, body)` function
 * that mimics the real HTTP contract (status codes, JSON bodies, error shapes), and keeps the
 * "remote store" in localStorage so it survives page reloads.
 *
 * To go live: replace this transport with a `fetch`-based client (see wooHttpClient.js).
 */
import { loadJSON, saveJSON, removeKey } from '../utils/storage.js';
import { seedRemoteOnly } from '../data/seedProducts.js';
import { toWooPayload } from './wooMapper.js';

const REMOTE_KEY = 'pim.mockWoo.store';
const SETTINGS_KEY = 'pim.mockWoo.settings';

const defaultSettings = { latencyMs: 450, simulateOutage: false };

export class WooApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'WooApiError';
    this.status = status;
    this.code = code;
  }
}

export const getMockSettings = () => ({ ...defaultSettings, ...loadJSON(SETTINGS_KEY, {}) });
export const configureMockApi = (patch) => saveJSON(SETTINGS_KEY, { ...getMockSettings(), ...patch });

function loadStore() {
  const existing = loadJSON(REMOTE_KEY, null);
  if (existing) return existing;
  // First run: the store already contains products created outside of this PIM.
  const products = seedRemoteOnly.map((p) => ({ ...toWooPayload(p), id: p.wooId, date_modified: new Date().toISOString() }));
  const store = { nextId: 1000, products };
  saveJSON(REMOTE_KEY, store);
  return store;
}

/** Test helper / "reset demo" helper. */
export function resetMockServer() {
  removeKey(REMOTE_KEY);
  removeKey(SETTINGS_KEY);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseRoute(path) {
  const match = path.match(/^\/products(?:\/(\d+))?$/);
  if (!match) throw new WooApiError(404, 'rest_no_route', `No route was found matching ${path}`);
  return match[1] ? Number(match[1]) : null;
}

/** Business rules a real store would enforce. */
function assertValid(store, payload, selfId = null) {
  if (!payload.name) throw new WooApiError(400, 'rest_invalid_param', 'Invalid parameter(s): name');
  if (/FAIL/i.test(payload.sku || '')) {
    throw new WooApiError(400, 'woocommerce_rest_product_invalid_sku', 'Invalid or duplicated SKU. (simulated rejection)');
  }
  if (payload.sku && store.products.some((p) => p.id !== selfId && (p.sku || '').toLowerCase() === payload.sku.toLowerCase())) {
    throw new WooApiError(400, 'woocommerce_rest_product_not_created', 'Invalid or duplicated SKU.');
  }
}

/**
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {string} path e.g. "/products" or "/products/101"
 * @param {object} [body]
 * @returns {Promise<{status:number, data:any}>}
 */
export async function request(method, path, body) {
  const settings = getMockSettings();
  if (settings.latencyMs > 0) await sleep(settings.latencyMs * (0.6 + Math.random() * 0.8));
  if (settings.simulateOutage) {
    throw new WooApiError(503, 'service_unavailable', 'The WooCommerce store is unreachable (simulated outage).');
  }

  const id = parseRoute(path);
  const store = loadStore();
  const now = new Date().toISOString();

  if (method === 'GET' && id === null) return { status: 200, data: store.products.map((p) => ({ ...p })) };

  if (method === 'GET') {
    const found = store.products.find((p) => p.id === id);
    if (!found) throw new WooApiError(404, 'woocommerce_rest_product_invalid_id', 'Invalid ID.');
    return { status: 200, data: { ...found } };
  }

  if (method === 'POST' && id === null) {
    assertValid(store, body);
    const created = { ...body, id: store.nextId++, date_created: now, date_modified: now };
    store.products.push(created);
    saveJSON(REMOTE_KEY, store);
    return { status: 201, data: { ...created } };
  }

  if (method === 'PUT' && id !== null) {
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new WooApiError(404, 'woocommerce_rest_product_invalid_id', 'Invalid ID.');
    assertValid(store, { ...store.products[idx], ...body }, id);
    store.products[idx] = { ...store.products[idx], ...body, id, date_modified: now };
    saveJSON(REMOTE_KEY, store);
    return { status: 200, data: { ...store.products[idx] } };
  }

  if (method === 'DELETE' && id !== null) {
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new WooApiError(404, 'woocommerce_rest_product_invalid_id', 'Invalid ID.');
    const [removed] = store.products.splice(idx, 1);
    saveJSON(REMOTE_KEY, store);
    return { status: 200, data: { ...removed } };
  }

  throw new WooApiError(405, 'rest_no_route', `Method ${method} not allowed for ${path}`);
}
