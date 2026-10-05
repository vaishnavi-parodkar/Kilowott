import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState, PageHeader, Skeleton, inputClass } from '../components/ui.jsx';
import { StatusBadge, SyncBadge, StockCell, Badge } from '../components/Badge.jsx';
import { CatalogError } from '../components/PageStates.jsx';
import ProductForm from '../components/ProductForm.jsx';
import ProductDetails from '../components/ProductDetails.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { GridIcon, ListIcon, PlusIcon, SearchIcon } from '../components/icons.jsx';
import { useProducts } from '../hooks/ProductsContext.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { queryProducts, SORT_OPTIONS } from '../utils/productQuery.js';
import { formatCurrency } from '../utils/format.js';

const isSmallScreen = () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches;

function RowActions({ product, onView, onEdit, onDelete }) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={() => onView(product)} aria-label={`View ${product.name}`}>View</Button>
      <Button variant="ghost" size="sm" onClick={() => onEdit(product)} aria-label={`Edit ${product.name}`}>Edit</Button>
      <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => onDelete(product)} aria-label={`Delete ${product.name}`}>Delete</Button>
    </div>
  );
}

function ProductTable({ items, ...actions }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
          <tr>
            {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Status', 'Sync'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}
            <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((p) => (
            <tr key={p.id} data-testid="product-row" className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{p.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{p.attributes.length} attribute{p.attributes.length === 1 ? '' : 's'}</p>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.sku}</td>
              <td className="px-4 py-3 text-slate-700">{p.category}</td>
              <td className="px-4 py-3 text-slate-700">{formatCurrency(p.price)}</td>
              <td className="px-4 py-3"><StockCell stock={p.stock} /></td>
              <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
              <td className="px-4 py-3"><SyncBadge status={p.syncStatus} /></td>
              <td className="px-4 py-3"><RowActions product={p} {...actions} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductCards({ items, ...actions }) {
  return (
    <ul className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((p) => (
        <li key={p.id} data-testid="product-card" className="flex min-w-0 flex-col rounded-lg border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">{p.name}</p>
              <p className="font-mono text-xs text-slate-500">{p.sku}</p>
            </div>
            <StatusBadge status={p.status} />
          </div>
          <p className="mt-3 text-xs text-slate-500">{p.category}</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-semibold text-slate-900">{formatCurrency(p.price)}</span>
            <span className="text-sm"><StockCell stock={p.stock} /></span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {p.attributes.slice(0, 3).map((a) => <Badge key={a.key}>{a.key}: {a.value}</Badge>)}
            {p.attributes.length > 3 && <Badge>+{p.attributes.length - 3}</Badge>}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <SyncBadge status={p.syncStatus} />
            <RowActions product={p} {...actions} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Catalog() {
  const { status, products, addProduct, updateProduct, deleteProduct } = useProducts();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('updated-desc');
  const [view, setView] = useState(() => (isSmallScreen() ? 'cards' : 'table'));

  const [formState, setFormState] = useState(null); // { product?: Product }
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Allow other pages to deep-link to "Add product" (/products?new=1).
  useEffect(() => {
    if (params.get('new') === '1') {
      setFormState({});
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))).sort(), [products]);
  const items = useMemo(() => queryProducts(products, { search, category, sort }), [products, search, category, sort]);
  const filtersActive = search.trim() !== '' || category !== 'all';

  const handleSubmit = (form) => {
    if (formState?.product) {
      updateProduct(formState.product.id, form);
      toast.success(`"${form.name.trim()}" updated. It will sync on the next run.`);
    } else {
      addProduct(form);
      toast.success(`"${form.name.trim()}" added to the catalog.`);
    }
    setFormState(null);
  };

  const confirmDelete = () => {
    deleteProduct(deleting.id);
    toast.success(`"${deleting.name}" deleted.${deleting.wooId ? ' Removal from WooCommerce is queued for the next sync.' : ''}`);
    setDeleting(null);
  };

  const actions = {
    onView: setViewing,
    onEdit: (p) => { setViewing(null); setFormState({ product: p }); },
    onDelete: setDeleting,
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage your product catalog and attributes."
        actions={<Button onClick={() => setFormState({})}><PlusIcon className="h-4 w-4" /> Add product</Button>}
      />

      {status === 'error' ? <CatalogError /> : (
        <Card>
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
            <div className="relative min-w-[200px] flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="search"
                aria-label="Search products"
                placeholder="Search by name, SKU, category or attribute"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputClass(false)} pl-9`}
              />
            </div>
            <select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass(false)} w-auto`}>
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select aria-label="Sort products" value={sort} onChange={(e) => setSort(e.target.value)} className={`${inputClass(false)} w-auto`}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="flex rounded-md ring-1 ring-inset ring-slate-300" role="group" aria-label="Change layout">
              <button type="button" onClick={() => setView('table')} aria-pressed={view === 'table'} aria-label="Table view" className={`rounded-l-md p-2 ${view === 'table' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'}`}><ListIcon className="h-4 w-4" /></button>
              <button type="button" onClick={() => setView('cards')} aria-pressed={view === 'cards'} aria-label="Card view" className={`rounded-r-md p-2 ${view === 'cards' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'}`}><GridIcon className="h-4 w-4" /></button>
            </div>
          </div>

          {status === 'loading' ? (
            <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading products">
              {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState title="Your catalog is empty" message="Add your first product to get started.">
              <Button onClick={() => setFormState({})}><PlusIcon className="h-4 w-4" /> Add product</Button>
            </EmptyState>
          ) : items.length === 0 ? (
            <EmptyState title="No products match your filters" message="Try a different search term or category.">
              <Button variant="secondary" onClick={() => { setSearch(''); setCategory('all'); }}>Clear filters</Button>
            </EmptyState>
          ) : view === 'table' ? (
            <ProductTable items={items} {...actions} />
          ) : (
            <ProductCards items={items} {...actions} />
          )}

          {status === 'ready' && products.length > 0 && (
            <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500" aria-live="polite">
              Showing {items.length} of {products.length} product{products.length === 1 ? '' : 's'}{filtersActive ? ' (filtered)' : ''}
            </p>
          )}
        </Card>
      )}

      {formState && (
        <ProductForm product={formState.product} products={products} onSubmit={handleSubmit} onClose={() => setFormState(null)} />
      )}
      {viewing && <ProductDetails product={viewing} onEdit={actions.onEdit} onClose={() => setViewing(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete product"
          danger
          confirmLabel="Delete product"
          message={`Delete "${deleting.name}"? This cannot be undone.${deleting.wooId ? ' It will also be removed from WooCommerce on the next sync.' : ''}`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
