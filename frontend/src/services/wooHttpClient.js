/**
 * Example REAL WooCommerce transport (NOT used by default — WooCommerce is simulated here).
 *
 * Usage when you have credentials:
 *   import { createWooCommerceService } from './wooCommerceService.js';
 *   import { createWooHttpClient } from './wooHttpClient.js';
 *   export const wooCommerceService = createWooCommerceService(
 *     createWooHttpClient({ baseUrl: 'https://store.example.com', key: 'ck_...', secret: 'cs_...' })
 *   );
 *
 * It honours the same `request(method, path, body)` contract as the mock server and throws
 * errors with a `status` field, so the sync logic needs no changes.
 * NOTE: never ship consumer secrets in browser code; proxy through a backend in production.
 */
export function createWooHttpClient({ baseUrl, key, secret }) {
  const auth = typeof btoa === 'function' ? btoa(`${key}:${secret}`) : '';
  return {
    async request(method, path, body) {
      const res = await fetch(`${baseUrl}/wp-json/wc/v3${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.message || `WooCommerce request failed (${res.status})`);
        err.status = res.status;
        err.code = data.code;
        throw err;
      }
      return { status: res.status, data };
    },
  };
}
