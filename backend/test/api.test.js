import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db.js';

let server, base, db, dir;

const call = async (method, url, body) => {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
};

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pim-'));
  db = createDb(path.join(dir, 'db.json'));
  server = createApp(db).listen(0);
  base = `http://localhost:${server.address().port}`;
  await call('PUT', '/api/woo/settings', { latencyMs: 0 });
});

after(() => {
  server.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('simulated WooCommerce API', () => {
  it('starts with the seeded remote-only product', async () => {
    const { status, data } = await call('GET', '/api/woo/products');
    assert.equal(status, 200);
    assert.equal(data[0].sku, 'ACC-MSE-ERG');
  });

  it('creates, updates and deletes a product', async () => {
    const created = await call('POST', '/api/woo/products', { name: 'Desk Lamp', sku: 'LMP-1', regular_price: '19.00' });
    assert.equal(created.status, 201);
    assert.equal(typeof created.data.id, 'number');

    const updated = await call('PUT', `/api/woo/products/${created.data.id}`, { name: 'Desk Lamp v2' });
    assert.equal(updated.data.name, 'Desk Lamp v2');
    assert.equal(updated.data.sku, 'LMP-1');

    assert.equal((await call('DELETE', `/api/woo/products/${created.data.id}`)).status, 200);
    assert.equal((await call('GET', `/api/woo/products/${created.data.id}`)).status, 404);
  });

  it('rejects duplicate SKUs, FAIL SKUs and missing names with 400', async () => {
    await call('POST', '/api/woo/products', { name: 'A', sku: 'DUP-1' });
    assert.equal((await call('POST', '/api/woo/products', { name: 'B', sku: 'dup-1' })).status, 400);
    assert.equal((await call('POST', '/api/woo/products', { name: 'C', sku: 'X-FAIL-1' })).status, 400);
    assert.equal((await call('POST', '/api/woo/products', { sku: 'NO-NAME' })).status, 400);
  });

  it('returns 503 during a simulated outage and recovers', async () => {
    await call('PUT', '/api/woo/settings', { simulateOutage: true });
    assert.equal((await call('GET', '/api/woo/products')).status, 503);
    await call('PUT', '/api/woo/settings', { simulateOutage: false });
    assert.equal((await call('GET', '/api/woo/products')).status, 200);
  });

  it('validates settings', async () => {
    assert.equal((await call('PUT', '/api/woo/settings', { latencyMs: -5 })).status, 400);
  });
});

describe('catalog persistence', () => {
  const catalog = { products: [{ id: 'p-1', name: 'X' }], pendingDeletes: [], syncHistory: [] };

  it('is empty before the first save', async () => {
    assert.equal((await call('GET', '/api/catalog')).data.catalog, null);
  });

  it('rejects malformed bodies', async () => {
    assert.equal((await call('PUT', '/api/catalog', { products: 'nope' })).status, 400);
  });

  it('saves, reloads from disk and resets', async () => {
    assert.equal((await call('PUT', '/api/catalog', catalog)).status, 200);
    assert.deepEqual((await call('GET', '/api/catalog')).data.catalog, catalog);

    await db.flush();
    const reopened = createDb(path.join(dir, 'db.json'));
    assert.deepEqual(reopened.get().catalog, catalog); // survived a "restart"

    await call('POST', '/api/reset');
    assert.equal((await call('GET', '/api/catalog')).data.catalog, null);
  });
});

describe('misc', () => {
  it('health check and unknown routes', async () => {
    assert.equal((await call('GET', '/api/health')).data.status, 'ok');
    assert.equal((await call('GET', '/api/nope')).status, 404);
  });
});
