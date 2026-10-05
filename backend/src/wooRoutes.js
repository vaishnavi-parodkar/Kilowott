/**
 * Simulated WooCommerce REST API (v3 subset): GET/POST /products, GET/PUT/DELETE /products/:id.
 * Same rules the browser mock used to enforce: unique SKU, SKU containing "FAIL" is rejected,
 * optional latency and a switchable outage (503).
 * Swap this router for a proxy to a real store's /wp-json/wc/v3 to go live.
 */
import { Router } from 'express';

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function assertValid(store, payload, selfId = null) {
  if (!payload || typeof payload.name !== 'string' || !payload.name.trim()) {
    throw new ApiError(400, 'rest_invalid_param', 'Invalid parameter(s): name');
  }
  if (/FAIL/i.test(payload.sku || '')) {
    throw new ApiError(400, 'woocommerce_rest_product_invalid_sku', 'Invalid or duplicated SKU. (simulated rejection)');
  }
  const sku = (payload.sku || '').toLowerCase();
  if (sku && store.products.some((p) => p.id !== selfId && (p.sku || '').toLowerCase() === sku)) {
    throw new ApiError(400, 'woocommerce_rest_product_not_created', 'Invalid or duplicated SKU.');
  }
}

const notFound = () => new ApiError(404, 'woocommerce_rest_product_invalid_id', 'Invalid ID.');

export function createWooRouter(db) {
  const router = Router();

  // Simulated network conditions
  router.use('/products', async (_req, _res, next) => {
    try {
      const { latencyMs, simulateOutage } = db.get().settings;
      if (latencyMs > 0) await sleep(latencyMs * (0.6 + Math.random() * 0.8));
      if (simulateOutage) {
        throw new ApiError(503, 'service_unavailable', 'The WooCommerce store is unreachable (simulated outage).');
      }
      next();
    } catch (err) {
      next(err);
    }
  });

  router.get('/products', (_req, res) => res.json(db.get().woo.products));

  router.get('/products/:id', (req, res) => {
    const found = db.get().woo.products.find((p) => p.id === Number(req.params.id));
    if (!found) throw notFound();
    res.json(found);
  });

  router.post('/products', async (req, res) => {
    const store = db.get().woo;
    assertValid(store, req.body);
    const now = new Date().toISOString();
    const created = { ...req.body, id: store.nextId++, date_created: now, date_modified: now };
    store.products.push(created);
    await db.save();
    res.status(201).json(created);
  });

  router.put('/products/:id', async (req, res) => {
    const store = db.get().woo;
    const id = Number(req.params.id);
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx === -1) throw notFound();
    assertValid(store, { ...store.products[idx], ...req.body }, id);
    store.products[idx] = { ...store.products[idx], ...req.body, id, date_modified: new Date().toISOString() };
    await db.save();
    res.json(store.products[idx]);
  });

  router.delete('/products/:id', async (req, res) => {
    const store = db.get().woo;
    const idx = store.products.findIndex((p) => p.id === Number(req.params.id));
    if (idx === -1) throw notFound();
    const [removed] = store.products.splice(idx, 1);
    await db.save();
    res.json(removed);
  });

  // Connection simulator controls (not part of the real WooCommerce API)
  router.get('/settings', (_req, res) => res.json(db.get().settings));

  router.put('/settings', async (req, res) => {
    const { latencyMs, simulateOutage } = req.body || {};
    const settings = db.get().settings;
    if (latencyMs !== undefined) {
      if (!Number.isFinite(latencyMs) || latencyMs < 0 || latencyMs > 10000) {
        throw new ApiError(400, 'rest_invalid_param', 'latencyMs must be a number between 0 and 10000');
      }
      settings.latencyMs = latencyMs;
    }
    if (simulateOutage !== undefined) settings.simulateOutage = Boolean(simulateOutage);
    await db.save();
    res.json(settings);
  });

  return router;
}

export { ApiError };
