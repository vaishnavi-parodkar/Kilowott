// A product that already exists in the (simulated) WooCommerce store but not in the PIM,
// so the first sync demonstrates an import. Stored in the WooCommerce v3 schema.
export const seedRemoteProducts = () => [
  {
    id: 900,
    name: 'Wireless Ergonomic Mouse',
    sku: 'ACC-MSE-ERG',
    type: 'simple',
    status: 'publish',
    regular_price: '39.00',
    manage_stock: true,
    stock_quantity: 90,
    stock_status: 'instock',
    description: 'Ergonomic wireless mouse with silent clicks.',
    categories: [{ name: 'Bags & Accessories' }],
    attributes: [
      { name: 'Brand', position: 0, visible: true, variation: false, options: ['Clickr'] },
      { name: 'Color', position: 1, visible: true, variation: false, options: ['Graphite'] },
      { name: 'Connectivity', position: 2, visible: true, variation: false, options: ['2.4 GHz USB'] },
    ],
    date_created: new Date().toISOString(),
    date_modified: new Date().toISOString(),
  },
];

export const defaultSettings = { latencyMs: 450, simulateOutage: false };
