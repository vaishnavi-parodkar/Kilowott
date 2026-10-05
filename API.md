# Backend API

Base URL: `http://localhost:4000` (the frontend reaches it through the dev-server proxy as `/api`).
All bodies are JSON. Errors have the shape `{ "code": "...", "message": "..." }`.

## Simulated WooCommerce store — `/api/woo`

Product objects use the WooCommerce v3 schema (`name`, `sku`, `type`, `status: publish|draft`, `regular_price` (string),
`manage_stock`, `stock_quantity`, `stock_status`, `description`, `categories[]`, `attributes[]`, `date_created`, `date_modified`).

| Method & path | Success | Errors |
|---|---|---|
| `GET /api/woo/products` | `200` array of products | `503` while an outage is simulated |
| `GET /api/woo/products/:id` | `200` product | `404` unknown id |
| `POST /api/woo/products` | `201` created product (new numeric `id`) | `400` missing name / duplicate SKU / SKU containing `FAIL` |
| `PUT /api/woo/products/:id` | `200` merged product | `400` as above, `404` |
| `DELETE /api/woo/products/:id` | `200` removed product | `404` |

Latency (default ~450 ms, randomised) and outage (`503`) apply to the `/products` routes only.

### Connection simulator

| Method & path | Body | Result |
|---|---|---|
| `GET /api/woo/settings` | – | `{ "latencyMs": 450, "simulateOutage": false }` |
| `PUT /api/woo/settings` | `{ "latencyMs"?: 0–10000, "simulateOutage"?: boolean }` | updated settings; `400` for invalid latency |

## Catalog persistence — `/api/catalog`

| Method & path | Body | Result |
|---|---|---|
| `GET /api/catalog` | – | `{ "catalog": null }` before the first save, otherwise `{ "catalog": { products, pendingDeletes, syncHistory } }` |
| `PUT /api/catalog` | `{ products: [], pendingDeletes: [], syncHistory: [] }` | `{ "ok": true, "count": n }`; `400` if any array is missing |

## Utilities

| Method & path | Result |
|---|---|
| `GET /api/health` | `{ "status": "ok", "time": "…" }` |
| `POST /api/reset` | clears the catalog, restores the simulated store (with its seed product) and default settings |

## Quick examples

```bash
curl localhost:4000/api/health
curl -X PUT localhost:4000/api/woo/settings -H 'content-type: application/json' -d '{"simulateOutage":true}'
curl -X POST localhost:4000/api/woo/products -H 'content-type: application/json' \
     -d '{"name":"Desk Lamp","sku":"LMP-1","regular_price":"19.00"}'
```
