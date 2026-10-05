/**
 * WooCommerce service layer.
 *
 * The UI only talks to this file. It depends on an injectable "client" exposing
 * `request(method, path, body)`; by default that is the simulated WooCommerce API served by the
 * backend (or the in-browser mock when VITE_USE_BACKEND is not 'true'). No credentials needed.
 * Replace `defaultClient` with a real fetch-based client (see wooHttpClient.js) to go live.
 */
import { request as mockRequest } from './mockWooServer.js';
import { USE_BACKEND, backendWooClient } from './backendApi.js';
import { toWooPayload, fromWooProduct } from './wooMapper.js';
import { makeId } from '../utils/makeId.js';

// Default transport: the backend's simulated WooCommerce API, or the in-browser mock when the backend is off.
const defaultClient = USE_BACKEND ? backendWooClient : { request: mockRequest };

export function createWooCommerceService(client = defaultClient) {
  const api = {
    /** GET /products → internal product shape (without local-only fields) */
    async fetchProducts() {
      const { data } = await client.request('GET', '/products');
      return data.map(fromWooProduct);
    },

    /** POST /products */
    async createProduct(product) {
      const { data } = await client.request('POST', '/products', toWooPayload(product));
      return fromWooProduct(data);
    },

    /** PUT /products/:id */
    async updateProduct(wooId, product) {
      const { data } = await client.request('PUT', `/products/${wooId}`, toWooPayload(product));
      return fromWooProduct(data);
    },

    /** DELETE /products/:id */
    async deleteProduct(wooId) {
      const { data } = await client.request('DELETE', `/products/${wooId}`);
      return fromWooProduct(data);
    },

    /**
     * Two-way synchronisation (pure with respect to React/UI state).
     *  1. Push queued deletions.
     *  2. Push every product whose syncStatus is "pending" or "failed" (create or update).
     *  3. Pull remote-only products and import them into the catalog.
     *
     * Failures are isolated per product: one bad record never aborts the whole run.
     *
     * @param {object[]} products   local catalog
     * @param {{ pendingDeletes?: {wooId:number, name:string}[], onProgress?: Function, pull?: boolean }} [options]
     * @returns {Promise<{ products: object[], pendingDeletes: object[], run: object }>}
     */
    async syncProducts(products, { pendingDeletes = [], onProgress, pull = true } = {}) {
      const startedAt = new Date().toISOString();
      const queue = products.filter((p) => p.syncStatus !== 'synced');
      const total = queue.length + pendingDeletes.length + (pull ? 1 : 0);
      let done = 0;
      const tick = (label) => {
        done += 1;
        onProgress?.({ done, total, label, percent: total ? Math.round((done / total) * 100) : 100 });
      };

      const counters = { created: 0, updated: 0, deleted: 0, imported: 0, failed: 0 };
      const errors = [];
      let outage = false;
      const byId = new Map(products.map((p) => [p.id, { ...p }]));
      const remainingDeletes = [];

      for (const item of pendingDeletes) {
        try {
          await api.deleteProduct(item.wooId);
          counters.deleted += 1;
        } catch (err) {
          if (err.status === 404) counters.deleted += 1; // already gone remotely → goal reached
          else {
            remainingDeletes.push(item);
            counters.failed += 1;
            errors.push({ name: item.name, message: err.message });
            if (err.status === 503) outage = true;
          }
        }
        tick(`Deleted ${item.name}`);
      }

      for (const product of queue) {
        const current = byId.get(product.id);
        if (outage) {
          current.syncStatus = 'failed';
          current.syncError = 'Skipped: store unreachable.';
          counters.failed += 1;
          errors.push({ name: product.name, message: current.syncError });
          tick(`Skipped ${product.name}`);
          continue;
        }
        try {
          const saved = product.wooId ? await api.updateProduct(product.wooId, product) : await api.createProduct(product);
          if (product.wooId) counters.updated += 1;
          else counters.created += 1;
          current.wooId = saved.wooId;
          current.syncStatus = 'synced';
          current.syncError = null;
          current.lastSyncedAt = new Date().toISOString();
        } catch (err) {
          current.syncStatus = 'failed';
          current.syncError = err.message;
          counters.failed += 1;
          errors.push({ name: product.name, message: err.message });
          if (err.status === 503) outage = true;
        }
        tick(`Synced ${product.name}`);
      }

      const result = Array.from(byId.values());

      if (pull) {
        if (!outage) {
          try {
            const remote = await api.fetchProducts();
            const knownWooIds = new Set(result.map((p) => p.wooId).filter(Boolean));
            const knownSkus = new Set(result.map((p) => p.sku.toLowerCase()));
            remote.forEach((r) => {
              if (knownWooIds.has(r.wooId) || knownSkus.has((r.sku || '').toLowerCase())) return;
              const ts = new Date().toISOString();
              result.push({ ...r, id: makeId('p'), syncStatus: 'synced', lastSyncedAt: ts, createdAt: ts, updatedAt: ts });
              counters.imported += 1;
            });
          } catch (err) {
            counters.failed += 1;
            errors.push({ name: 'Import from WooCommerce', message: err.message });
          }
        }
        tick('Imported remote products');
      }

      const finishedAt = new Date().toISOString();
      const syncedCount = counters.created + counters.updated + counters.deleted + counters.imported;
      const status = counters.failed === 0 ? 'success' : syncedCount > 0 ? 'partial' : 'failed';

      return {
        products: result,
        pendingDeletes: remainingDeletes,
        run: {
          id: makeId('sync'),
          startedAt,
          finishedAt,
          status,
          synced: syncedCount,
          failed: counters.failed,
          ...counters,
          errors,
        },
      };
    },
  };
  return api;
}

export const wooCommerceService = createWooCommerceService();
export const { fetchProducts, createProduct, updateProduct, deleteProduct, syncProducts } = wooCommerceService;

/** Derived counters shared by the dashboard and the sync page. */
export function getSyncSummary(products, pendingDeletes = []) {
  const synced = products.filter((p) => p.syncStatus === 'synced').length;
  const failed = products.filter((p) => p.syncStatus === 'failed').length;
  const pending = products.filter((p) => p.syncStatus === 'pending').length + pendingDeletes.length;
  return { synced, failed, pending, total: products.length };
}
