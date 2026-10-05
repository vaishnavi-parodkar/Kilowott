import { useMemo } from 'react';
import { PageHeader, Card, LinkButton, Button, Skeleton, EmptyState, Spinner } from '../components/ui.jsx';
import StatCard from '../components/StatCard.jsx';
import SyncMeter from '../components/SyncMeter.jsx';
import SyncProgress from '../components/SyncProgress.jsx';
import { CatalogError } from '../components/PageStates.jsx';
import { SyncBadge } from '../components/Badge.jsx';
import { PlusIcon, SyncIcon } from '../components/icons.jsx';
import { useProducts } from '../hooks/ProductsContext.jsx';
import { formatCurrency, formatDateTime, timeAgo } from '../utils/format.js';

export default function Dashboard() {
  const { status, products, summary, lastSync, sync, runSync } = useProducts();
  const loading = status === 'loading';

  const recent = useMemo(
    () => [...products].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5),
    [products],
  );
  const categories = useMemo(() => {
    const counts = {};
    products.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [products]);

  if (status === 'error') return <><PageHeader title="Dashboard" /><CatalogError /></>;

  const needsSync = summary.pending + summary.failed;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your product catalog and its WooCommerce sync status."
        actions={<LinkButton to="/products?new=1" variant="primary"><PlusIcon className="h-4 w-4" /> Add product</LinkButton>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total products" value={summary.total} loading={loading} />
        <StatCard label="Categories" value={categories.length} loading={loading} />
        <StatCard label="Synced products" value={summary.synced} tone="text-emerald-700" loading={loading} />
        <StatCard label="Pending sync" value={summary.pending} hint={summary.failed ? `${summary.failed} failed` : undefined} tone={summary.pending ? 'text-amber-700' : 'text-slate-900'} loading={loading} />
        <div className="col-span-2 lg:col-span-1">
          <StatCard label="Last synchronization" value={lastSync ? timeAgo(lastSync.finishedAt) : 'Never'} hint={lastSync ? formatDateTime(lastSync.finishedAt) : 'Run your first sync'} loading={loading} />
        </div>
      </div>

      <Card className="mt-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">WooCommerce sync health</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {loading ? 'Loading…' : needsSync === 0 ? 'Everything is in sync with the store.' : `${needsSync} item${needsSync === 1 ? '' : 's'} waiting to be pushed to the store.`}
            </p>
          </div>
          <div className="flex gap-2">
            <LinkButton to="/sync" variant="secondary">View sync details</LinkButton>
            <Button onClick={runSync} disabled={loading || sync.running}>
              {sync.running ? <Spinner /> : <SyncIcon className="h-4 w-4" />} Sync now
            </Button>
          </div>
        </div>
        <div className="mt-4">
          {loading ? <Skeleton className="h-3 w-full" /> : sync.running ? <SyncProgress sync={sync} /> : <SyncMeter summary={summary} />}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Recent products</h2>
            <LinkButton to="/products" variant="ghost" size="sm">View all</LinkButton>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : recent.length === 0 ? (
            <EmptyState title="No products yet" message="Add your first product to start building the catalog.">
              <LinkButton to="/products?new=1" variant="primary">Add product</LinkButton>
            </EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                    <p className="truncate text-xs text-slate-500">{p.sku} · {p.category} · updated {timeAgo(p.updatedAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-sm text-slate-700 sm:inline">{formatCurrency(p.price)}</span>
                    <SyncBadge status={p.syncStatus} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-semibold text-slate-900">Products by category</h2></div>
          {loading ? (
            <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
          ) : categories.length === 0 ? (
            <EmptyState title="No categories" message="Categories appear as soon as you add products." />
          ) : (
            <ul className="space-y-3 p-5">
              {categories.map(([name, count]) => (
                <li key={name}>
                  <div className="mb-1 flex justify-between text-sm"><span className="text-slate-700">{name}</span><span className="font-medium text-slate-900">{count}</span></div>
                  <div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${(count / summary.total) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
