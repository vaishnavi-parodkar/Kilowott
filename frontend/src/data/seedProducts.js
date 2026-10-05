// Preloaded sample catalog. `syncStatus` drives the dashboard/sync counters.
const now = Date.now();
const daysAgo = (d) => new Date(now - d * 86400000).toISOString();

export const CATEGORIES = [
  'Laptops',
  'Smartphones',
  'Audio',
  'Clothing',
  'Footwear',
  'Bags & Accessories',
  'Home & Kitchen',
];

export const ATTRIBUTE_SUGGESTIONS = ['Brand', 'Color', 'Size', 'RAM', 'Storage', 'Material', 'Weight', 'Connectivity'];

export const seedProducts = [
  {
    id: 'p-1001', name: 'AeroBook Pro 14', sku: 'LAP-AERO-14', category: 'Laptops', price: 1499, stock: 24, status: 'published',
    description: '', attributes: [
      { key: 'Brand', value: 'Aero' }, { key: 'RAM', value: '16GB' }, { key: 'Storage', value: '512GB SSD' }, { key: 'Color', value: 'Space Grey' },
    ],
    syncStatus: 'synced', wooId: 101, createdAt: daysAgo(30), updatedAt: daysAgo(6),
  },
  {
    id: 'p-1002', name: 'Nova X5 Smartphone', sku: 'PHN-NOVA-X5', category: 'Smartphones', price: 799, stock: 58, status: 'published',
    description: '', attributes: [
      { key: 'Brand', value: 'Nova' }, { key: 'RAM', value: '8GB' }, { key: 'Storage', value: '256GB' }, { key: 'Color', value: 'Midnight Blue' },
    ],
    syncStatus: 'synced', wooId: 102, createdAt: daysAgo(28), updatedAt: daysAgo(5),
  },
  {
    id: 'p-1003', name: 'Classic Cotton T-Shirt', sku: 'TSH-COT-BLK-M', category: 'Clothing', price: 24.99, stock: 210, status: 'published',
    description: '', attributes: [
      { key: 'Brand', value: 'Threadly' }, { key: 'Color', value: 'Black' }, { key: 'Size', value: 'M' }, { key: 'Material', value: '100% Organic Cotton' },
    ],
    syncStatus: 'synced', wooId: 103, createdAt: daysAgo(25), updatedAt: daysAgo(25),
  },
  {
    id: 'p-1004', name: 'TrailRunner Running Shoes', sku: 'SHO-TRL-42', category: 'Footwear', price: 119.5, stock: 37, status: 'published',
    description: '', attributes: [
      { key: 'Brand', value: 'StridePro' }, { key: 'Color', value: 'Volt Green' }, { key: 'Size', value: 'EU 42' }, { key: 'Material', value: 'Breathable Mesh' },
    ],
    syncStatus: 'pending', wooId: null, createdAt: daysAgo(4), updatedAt: daysAgo(1),
  },
  {
    id: 'p-1005', name: 'SoundWave ANC Headphones', sku: 'AUD-SW-ANC', category: 'Audio', price: 249, stock: 12, status: 'published',
    description: '', attributes: [
      { key: 'Brand', value: 'SoundWave' }, { key: 'Color', value: 'Matte Black' }, { key: 'Connectivity', value: 'Bluetooth 5.3' }, { key: 'Weight', value: '254 g' },
    ],
    syncStatus: 'synced', wooId: 104, createdAt: daysAgo(20), updatedAt: daysAgo(10),
  },
  {
    id: 'p-1006', name: 'Urban Commuter Backpack', sku: 'BAG-URB-25L', category: 'Bags & Accessories', price: 79, stock: 0, status: 'draft',
    description: '', attributes: [
      { key: 'Brand', value: 'Voyager' }, { key: 'Color', value: 'Charcoal' }, { key: 'Material', value: 'Recycled Nylon' }, { key: 'Size', value: '25L' },
    ],
    syncStatus: 'pending', wooId: null, createdAt: daysAgo(3), updatedAt: daysAgo(3),
  },
  {
    id: 'p-1007', name: 'Pixel-Fit Smartwatch', sku: 'ACC-PXF-W2', category: 'Bags & Accessories', price: 199, stock: 41, status: 'published',
    description: '', attributes: [
      { key: 'Brand', value: 'Pixel-Fit' }, { key: 'Color', value: 'Silver' }, { key: 'Connectivity', value: 'Bluetooth / Wi-Fi' },
    ],
    syncStatus: 'synced', wooId: 105, createdAt: daysAgo(15), updatedAt: daysAgo(15),
  },
  {
    id: 'p-1008', name: 'Ceramic Pour-Over Coffee Set', sku: 'HOM-CER-POS', category: 'Home & Kitchen', price: 54, stock: 66, status: 'published',
    description: '', attributes: [
      { key: 'Brand', value: 'Brewhaus' }, { key: 'Material', value: 'Glazed Ceramic' }, { key: 'Color', value: 'Sand White' },
    ],
    syncStatus: 'pending', wooId: null, createdAt: daysAgo(2), updatedAt: daysAgo(2),
  },
  {
    id: 'p-1009', name: 'Slim Fit Denim Jacket', sku: 'JKT-DNM-L', category: 'Clothing', price: 89.9, stock: 8, status: 'published',
    description: '', attributes: [
      { key: 'Brand', value: 'Threadly' }, { key: 'Color', value: 'Indigo' }, { key: 'Size', value: 'L' }, { key: 'Material', value: 'Stretch Denim' },
    ],
    syncStatus: 'synced', wooId: 106, createdAt: daysAgo(12), updatedAt: daysAgo(12),
  },
  {
    id: 'p-1010', name: 'UltraSlim 13 Notebook', sku: 'LAP-ULS-13', category: 'Laptops', price: 1099, stock: 5, status: 'draft',
    description: '', attributes: [
      { key: 'Brand', value: 'Aero' }, { key: 'RAM', value: '8GB' }, { key: 'Storage', value: '256GB SSD' }, { key: 'Weight', value: '1.1 kg' },
    ],
    syncStatus: 'pending', wooId: null, createdAt: daysAgo(1), updatedAt: daysAgo(1),
  },
];

// Pre-existing remote-only product so that "Fetch from WooCommerce" demonstrates an import.
export const seedRemoteOnly = [
  {
    wooId: 900, name: 'Wireless Ergonomic Mouse', sku: 'ACC-MSE-ERG', category: 'Bags & Accessories', price: 39, stock: 90, status: 'published',
    description: 'Ergonomic wireless mouse with silent clicks.',
    attributes: [{ key: 'Brand', value: 'Clickr' }, { key: 'Color', value: 'Graphite' }, { key: 'Connectivity', value: '2.4 GHz USB' }],
  },
];
