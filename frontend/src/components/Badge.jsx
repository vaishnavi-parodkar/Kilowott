const TONES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  purple: 'bg-brand-50 text-brand-700 ring-brand-500/20',
};

export function Badge({ tone = 'slate', children, className = '' }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

export const StatusBadge = ({ status }) => (
  <Badge tone={status === 'published' ? 'green' : 'slate'}>{status === 'published' ? 'Published' : 'Draft'}</Badge>
);

const SYNC = { synced: ['green', 'Synced'], pending: ['amber', 'Pending'], failed: ['red', 'Failed'] };
export const SyncBadge = ({ status }) => {
  const [tone, label] = SYNC[status] ?? SYNC.pending;
  return <Badge tone={tone}>{label}</Badge>;
};

export const RunStatusBadge = ({ status }) => {
  const map = { success: ['green', 'Success'], partial: ['amber', 'Partial'], failed: ['red', 'Failed'] };
  const [tone, label] = map[status] ?? map.failed;
  return <Badge tone={tone}>{label}</Badge>;
};

export function StockCell({ stock }) {
  if (stock === 0) return <span className="font-medium text-red-600">Out of stock</span>;
  if (stock <= 10) return <span className="font-medium text-amber-700">{stock} · low</span>;
  return <span className="text-slate-700">{stock}</span>;
}
