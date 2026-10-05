import { describe, it, expect } from 'vitest';
import { wooCommerceService, createWooCommerceService, getSyncSummary } from '../services/wooCommerceService.js';
import { configureMockApi } from '../services/mockWooServer.js';

const product = (overrides = {}) => ({
  id: `local-${Math.random().toString(36).slice(2, 8)}`,
  name: 'Sample Product',
  sku: `SKU-${Math.random().toString(36).slice(2, 8)}`,
  category: 'Laptops',
  price: 100,
  stock: 5,
  status: 'published',
  description: '',
  attributes: [{ key: 'Brand', value: 'Acme' }],
  syncStatus: 'pending',
  wooId: null,
  ...overrides,
});

describe('wooCommerceService CRUD (mock REST API)', () => {
  it('creates, fetches, updates and deletes a product', async () => {
    const created = await wooCommerceService.createProduct(product({ sku: 'CRUD-1', name: 'CRUD Product' }));
    expect(created.wooId).toBeTypeOf('number');

    let remote = await wooCommerceService.fetchProducts();
    expect(remote.find((p) => p.sku === 'CRUD-1')).toBeDefined();

    const updated = await wooCommerceService.updateProduct(created.wooId, product({ sku: 'CRUD-1', name: 'Renamed', price: 150 }));
    expect(updated.name).toBe('Renamed');
    expect(updated.price).toBe(150);

    await wooCommerceService.deleteProduct(created.wooId);
    remote = await wooCommerceService.fetchProducts();
    expect(remote.find((p) => p.sku === 'CRUD-1')).toBeUndefined();
  });

  it('maps internal attributes to Woo attributes and back', async () => {
    const created = await wooCommerceService.createProduct(product({ sku: 'ATTR-1', attributes: [{ key: 'RAM', value: '16GB' }, { key: 'Color', value: 'Blue' }] }));
    expect(created.attributes).toEqual([{ key: 'RAM', value: '16GB' }, { key: 'Color', value: 'Blue' }]);
  });

  it('rejects duplicate SKUs like the real API does', async () => {
    await wooCommerceService.createProduct(product({ sku: 'DUP-1' }));
    await expect(wooCommerceService.createProduct(product({ sku: 'DUP-1' }))).rejects.toMatchObject({ status: 400 });
  });

  it('accepts an injected client (easy swap for the real REST API)', async () => {
    const calls = [];
    const fakeClient = {
      request: async (method, path) => {
        calls.push(`${method} ${path}`);
        return { status: 200, data: [] };
      },
    };
    const service = createWooCommerceService(fakeClient);
    await service.fetchProducts();
    expect(calls).toEqual(['GET /products']);
  });
});

describe('syncProducts', () => {
  it('creates pending products remotely and marks them synced with a Woo id', async () => {
    const local = [product({ sku: 'SYNC-1' }), product({ sku: 'SYNC-2' })];
    const { products, run } = await wooCommerceService.syncProducts(local, { pull: false });

    expect(run.status).toBe('success');
    expect(run.created).toBe(2);
    expect(run.failed).toBe(0);
    products.forEach((p) => {
      expect(p.syncStatus).toBe('synced');
      expect(p.wooId).toBeTypeOf('number');
    });
  });

  it('updates products that already have a Woo id', async () => {
    const created = await wooCommerceService.createProduct(product({ sku: 'UPD-1' }));
    const local = [product({ sku: 'UPD-1', name: 'Edited name', wooId: created.wooId })];
    const { run, products } = await wooCommerceService.syncProducts(local, { pull: false });
    expect(run.updated).toBe(1);
    expect(products[0].syncStatus).toBe('synced');
    const remote = await wooCommerceService.fetchProducts();
    expect(remote.find((p) => p.wooId === created.wooId).name).toBe('Edited name');
  });

  it('skips products that are already synced', async () => {
    const local = [product({ syncStatus: 'synced', wooId: 55 })];
    const { run } = await wooCommerceService.syncProducts(local, { pull: false });
    expect(run.synced).toBe(0);
    expect(run.failed).toBe(0);
  });

  it('isolates failures: one rejected product does not stop the others', async () => {
    const local = [product({ sku: 'GOOD-1' }), product({ sku: 'FAIL-ME' }), product({ sku: 'GOOD-2' })];
    const { products, run } = await wooCommerceService.syncProducts(local, { pull: false });

    expect(run.status).toBe('partial');
    expect(run.synced).toBe(2);
    expect(run.failed).toBe(1);
    expect(run.errors[0].message).toMatch(/SKU/);
    expect(products.find((p) => p.sku === 'FAIL-ME')).toMatchObject({ syncStatus: 'failed' });
    expect(products.filter((p) => p.syncStatus === 'synced')).toHaveLength(2);
  });

  it('marks everything failed during an outage and recovers on retry', async () => {
    configureMockApi({ simulateOutage: true });
    const local = [product({ sku: 'OUT-1' }), product({ sku: 'OUT-2' })];
    const first = await wooCommerceService.syncProducts(local);
    expect(first.run.status).toBe('failed');
    expect(first.products.every((p) => p.syncStatus === 'failed')).toBe(true);

    configureMockApi({ simulateOutage: false });
    const second = await wooCommerceService.syncProducts(first.products, { pull: false });
    expect(second.run.status).toBe('success');
    expect(second.products.every((p) => p.syncStatus === 'synced')).toBe(true);
  });

  it('pushes queued deletions and keeps the ones that fail', async () => {
    const created = await wooCommerceService.createProduct(product({ sku: 'DEL-1' }));
    const ok = await wooCommerceService.syncProducts([], { pendingDeletes: [{ wooId: created.wooId, name: 'DEL-1' }], pull: false });
    expect(ok.run.deleted).toBe(1);
    expect(ok.pendingDeletes).toEqual([]);

    configureMockApi({ simulateOutage: true });
    const bad = await wooCommerceService.syncProducts([], { pendingDeletes: [{ wooId: 12345, name: 'X' }], pull: false });
    expect(bad.pendingDeletes).toHaveLength(1);
    expect(bad.run.failed).toBe(1);
  });

  it('imports remote-only products during the pull phase', async () => {
    const { products, run } = await wooCommerceService.syncProducts([]);
    expect(run.imported).toBe(1); // the seeded "Wireless Ergonomic Mouse"
    expect(products[0]).toMatchObject({ sku: 'ACC-MSE-ERG', syncStatus: 'synced' });
  });

  it('reports progress up to 100%', async () => {
    const events = [];
    await wooCommerceService.syncProducts([product({ sku: 'PRG-1' }), product({ sku: 'PRG-2' })], { onProgress: (e) => events.push(e.percent) });
    expect(events.length).toBeGreaterThan(0);
    expect(events.at(-1)).toBe(100);
  });
});

describe('getSyncSummary', () => {
  it('counts synced, failed and pending (including queued deletions)', () => {
    const summary = getSyncSummary(
      [{ syncStatus: 'synced' }, { syncStatus: 'synced' }, { syncStatus: 'pending' }, { syncStatus: 'failed' }],
      [{ wooId: 1, name: 'x' }],
    );
    expect(summary).toEqual({ synced: 2, failed: 1, pending: 2, total: 4 });
  });
});
