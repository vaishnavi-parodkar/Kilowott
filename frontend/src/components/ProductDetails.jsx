import Modal from './Modal.jsx';
import { Button } from './ui.jsx';
import { StatusBadge, SyncBadge } from './Badge.jsx';
import { formatCurrency, formatDateTime } from '../utils/format.js';

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export default function ProductDetails({ product, onEdit, onClose }) {
  return (
    <Modal
      title={product.name}
      size="lg"
      onClose={onClose}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={() => onEdit(product)}>Edit product</Button>
        </>
      )}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <dl className="divide-y divide-slate-100">
          <Row label="SKU">{product.sku}</Row>
          <Row label="Category">{product.category}</Row>
          <Row label="Price">{formatCurrency(product.price)}</Row>
          <Row label="Stock">{product.stock}</Row>
          <Row label="Status"><StatusBadge status={product.status} /></Row>
          <Row label="WooCommerce sync"><SyncBadge status={product.syncStatus} /></Row>
          <Row label="WooCommerce ID">{product.wooId ?? 'Not created yet'}</Row>
          <Row label="Last updated">{formatDateTime(product.updatedAt)}</Row>
        </dl>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Attributes</h3>
          {product.attributes.length === 0 ? (
            <p className="text-sm text-slate-500">This product has no attributes.</p>
          ) : (
            <dl className="divide-y divide-slate-100 rounded-md border border-slate-200 px-3">
              {product.attributes.map((a) => <Row key={a.key} label={a.key}>{a.value}</Row>)}
            </dl>
          )}
        </div>
      </div>

      {product.syncStatus === 'failed' && product.syncError && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">Last sync error: {product.syncError}</p>
      )}

      <div className="mt-5">
        <h3 className="mb-1 text-sm font-semibold text-slate-900">Description</h3>
        {product.description
          ? <p className="text-sm leading-relaxed text-slate-700">{product.description}</p>
          : <p className="text-sm text-slate-500">No description yet. Edit the product to write one or generate it with the mock AI.</p>}
      </div>
    </Modal>
  );
}
