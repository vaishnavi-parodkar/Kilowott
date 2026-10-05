import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, EmptyState, PageHeader, Spinner, inputClass } from '../components/ui.jsx';
import StatCard from '../components/StatCard.jsx';
import SyncProgress from '../components/SyncProgress.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { CatalogError } from '../components/PageStates.jsx';
import { RunStatusBadge, SyncBadge } from '../components/Badge.jsx';
import { SyncIcon } from '../components/icons.jsx';
import { useProducts } from '../hooks/ProductsContext.jsx';
import { fetchProducts } from '../services/wooCommerceService.js';
import { loadSettings, updateSettings as saveSettings, defaultSettings } from '../services/wooSettings.js';
import { formatCurrency, formatDateTime, timeAgo } from '../utils/format.js';

function ResultAlert({ run, onDismiss }) {
  const tone = run.status === 'success' ? 'success' : run.status === 'partial' ? 'warning' : 'error';
  const title = run.status === 'success' ? 'Sync completed successfully' : run.status === 'partial' ? 'Sync completed with errors' : 'Sync failed';
  const parts = [
    run.created && `${run.created} created`, run.updated && `${run.updated} updated`,
    run.deleted && `${run.deleted} deleted`, run.imported && `${run.imported} imported`,
  ].filter(Boolean);
  return (
    <Alert tone={tone} title={title} onDismiss={onDismiss}>
      <p>{parts.length ? parts.join(', ') + '.' : run.failed ? 'No changes could be applied.' : 'Everything was already up to date.'}</p>
      {run.errors?.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {run.errors.slice(0, 5).map((e, i) => <li key={i}><strong>{e.name}:</strong> {e.message}</li>)}
          {run.errors.length > 5 && <li>…and {run.errors.length - 5} more</li>}
        </ul>
      )}
    </Alert>
  );
}

function RemoteStore() {
  const [state, setState] = useState({ loading: false, error: null, items: null });
  const load = async () => {
    setState({ loading: true, error: null, items: null });
    try {
      setState({ loading: false, error: null, items: await fetchProducts() });
    } catch (err) {
      setState({ loading: false, error: err.message, items: null });
    }
  };
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Remote store (simulated)</h2>
          <p className="text-sm text-slate-500">Calls <code className="rounded bg-slate-100 px-1 text-xs">fetchProducts()</code> to inspect what the mock WooCommerce store currently holds.</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={state.loading}>
          {state.loading && <Spinner />} Fetch from WooCommerce
        </Button>
      </div>
      {state.error && <div className="p-4"><Alert tone="error" title="Could not reach the store">{state.error}</Alert></div>}
      {state.items && (state.items.length === 0 ? (
        <EmptyState title="The remote store is empty" message="Run a sync to push your products." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm" aria-label="Remote products">
            <thead className="bg-slate-50 text-slate-500"><tr>{['Woo ID', 'Name', 'SKU', 'Price', 'Stock'].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {state.items.map((p) => (
                <tr key={p.wooId}><td className="px-4 py-2.5 text-slate-500">#{p.wooId}</td><td className="px-4 py-2.5 font-medium text-slate-900">{p.name}</td><td className="px-4 py-2.5 font-mono text-xs">{p.sku}</td><td className="px-4 py-2.5">{formatCurrency(p.price)}</td><td className="px-4 py-2.5">{p.stock}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {!state.items && !state.error && !state.loading && (
        <p className="px-5 py-4 text-sm text-slate-500">Nothing fetched yet.</p>
      )}
    </Card>
  );
}

export default function SyncPage() {
  const { status, products, pendingDeletes, summary, lastSync, syncHistory, sync, runSync, clearSyncResult, resetDemoData } = useProducts();
  const [settings, setSettings] = useState(defaultSettings);
  useEffect(() => { loadSettings().then(setSettings).catch(() => {}); }, []);
  const [confirmReset, setConfirmReset] = useState(false);

  const updateSettings = (patch) => {
    setSettings((s) => ({ ...s, ...patch })); // optimistic; the backend value wins once it answers
    saveSettings(patch).then(setSettings).catch(() => loadSettings().then(setSettings).catch(() => {}));
  };

  const queue = useMemo(() => products.filter((p) => p.syncStatus !== 'synced'), [products]);
  const loading = status === 'loading';

  if (status === 'error') return <><PageHeader title="WooCommerce sync" /><CatalogError /></>;

  return (
    <>
      <PageHeader
        title="WooCommerce sync"
        description="Push catalog changes to the store and import products created there. WooCommerce is simulated by the backend."
        actions={(
          <>
            <Button variant="secondary" onClick={() => setConfirmReset(true)}>Reset sample data</Button>
            <Button onClick={runSync} disabled={loading || sync.running}>
              {sync.running ? <Spinner /> : <SyncIcon className="h-4 w-4" />} {sync.running ? 'Syncing…' : 'Sync now'}
            </Button>
          </>
        )}
      />

      <div className="space-y-4">
        {sync.running && <SyncProgress sync={sync} />}
        {sync.result && !sync.running && <ResultAlert run={sync.result} onDismiss={clearSyncResult} />}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Last sync" value={lastSync ? timeAgo(lastSync.finishedAt) : 'Never'} hint={lastSync ? formatDateTime(lastSync.finishedAt) : undefined} loading={loading} />
        <StatCard label="Synced" value={summary.synced} tone="text-emerald-700" loading={loading} />
        <StatCard label="Failed" value={summary.failed} tone={summary.failed ? 'text-red-700' : 'text-slate-900'} loading={loading} />
        <StatCard label="Pending" value={summary.pending} hint={pendingDeletes.length ? `incl. ${pendingDeletes.length} queued deletion${pendingDeletes.length === 1 ? '' : 's'}` : undefined} tone={summary.pending ? 'text-amber-700' : 'text-slate-900'} loading={loading} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-semibold text-slate-900">Waiting to sync</h2></div>
          {queue.length === 0 && pendingDeletes.length === 0 ? (
            <EmptyState title="Nothing to sync" message="All products match the store. Edit or add a product to create new pending changes." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {queue.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.sku} · {p.wooId ? 'will update store' : 'will create in store'}</p>
                    {p.syncStatus === 'failed' && p.syncError && <p className="mt-1 text-xs text-red-600">{p.syncError}</p>}
                  </div>
                  <SyncBadge status={p.syncStatus} />
                </li>
              ))}
              {pendingDeletes.map((d) => (
                <li key={`del-${d.wooId}`} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div><p className="text-sm font-medium text-slate-900">{d.name}</p><p className="text-xs text-slate-500">Will be deleted from the store (#{d.wooId})</p></div>
                  <SyncBadge status="pending" />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-900">Connection simulator</h2>
          <p className="mt-1 text-sm text-slate-500">Test how the integration behaves when the store misbehaves.</p>
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600" checked={settings.simulateOutage} onChange={(e) => updateSettings({ simulateOutage: e.target.checked })} />
            <span><span className="font-medium text-slate-900">Simulate store outage</span><br /><span className="text-slate-500">Every API call returns 503 until switched off.</span></span>
          </label>
          <div className="mt-4">
            <label htmlFor="latency" className="mb-1 block text-sm font-medium text-slate-700">API latency</label>
            <select id="latency" value={settings.latencyMs} onChange={(e) => updateSettings({ latencyMs: Number(e.target.value) })} className={inputClass(false)}>
              <option value={0}>Instant</option>
              <option value={450}>Normal (~450 ms)</option>
              <option value={1200}>Slow (~1.2 s)</option>
            </select>
          </div>
          <p className="mt-4 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            Tip: a SKU containing <code className="font-mono">FAIL</code> is rejected by the mock store, so you can see a partial failure.
          </p>
        </Card>
      </div>

      <div className="mt-6"><RemoteStore /></div>

      <Card className="mt-6">
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-semibold text-slate-900">Sync history</h2></div>
        {syncHistory.length === 0 ? (
          <EmptyState title="No syncs yet" message="Run your first sync to see it listed here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm" aria-label="Sync history">
              <thead className="bg-slate-50 text-slate-500"><tr>{['When', 'Result', 'Synced', 'Failed', 'Details'].map((h) => <th key={h} className="px-5 py-2.5 font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {syncHistory.map((r) => (
                  <tr key={r.id} data-testid="history-row">
                    <td className="px-5 py-3 text-slate-700">{formatDateTime(r.finishedAt)}</td>
                    <td className="px-5 py-3"><RunStatusBadge status={r.status} /></td>
                    <td className="px-5 py-3 font-medium text-slate-900">{r.synced}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{r.failed}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {[r.created && `${r.created} created`, r.updated && `${r.updated} updated`, r.deleted && `${r.deleted} deleted`, r.imported && `${r.imported} imported`].filter(Boolean).join(' · ') || (r.errors?.[0]?.message ?? '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {confirmReset && (
        <ConfirmDialog
          title="Reset sample data"
          danger
          confirmLabel="Reset data"
          message="This removes all your changes and restores the original sample catalog, sync history and simulated store."
          onConfirm={() => { setConfirmReset(false); resetDemoData(); }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </>
  );
}
