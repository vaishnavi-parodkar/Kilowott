import { describe, it, expect } from 'vitest';
import { queryProducts } from '../utils/productQuery.js';
import { generateProductDescription, AI_SERVICE_INFO } from '../services/mockAiService.js';
import { seedProducts } from '../data/seedProducts.js';

describe('queryProducts', () => {
  it('searches by name, SKU and attribute value', () => {
    expect(queryProducts(seedProducts, { search: 'aerobook' })).toHaveLength(1);
    expect(queryProducts(seedProducts, { search: 'SHO-TRL' })).toHaveLength(1);
    expect(queryProducts(seedProducts, { search: 'threadly' })).toHaveLength(2);
  });

  it('filters by category and sorts by price', () => {
    const laptops = queryProducts(seedProducts, { category: 'Laptops', sort: 'price-asc' });
    expect(laptops.map((p) => p.sku)).toEqual(['LAP-ULS-13', 'LAP-AERO-14']);
  });
});

describe('seed data', () => {
  it('has 8-10+ products with differing attribute sets', () => {
    expect(seedProducts.length).toBeGreaterThanOrEqual(8);
    const shapes = new Set(seedProducts.map((p) => p.attributes.map((a) => a.key).sort().join(',')));
    expect(shapes.size).toBeGreaterThan(3);
  });
});

describe('mock AI service', () => {
  it('is clearly labelled as mock', () => {
    expect(AI_SERVICE_INFO.mock).toBe(true);
  });

  it('generates a description that depends on name, category and attributes', async () => {
    const text = await generateProductDescription(
      { name: 'AeroBook Pro', category: 'Laptops', attributes: [{ key: 'RAM', value: '16GB' }, { key: 'Brand', value: 'Aero' }] },
      { latencyMs: 0 },
    );
    expect(text).toContain('AeroBook Pro');
    expect(text).toContain('laptop');
    expect(text).toContain('16GB');
    expect(text).toContain('Aero');

    const shoes = await generateProductDescription({ name: 'Runner', category: 'Footwear', attributes: [] }, { latencyMs: 0 });
    expect(shoes).toContain('pair of shoes');
    expect(shoes).not.toEqual(text);
  });

  it('varies phrasing on regenerate and rejects an empty name', async () => {
    const input = { name: 'Thing', category: 'Audio', attributes: [] };
    const a = await generateProductDescription(input, { latencyMs: 0, variant: 0 });
    const b = await generateProductDescription(input, { latencyMs: 0, variant: 1 });
    expect(a).not.toEqual(b);
    await expect(generateProductDescription({ name: ' ', category: 'Audio' }, { latencyMs: 0 })).rejects.toThrow(/product name/);
  });
});
