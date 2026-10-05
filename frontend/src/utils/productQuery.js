export const SORT_OPTIONS = [
  { value: 'updated-desc', label: 'Recently updated' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'price-asc', label: 'Price (low → high)' },
  { value: 'price-desc', label: 'Price (high → low)' },
  { value: 'stock-asc', label: 'Stock (low → high)' },
  { value: 'stock-desc', label: 'Stock (high → low)' },
];

/** Pure search + filter + sort helper used by the catalog page (unit-tested). */
export function queryProducts(products, { search = '', category = 'all', sort = 'updated-desc' } = {}) {
  const q = search.trim().toLowerCase();
  let result = products.filter((p) => {
    if (category !== 'all' && p.category !== category) return false;
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.attributes.some((a) => a.value.toLowerCase().includes(q))
    );
  });
  const [field, dir] = sort.split('-');
  const factor = dir === 'desc' ? -1 : 1;
  result = [...result].sort((a, b) => {
    switch (field) {
      case 'name': return a.name.localeCompare(b.name) * factor;
      case 'price': return (a.price - b.price) * factor;
      case 'stock': return (a.stock - b.stock) * factor;
      default: return (new Date(a.updatedAt) - new Date(b.updatedAt)) * factor;
    }
  });
  return result;
}
