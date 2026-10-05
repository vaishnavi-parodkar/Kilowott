import { describe, it, expect } from 'vitest';
import { validateProduct, normalizeProduct } from '../utils/validation.js';

const validProduct = () => ({
  name: 'Test Laptop',
  sku: 'LAP-TEST-01',
  category: 'Laptops',
  price: '999.99',
  stock: '10',
  status: 'published',
  attributes: [{ key: 'Brand', value: 'Acme' }],
});

describe('validateProduct', () => {
  it('accepts a valid product', () => {
    const { valid, errors } = validateProduct(validProduct());
    expect(valid).toBe(true);
    expect(errors).toEqual({});
  });

  it('requires name, SKU, category, price and stock', () => {
    const { valid, errors } = validateProduct({ name: '', sku: '', category: '', price: '', stock: '', status: 'draft', attributes: [] });
    expect(valid).toBe(false);
    expect(Object.keys(errors).sort()).toEqual(['category', 'name', 'price', 'sku', 'stock']);
  });

  it('rejects names that are too short', () => {
    expect(validateProduct({ ...validProduct(), name: 'ab' }).errors.name).toMatch(/at least 3/);
  });

  it('rejects SKUs with invalid characters', () => {
    expect(validateProduct({ ...validProduct(), sku: 'bad sku!' }).errors.sku).toMatch(/letters, numbers/);
  });

  it('rejects duplicate SKUs (case-insensitive) but allows the product being edited', () => {
    const existing = [{ id: 'a', sku: 'LAP-TEST-01' }];
    expect(validateProduct({ ...validProduct(), sku: 'lap-test-01' }, { existingProducts: existing }).errors.sku).toMatch(/already used/);
    expect(validateProduct(validProduct(), { existingProducts: existing, editingId: 'a' }).valid).toBe(true);
  });

  it('rejects negative or non-numeric prices', () => {
    expect(validateProduct({ ...validProduct(), price: '-1' }).errors.price).toBeDefined();
    expect(validateProduct({ ...validProduct(), price: 'abc' }).errors.price).toBeDefined();
    expect(validateProduct({ ...validProduct(), price: '0' }).valid).toBe(true);
  });

  it('rejects negative or fractional stock', () => {
    expect(validateProduct({ ...validProduct(), stock: '-5' }).errors.stock).toBeDefined();
    expect(validateProduct({ ...validProduct(), stock: '2.5' }).errors.stock).toBeDefined();
  });

  it('rejects unknown statuses', () => {
    expect(validateProduct({ ...validProduct(), status: 'archived' }).errors.status).toBeDefined();
  });

  it('validates dynamic attributes', () => {
    const missingValue = validateProduct({ ...validProduct(), attributes: [{ key: 'Color', value: '' }] });
    expect(missingValue.errors['attributes.0']).toMatch(/Value for "Color"/);

    const missingKey = validateProduct({ ...validProduct(), attributes: [{ key: '', value: 'Red' }] });
    expect(missingKey.errors['attributes.0']).toMatch(/name is required/);

    const duplicate = validateProduct({ ...validProduct(), attributes: [{ key: 'Color', value: 'Red' }, { key: 'color', value: 'Blue' }] });
    expect(duplicate.errors['attributes.1']).toMatch(/duplicated/);
  });

  it('ignores completely blank attribute rows', () => {
    expect(validateProduct({ ...validProduct(), attributes: [{ key: '', value: '' }] }).valid).toBe(true);
  });
});

describe('normalizeProduct', () => {
  it('trims strings, converts numbers and drops blank attributes', () => {
    const result = normalizeProduct({
      ...validProduct(),
      name: '  Test Laptop  ',
      price: '19.999',
      attributes: [{ key: ' Brand ', value: ' Acme ' }, { key: '', value: '' }],
    });
    expect(result.name).toBe('Test Laptop');
    expect(result.price).toBe(20);
    expect(result.stock).toBe(10);
    expect(result.attributes).toEqual([{ key: 'Brand', value: 'Acme' }]);
  });
});
