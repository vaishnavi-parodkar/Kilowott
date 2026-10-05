/**
 * MOCK AI SERVICE — no API key, no network.
 *
 * Demonstrates an AI-assisted ("agentic") workflow: given a product's name, category and
 * attributes, it composes a marketing description. It is a deterministic, template-based
 * generator that simulates the latency of an LLM call. The function signature is intentionally
 * the same shape a real LLM-backed service would use, so it can be swapped for one later.
 */

export const AI_SERVICE_INFO = {
  name: 'Mock AI Service',
  mock: true,
  note: 'Template-based simulation. No real AI model or API key is used.',
};

const CATEGORY_PROFILES = {
  Laptops: { noun: 'laptop', audience: 'professionals, students and creators', benefit: 'powers through demanding work wherever you are' },
  Smartphones: { noun: 'smartphone', audience: 'people who live on their phone', benefit: 'keeps you connected, capturing and creating all day' },
  Audio: { noun: 'audio device', audience: 'music lovers and remote workers', benefit: 'delivers immersive sound that stays comfortable for hours' },
  Clothing: { noun: 'wardrobe staple', audience: 'anyone building an everyday look', benefit: 'pairs effortlessly with the rest of your wardrobe' },
  Footwear: { noun: 'pair of shoes', audience: 'active people on the move', benefit: 'keeps every step supported and comfortable' },
  'Bags & Accessories': { noun: 'everyday accessory', audience: 'commuters and travellers', benefit: 'keeps your essentials organised and within reach' },
  'Home & Kitchen': { noun: 'home essential', audience: 'home cooks and design lovers', benefit: 'brings quality and style to your daily routine' },
};

const DEFAULT_PROFILE = { noun: 'product', audience: 'discerning shoppers', benefit: 'adds lasting value to your day' };

const INTROS = [
  (n, p) => `Meet the ${n} — a ${p.noun} designed for ${p.audience}.`,
  (n, p) => `The ${n} is the ${p.noun} that ${p.benefit}.`,
  (n, p) => `Looking for a ${p.noun} you can rely on? The ${n} delivers.`,
];

const attr = (attributes, key) => attributes.find((a) => a.key.toLowerCase() === key.toLowerCase())?.value;

function describeAttributes(attributes) {
  const sentences = [];
  const brand = attr(attributes, 'Brand');
  const ram = attr(attributes, 'RAM');
  const storage = attr(attributes, 'Storage');
  const color = attr(attributes, 'Color');
  const size = attr(attributes, 'Size');
  const material = attr(attributes, 'Material');
  const connectivity = attr(attributes, 'Connectivity');
  const weight = attr(attributes, 'Weight');

  if (brand) sentences.push(`Crafted by ${brand}, it is built with quality and attention to detail.`);
  if (ram || storage) {
    const specs = [ram && `${ram} of RAM`, storage && `${storage} of storage`].filter(Boolean).join(' and ');
    sentences.push(`With ${specs}, it handles multitasking, apps and files with ease.`);
  }
  if (material) sentences.push(`Made from ${material}, it balances durability with a premium feel.`);
  if (color || size) {
    const parts = [color && `${color} finish`, size && `size ${size}`].filter(Boolean).join(' in ');
    sentences.push(`Available in a ${parts}.`);
  }
  if (connectivity) sentences.push(`Stay connected through ${connectivity}.`);
  if (weight) sentences.push(`At just ${weight}, it is easy to carry and use.`);

  // Any custom attribute not covered above still gets a mention.
  const known = ['brand', 'ram', 'storage', 'color', 'size', 'material', 'connectivity', 'weight'];
  attributes
    .filter((a) => !known.includes(a.key.toLowerCase()))
    .forEach((a) => sentences.push(`${a.key}: ${a.value}.`));

  return sentences;
}

/**
 * @param {{ name: string, category: string, attributes: {key:string,value:string}[] }} input
 * @param {{ variant?: number, latencyMs?: number }} [options] variant lets the user "regenerate" a different phrasing
 * @returns {Promise<string>}
 */
export async function generateProductDescription({ name, category, attributes = [] }, { variant = 0, latencyMs = 900 } = {}) {
  if (!name?.trim()) throw new Error('Enter a product name first so the AI has something to describe.');
  if (latencyMs > 0) await new Promise((r) => setTimeout(r, latencyMs));

  const profile = CATEGORY_PROFILES[category] || DEFAULT_PROFILE;
  const cleanAttrs = attributes.filter((a) => a.key?.trim() && a.value?.trim());
  const intro = INTROS[variant % INTROS.length](name.trim(), profile);
  const body = describeAttributes(cleanAttrs);
  const closing = `Order the ${name.trim()} today and enjoy a ${profile.noun} that ${profile.benefit}.`;
  return [intro, ...body, closing].join(' ');
}
