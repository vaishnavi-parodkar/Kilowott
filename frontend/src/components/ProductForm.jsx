import { useMemo, useState } from 'react';
import Modal from './Modal.jsx';
import AttributeEditor from './AttributeEditor.jsx';
import { Alert, Button, Field, Spinner, inputClass } from './ui.jsx';
import { SparklesIcon } from './icons.jsx';
import { CATEGORIES } from '../data/seedProducts.js';
import { validateProduct } from '../utils/validation.js';
import { generateProductDescription, AI_SERVICE_INFO } from '../services/mockAiService.js';

const EMPTY = { name: '', sku: '', category: '', price: '', stock: '', status: 'draft', description: '', attributes: [] };

export default function ProductForm({ product, products, onSubmit, onClose }) {
  const editing = !!product;
  const [form, setForm] = useState(() => (product
    ? { ...product, price: String(product.price), stock: String(product.stock), attributes: product.attributes.map((a) => ({ ...a })) }
    : EMPTY));
  const [submitted, setSubmitted] = useState(false);
  const [aiState, setAiState] = useState({ loading: false, error: null, runs: 0, generated: false });

  const categories = useMemo(
    () => Array.from(new Set([...CATEGORIES, ...products.map((p) => p.category)])).sort(),
    [products],
  );

  const { errors } = validateProduct(form, { existingProducts: products, editingId: product?.id ?? null });
  const visibleErrors = submitted ? errors : {};

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length === 0) onSubmit(form);
  };

  const generate = async () => {
    setAiState((s) => ({ ...s, loading: true, error: null }));
    try {
      const text = await generateProductDescription(form, { variant: aiState.runs });
      setForm((f) => ({ ...f, description: text }));
      setAiState((s) => ({ loading: false, error: null, runs: s.runs + 1, generated: true }));
    } catch (err) {
      setAiState((s) => ({ ...s, loading: false, error: err.message }));
    }
  };

  return (
    <Modal
      title={editing ? 'Edit product' : 'Add product'}
      size="lg"
      onClose={onClose}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="product-form">{editing ? 'Save changes' : 'Save product'}</Button>
        </>
      )}
    >
      <form id="product-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        {submitted && Object.keys(errors).length > 0 && (
          <Alert tone="error" title="Please fix the highlighted fields">The product was not saved yet.</Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="pf-name" label="Product name" error={visibleErrors.name}>
            <input id="pf-name" value={form.name} onChange={set('name')} className={inputClass(!!visibleErrors.name)} placeholder="e.g. AeroBook Pro 14" autoFocus />
          </Field>
          <Field id="pf-sku" label="SKU" error={visibleErrors.sku} hint="Unique. Letters, numbers, - and _ only.">
            <input id="pf-sku" value={form.sku} onChange={set('sku')} className={inputClass(!!visibleErrors.sku)} placeholder="e.g. LAP-AERO-14" />
          </Field>
          <Field id="pf-category" label="Category" error={visibleErrors.category} hint="Pick one or type a new category.">
            <input id="pf-category" list="category-options" value={form.category} onChange={set('category')} className={inputClass(!!visibleErrors.category)} placeholder="e.g. Laptops" />
            <datalist id="category-options">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field id="pf-status" label="Status" error={visibleErrors.status}>
            <select id="pf-status" value={form.status} onChange={set('status')} className={inputClass(!!visibleErrors.status)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
          <Field id="pf-price" label="Price (USD)" error={visibleErrors.price}>
            <input id="pf-price" type="number" inputMode="decimal" min="0" step="0.01" value={form.price} onChange={set('price')} className={inputClass(!!visibleErrors.price)} placeholder="0.00" />
          </Field>
          <Field id="pf-stock" label="Stock" error={visibleErrors.stock}>
            <input id="pf-stock" type="number" inputMode="numeric" min="0" step="1" value={form.stock} onChange={set('stock')} className={inputClass(!!visibleErrors.stock)} placeholder="0" />
          </Field>
        </div>

        <AttributeEditor
          attributes={form.attributes}
          errors={visibleErrors}
          onChange={(attributes) => setForm((f) => ({ ...f, attributes }))}
        />

        <div>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="pf-description" className="text-sm font-medium text-slate-700">Description</label>
            <Button size="sm" variant="secondary" onClick={generate} disabled={aiState.loading}>
              {aiState.loading ? <Spinner className="h-3.5 w-3.5" /> : <SparklesIcon className="h-4 w-4" />}
              {aiState.loading ? 'Generating…' : aiState.generated ? 'Regenerate with AI' : 'Generate with AI'}
            </Button>
          </div>
          <textarea
            id="pf-description"
            rows={5}
            value={form.description}
            onChange={set('description')}
            className={inputClass(false)}
            placeholder="Write a description, or generate one from the name, category and attributes."
          />
          {aiState.error && <p className="mt-1 text-xs text-red-600" role="alert">{aiState.error}</p>}
          <p className="mt-1 text-xs text-slate-500">
            <span className="mr-1 rounded bg-brand-50 px-1.5 py-0.5 font-medium text-brand-700">{AI_SERVICE_INFO.name}</span>
            {AI_SERVICE_INFO.note} Review and edit the text before saving.
          </p>
        </div>
      </form>
    </Modal>
  );
}
