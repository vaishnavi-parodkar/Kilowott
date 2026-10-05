// Runs only with a live backend:  (cd ../backend && npm start)  then  npm run test:integration
import { describe, it, expect, beforeAll } from 'vitest';
import { apiFetch } from '../services/backendApi.js';
import { wooCommerceService } from '../services/wooCommerceService.js';
import { loadCatalog, saveCatalog } from '../services/catalogStore.js';
import { updateSettings } from '../services/wooSettings.js';

const local = (o = {}) => ({
  id: `l-${Math.random().toString(36).slice(2, 8)}`, name: 'Integration Product', sku: `INT-${Math.random().toString(36).slice(2, 8)}`,
  category: 'Laptops', price: 100, stock: 3, status: 'published', description: '', attributes: [{ key: 'Brand', value: 'Acme' }],
  syncStatus: 'pending', wooId: null, ...o,
});

describe.skipIf(!process.env.INTEGRATION)('frontend ⇄ backend', () => {
  beforeAll(async () => {
    await apiFetch('POST', '/reset');
    await updateSettings({ latencyMs: 0 });
  });

  it('syncs: creates, imports the remote-only product, isolates a rejected SKU', async () => {
    const out = await wooCommerceService.syncProducts([local({ sku: 'GOOD-1' }), local({ sku: 'BAD-FAIL-1' })]);
    expect(out.run.created).toBe(1);
    expect(out.run.failed).toBe(1);
    expect(out.run.imported).toBe(1); // seeded "Wireless Ergonomic Mouse"
    expect(out.run.status).toBe('partial');
    expect(out.products.find((p) => p.sku === 'GOOD-1').syncStatus).toBe('synced');
  });

  it('marks items failed during an outage, then recovers', async () => {
    await updateSettings({ simulateOutage: true });
    const down = await wooCommerceService.syncProducts([local({ sku: 'OUT-1' })], { pull: false });
    expect(down.run.status).toBe('failed');
    await updateSettings({ simulateOutage: false });
    const up = await wooCommerceService.syncProducts(down.products, { pull: false });
    expect(up.run.status).toBe('success');
  });

  it('persists the catalog in the backend', async () => {
    const first = await loadCatalog();
    expect(first.products.length).toBeGreaterThan(0); // seed data on first load
    await saveCatalog({ products: [local({ name: 'Persisted' })], pendingDeletes: [], syncHistory: [] });
    expect((await loadCatalog()).products[0].name).toBe('Persisted');
  });
});
