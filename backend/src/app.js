import express from 'express';
import { createDb } from './db.js';
import { createWooRouter, ApiError } from './wooRoutes.js';

export function createApp(db = createDb()) {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  // Simulated WooCommerce store
  app.use('/api/woo', createWooRouter(db));

  // Catalog persistence: the PIM's own database (products, queued deletions, sync history)
  app.get('/api/catalog', (_req, res) => res.json({ catalog: db.get().catalog }));

  app.put('/api/catalog', async (req, res) => {
    const { products, pendingDeletes, syncHistory } = req.body || {};
    if (![products, pendingDeletes, syncHistory].every(Array.isArray)) {
      throw new ApiError(400, 'invalid_catalog', 'Body must contain products, pendingDeletes and syncHistory arrays.');
    }
    db.get().catalog = { products, pendingDeletes, syncHistory };
    await db.save();
    res.json({ ok: true, count: products.length });
  });

  // Restore the demo data (catalog + simulated store + settings)
  app.post('/api/reset', async (_req, res) => {
    await db.reset();
    res.json({ ok: true });
  });

  app.use('/api', (_req, _res, next) => next(new ApiError(404, 'rest_no_route', 'No route was found matching the URL and request method.')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || (err.type === 'entity.parse.failed' ? 400 : 500);
    if (status >= 500) console.error(err);
    res.status(status).json({ code: err.code || 'internal_error', message: status >= 500 ? 'Internal server error.' : err.message });
  });

  return app;
}
