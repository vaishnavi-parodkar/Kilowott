/**
 * Maps between the PIM's internal product model and the WooCommerce REST (v3) product schema.
 * Keeping this in one file means the rest of the app never sees Woo-specific field names.
 */

export function toWooPayload(product) {
  return {
    name: product.name,
    sku: product.sku,
    type: 'simple',
    status: product.status === 'published' ? 'publish' : 'draft',
    regular_price: Number(product.price).toFixed(2),
    manage_stock: true,
    stock_quantity: Number(product.stock),
    stock_status: Number(product.stock) > 0 ? 'instock' : 'outofstock',
    description: product.description || '',
    categories: [{ name: product.category }],
    attributes: (product.attributes || []).map((a, i) => ({
      name: a.key,
      position: i,
      visible: true,
      variation: false,
      options: [a.value],
    })),
  };
}

export function fromWooProduct(woo) {
  return {
    wooId: woo.id,
    name: woo.name,
    sku: woo.sku,
    category: woo.categories?.[0]?.name || 'Uncategorized',
    price: Number(woo.regular_price) || 0,
    stock: Number(woo.stock_quantity) || 0,
    status: woo.status === 'publish' ? 'published' : 'draft',
    description: woo.description || '',
    attributes: (woo.attributes || []).map((a) => ({ key: a.name, value: (a.options || []).join(', ') })),
  };
}
