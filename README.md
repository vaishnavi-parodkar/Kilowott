# Woo PIM — Product Information Management with WooCommerce Sync

React + Vite + Tailwind **frontend** and a small Node/Express **backend**.
The backend is the PIM's database (catalog persistence) and also serves a **simulated WooCommerce REST API**
(`/wc/v3` products subset). No WooCommerce credentials, API keys, Docker or external database are needed.

```
PIM-WooCommerce-Integration/
├── backend/    Express API: simulated WooCommerce store + catalog persistence (JSON file DB)
├── frontend/   React app (catalog, dynamic attributes, sync page, mock-AI descriptions)
├── API.md      Backend endpoint reference
└── README.md   this file
```

## Requirements

- **Node.js 18 or newer** (check with `node -v`) and npm. Nothing else.

## Run the project

### Option A — one command (recommended)

From this folder:

```bash
npm run install:all     # installs root, backend and frontend dependencies (once)
npm run dev             # starts backend (port 4000) and frontend (port 5173) together
```

Open **http://localhost:5173**. Stop with `Ctrl + C`.

### Option B — two terminals

```bash
# Terminal 1 — backend
cd backend
npm install
npm start               # http://localhost:4000  (health check: /api/health)

# Terminal 2 — frontend
cd frontend
npm install
npm run dev             # http://localhost:5173
```

The frontend dev server proxies every `/api/*` call to `http://localhost:4000`, so **start the backend first**
(or at the same time). If it is not running, the app shows "Cannot reach the PIM backend".

### Production-style build (optional)

```bash
npm run build           # outputs frontend/dist
```

`dist/` is static; serve it with any web server that also forwards `/api` to the backend.

## Try it

1. **Catalog** → *Add product* (name, SKU, category, price, stock, attributes). Use *Generate with AI* for a description.
   Reload the page — the product is still there: it is stored by the backend in `backend/data/db.json`.
2. **WooCommerce sync** → *Sync now*. New/changed products are pushed to the simulated store; the store's
   pre-existing *Wireless Ergonomic Mouse* is imported.
3. Use the **connection simulator** on the Sync page: switch on *Simulate outage* and sync (items become *failed*),
   switch it off and sync again (they recover). A SKU containing `FAIL` is always rejected, to demo partial failure.
4. *Reset sample data* restores the original demo state (catalog, store and settings).

## What the backend does

| Concern | Endpoint(s) | Notes |
|---|---|---|
| Simulated WooCommerce store | `GET/POST /api/woo/products`, `GET/PUT/DELETE /api/woo/products/:id` | WooCommerce v3 JSON schema, status codes 200/201/400/404/503, unique SKU, `FAIL` SKUs rejected |
| Connection simulator | `GET/PUT /api/woo/settings` | latency (ms) and outage switch |
| Catalog persistence | `GET/PUT /api/catalog` | products, queued deletions, sync history |
| Utilities | `GET /api/health`, `POST /api/reset` | |

Data lives in one JSON file (`backend/data/db.json`, created on first write; delete it to start fresh).
Writes are atomic and serialised. Full request/response details are in **API.md**.

## Architecture

```
React UI ── useProducts() ──► catalogStore.js ───────────────┐  PUT/GET /api/catalog
              │                                              ▼
              └──► wooCommerceService.js ── backendApi.js ─► Express backend ── db.json
                   (sync logic, mapper)      /api/woo/...     (simulated WooCommerce)
```

- `frontend/src/services/wooCommerceService.js` holds the sync logic and depends only on an injectable
  `request(method, path, body)` transport, so the simulated store can be replaced by a real
  WooCommerce `/wp-json/wc/v3` endpoint (ideally proxied by the backend so consumer keys stay server-side).
- `VITE_USE_BACKEND` (in `frontend/.env`) switches between backend mode (`true`, default) and the original
  browser-only mode (`false`, localStorage + in-browser mock). Unit tests run in browser-only mode.
- The AI description feature is still a **mock** (`frontend/src/services/mockAiService.js`, template-based, no API key).

## Tests

```bash
npm test                                      # backend (9 tests) + frontend unit tests (33)
npm run test:integration --prefix frontend    # frontend <-> live backend (start the backend first)
npx playwright install chromium && npm run test:e2e --prefix frontend   # optional browser test (starts both servers)
```

## Troubleshooting

- **"Cannot reach the PIM backend"** — start the backend (`npm start` in `backend/`) and check port 4000 is free
  (change with `PORT=4001 npm start`, then update the proxy target in `frontend/vite.config.js`).
- **Port 5173 busy** — stop the other Vite process or run `npm run dev -- --port 5174` in `frontend/`.
- **Want a clean slate** — click *Reset sample data*, or stop the backend and delete `backend/data/db.json`.
