/**
 * Thin client for the PIM backend (Express, see ../../backend).
 * Enabled with VITE_USE_BACKEND=true (set in .env). When disabled, the app falls back to the
 * original browser-only mode (localStorage + in-browser mock WooCommerce), which the unit tests use.
 */
export const USE_BACKEND = import.meta.env?.VITE_USE_BACKEND === 'true';

const BASE = import.meta.env?.VITE_API_BASE || '/api';

/** @returns {Promise<{status:number, data:any}>} — rejects with an Error that carries `.status`/`.code`. */
export async function apiFetch(method, path, body) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    const err = new Error('Cannot reach the PIM backend. Is it running? (npm run dev in /backend, port 4000)');
    err.status = 503; // treated like a store outage by the sync logic
    err.code = 'backend_unreachable';
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return { status: res.status, data };
}

/** Transport for wooCommerceService that talks to the backend's simulated WooCommerce API. */
export const backendWooClient = {
  request: (method, path, body) => apiFetch(method, `/woo${path}`, body),
};
