# Woo PIM — Product Information Management with WooCommerce Sync

> **Backend added.** This frontend now talks to the Express backend in `../backend` (catalog persistence and the simulated
> WooCommerce store). See the top-level `README.md` for how to run both. Set `VITE_USE_BACKEND=false` in `.env` to get the
> original browser-only behaviour described below (localStorage + in-browser mock).

A compact, fully working Product Information Management (PIM) system built with **React + Vite + Tailwind CSS**.
It lets a merchant manage a product catalog with flexible attributes, synchronise it with a WooCommerce store,
and generate product descriptions with an AI-assisted helper.

> **Important — WooCommerce is simulated.**
> No WooCommerce credentials were provided, so the application talks to a **mock WooCommerce REST API**
> that runs entirely in the browser (data stored in `localStorage`). The integration is written so the mock can be
> replaced by the real WooCommerce REST API by swapping a single transport object. Likewise, the AI feature uses a
> **mock AI service** — no API key, no network.

## Problem statement

> *Analyze, design, and implement a Product Information Management (PIM) system that integrates with WooCommerce.*

A PIM is the "single source of truth" for product data. This project addresses the three core needs:

1. **Product catalog management** – create, view, edit, delete, search, filter and sort products.
2. **Product attribute handling** – each product carries its own dynamic set of attributes (Brand, Color, Size, RAM, Storage, Material, …).
3. **WooCommerce data synchronisation** – push local changes to the store, pull products created in the store, track sync status and history.

## Features

**Dashboard** – total products, categories, synced / pending counts, last synchronisation time, sync health bar with a working *Sync now* button, recent products, products by category.

**Product catalog** – table and card views, search (name, SKU, category, attribute values), category filter, 7 sort options, add / edit / view / delete (with confirmation), inline form validation, loading skeletons, empty states, error state with recovery.

**Dynamic attributes** – free-form name/value rows with autocomplete suggestions and one-click "quick add" chips. Different products can have completely different attribute sets.

**WooCommerce sync page** – last sync, synced / failed / pending counts, live progress bar, success / partial / error messages, queue of items waiting to sync, per-run history, a "remote store" inspector (`fetchProducts()`), and a *connection simulator* (simulate outage, change latency, SKU containing `FAIL` is rejected) to demonstrate error handling.

**AI feature – "Generate description"** – builds a description from the product name, category and attributes using a clearly-labelled **mock AI service**. Can be regenerated for different phrasing.

**Responsive UI** – sidebar on desktop, slide-in navigation on mobile, cards instead of tables on small screens.

## Architecture

```
┌──────────────────────────────  React UI  ──────────────────────────────┐
│  pages/ (Dashboard, Catalog, SyncPage)   components/ (forms, badges…)  │
└───────────────┬────────────────────────────────────────────────────────┘
                │ useProducts()  (hooks/ProductsContext.jsx — state + persistence)
┌───────────────▼───────────────┐   ┌───────────────────────────────────┐
│ services/catalogStore.js      │   │ services/wooCommerceService.js    │
│ localStorage persistence      │   │ fetch / create / update / delete  │
└───────────────────────────────┘   │ / syncProducts  (business logic)  │
                                    └───────────────┬───────────────────┘
                                                    │ client.request(method, path, body)
                          ┌─────────────────────────▼───────────────────────┐
                          │ mockWooServer.js   (default, simulated REST API) │
                          │ wooHttpClient.js   (real fetch client, example)  │
                          └──────────────────────────────────────────────────┘
services/wooMapper.js        internal product  ⇄  WooCommerce v3 JSON schema
services/mockAiService.js    isolated mock AI (description generator)
```

Design patterns used:

- **Service layer / Facade** – the UI never calls the mock server directly, only `wooCommerceService`.
- **Dependency injection / Adapter** – `createWooCommerceService(client)` accepts any object with `request(method, path, body)`.
- **Mapper** – `wooMapper.js` is the only place that knows WooCommerce field names.
- **Context + custom hook** – `ProductsProvider` / `useProducts` for state, persistence and sync orchestration.
- **Pure functions for logic** – validation (`utils/validation.js`), filtering/sorting (`utils/productQuery.js`) and sync result merging (`utils/syncMerge.js`) are side-effect free and unit-testable.

## Technology stack

| Area | Choice |
|---|---|
| UI | React 19, React Router |
| Build tool | Vite |
| Styling | Tailwind CSS 3 |
| Persistence | `localStorage` |
| WooCommerce | Mock REST API (simulated) |
| AI | Mock AI service |
| Unit tests | Vitest |
| E2E test | Playwright |

Runtime dependencies: `react`, `react-dom`, `react-router-dom` only.

## Folder structure

```
woo-pim/
├── e2e/
│   └── add-product.spec.js        # Playwright: add product → appears in catalog
├── public/favicon.svg
├── src/
│   ├── components/                # Layout, Modal, ProductForm, AttributeEditor, Badge, ui primitives…
│   ├── data/seedProducts.js       # 10 sample products + categories + attribute suggestions
│   ├── hooks/                     # ProductsContext (state + sync), useToast
│   ├── pages/                     # Dashboard, Catalog, SyncPage, NotFound
│   ├── services/
│   │   ├── wooCommerceService.js  # fetchProducts / createProduct / updateProduct / deleteProduct / syncProducts
│   │   ├── mockWooServer.js       # simulated WooCommerce REST API
│   │   ├── wooHttpClient.js       # example real client (not used by default)
│   │   ├── wooMapper.js           # internal model ⇄ WooCommerce schema
│   │   ├── mockAiService.js       # MOCK AI description generator
│   │   └── catalogStore.js        # localStorage persistence
│   ├── tests/                     # Vitest unit tests
│   ├── utils/                     # validation, formatting, storage, query, sync merge
│   ├── App.jsx  main.jsx  index.css
├── index.html  vite.config.js  tailwind.config.js  postcss.config.js  playwright.config.js
└── package.json
```

## Setup instructions

Requires **Node.js 18+**.

```bash
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

```bash
npm run build        # production build into dist/
npm run preview      # serve the production build
npm test             # unit tests (Vitest)
npm run test:e2e     # end-to-end test (Playwright)
```

No API keys, database or internet access are needed after `npm install`.
To reset the demo at any time use **WooCommerce sync → Reset sample data**.

## How the WooCommerce integration works

Every product has a local `syncStatus`: `synced`, `pending` or `failed`, and (once created in the store) a `wooId`.

- **Add / edit** a product → status becomes `pending`.
- **Delete** a product that exists in the store → a deletion is queued (counted as pending).
- **Sync now** → `syncProducts()`:
  1. sends queued deletions (`DELETE /products/:id`);
  2. for every `pending` or `failed` product, calls `POST /products` (no `wooId`) or `PUT /products/:id`;
  3. pulls `GET /products` and **imports** products that exist only in the store;
  4. returns the updated catalog plus a run summary (created / updated / deleted / imported / failed, errors) that is stored in the sync history.
- Failures are isolated per product; a store outage marks the remaining items `failed` so they are retried next time.
- Edits made while a sync is running are preserved (`utils/syncMerge.js`).

### Switching to the real WooCommerce REST API

```js
// src/services/wooCommerceService.js
import { createWooHttpClient } from './wooHttpClient.js';
export const wooCommerceService = createWooCommerceService(
  createWooHttpClient({ baseUrl: 'https://your-store.com', key: 'ck_…', secret: 'cs_…' })
);
```

`wooHttpClient.js` already implements the same `request(method, path, body)` contract against
`/wp-json/wc/v3`. In production, proxy calls through a backend so consumer secrets never reach the browser.

## Mock API assumptions

- The mock mirrors WooCommerce REST v3 routes: `GET/POST /products`, `GET/PUT/DELETE /products/:id` with realistic status codes (200, 201, 400, 404, 503) and error shapes.
- Products are stored in the WooCommerce schema (`regular_price` as string, `stock_quantity`, `categories[]`, `attributes[]`, `status: publish|draft`).
- SKUs must be unique (duplicate → `400`), and any SKU containing `FAIL` is rejected to demonstrate partial failure.
- Latency is simulated (~450 ms, configurable); an outage can be toggled on the Sync page (`503`).
- The remote store starts with one product (*Wireless Ergonomic Mouse*) that does not exist locally, so the first sync demonstrates an **import**.
- Remote data persists in `localStorage` under `pim.mockWoo.*`; catalog data under `pim.catalog.v1`.
- Only simple products are supported (no variations, images or taxonomies/ID mapping for categories — categories are matched by name).

## AI feature explanation

*Generate description* appears in the product form. `services/mockAiService.js` is **a mock** that simulates an LLM:
it takes `{ name, category, attributes }`, picks a category-specific profile and tone, turns each attribute
(Brand, RAM/Storage, Material, Color/Size, Connectivity, Weight, or any custom attribute) into a sentence, and
adds an intro and closing line. *Regenerate* rotates the intro phrasing. It waits ~0.9 s to mimic network latency
and returns a plain string, so a real LLM call (e.g. an API-backed `generateProductDescription`) can replace it without
changing the UI. The form labels the feature as **Mock AI Service** and the text is always editable before saving.

## Testing instructions

```bash
npm test
```
Runs 33 unit tests: product validation (`validation.test.js`), the WooCommerce service and `syncProducts`
(`wooSync.test.js` — create/update/delete, failure isolation, outage + retry, queued deletions, import, progress),
plus query/sort, seed data and the mock AI service (`misc.test.js`), and the sync-merge logic (`syncMerge.test.js`).

```bash
npx playwright install chromium   # first time only: downloads the browser
npm run test:e2e
```
Runs one end-to-end test: **Add product → product appears in the catalog** (and survives a reload).
The Playwright config starts the dev server automatically. If you cannot download browsers, point to an existing
Chrome/Chromium: `PW_CHROMIUM_PATH=/path/to/chrome npm run test:e2e`.

## Future improvements

- Connect to a real WooCommerce store through a small backend proxy (OAuth/keys kept server-side) and webhooks for real-time pulls.
- Conflict resolution when both sides changed (currently local changes win on push).
- Product variations, images/media, category and attribute taxonomies synced by ID.
- Bulk import/export (CSV), bulk edit, and per-product "sync this item".
- Real LLM integration for descriptions, SEO titles and attribute extraction.
- Multi-user access, roles and audit log; a real database instead of `localStorage`.
- Pagination / virtualised lists for large catalogs; more E2E coverage and CI.
