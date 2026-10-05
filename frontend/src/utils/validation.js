export const PRODUCT_STATUSES = ['published', 'draft'];
const SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\-_]*$/;

/**
 * Validate a product form payload.
 * @param {object} product
 * @param {{ existingProducts?: object[], editingId?: string|null }} [options]
 * @returns {{ valid: boolean, errors: Record<string,string> }}
 */
export function validateProduct(product, { existingProducts = [], editingId = null } = {}) {
  const errors = {};
  const name = (product.name ?? '').trim();
  const sku = (product.sku ?? '').trim();

  if (!name) errors.name = 'Name is required.';
  else if (name.length < 3) errors.name = 'Name must be at least 3 characters.';
  else if (name.length > 120) errors.name = 'Name must be 120 characters or fewer.';

  if (!sku) errors.sku = 'SKU is required.';
  else if (!SKU_PATTERN.test(sku)) errors.sku = 'SKU may only contain letters, numbers, "-" and "_".';
  else if (existingProducts.some((p) => p.id !== editingId && p.sku.toLowerCase() === sku.toLowerCase())) {
    errors.sku = 'This SKU is already used by another product.';
  }

  if (!(product.category ?? '').trim()) errors.category = 'Category is required.';

  if (product.price === '' || product.price === null || product.price === undefined) {
    errors.price = 'Price is required.';
  } else if (Number.isNaN(Number(product.price)) || Number(product.price) < 0) {
    errors.price = 'Price must be a number of 0 or more.';
  }

  if (product.stock === '' || product.stock === null || product.stock === undefined) {
    errors.stock = 'Stock is required.';
  } else if (!Number.isInteger(Number(product.stock)) || Number(product.stock) < 0) {
    errors.stock = 'Stock must be a whole number of 0 or more.';
  }

  if (!PRODUCT_STATUSES.includes(product.status)) errors.status = 'Status must be published or draft.';

  const attrs = product.attributes ?? [];
  const seen = new Set();
  attrs.forEach((a, i) => {
    const key = (a.key ?? '').trim();
    const value = (a.value ?? '').trim();
    if (!key && !value) return; // blank rows are ignored on save
    if (!key) errors[`attributes.${i}`] = 'Attribute name is required.';
    else if (!value) errors[`attributes.${i}`] = `Value for "${key}" is required.`;
    else if (seen.has(key.toLowerCase())) errors[`attributes.${i}`] = `Attribute "${key}" is duplicated.`;
    seen.add(key.toLowerCase());
  });

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Normalise form values into a clean product payload. */
export function normalizeProduct(form) {
  return {
    ...form,
    name: form.name.trim(),
    sku: form.sku.trim(),
    category: form.category.trim(),
    price: Math.round(Number(form.price) * 100) / 100,
    stock: Number(form.stock),
    description: (form.description ?? '').trim(),
    attributes: (form.attributes ?? [])
      .map((a) => ({ key: a.key.trim(), value: a.value.trim() }))
      .filter((a) => a.key && a.value),
  };
}
