import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadCatalog, saveCatalog, resetCatalog } from '../services/catalogStore.js';
import { wooCommerceService, getSyncSummary } from '../services/wooCommerceService.js';
import { mergeSyncResult } from '../utils/syncMerge.js';
import { normalizeProduct } from '../utils/validation.js';
import { makeId } from '../utils/makeId.js';
import { useToast } from './useToast.jsx';

const ProductsContext = createContext(null);

const idleSync = { running: false, percent: 0, label: '', result: null };

export function ProductsProvider({ children }) {
  const toast = useToast();
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [pendingDeletes, setPendingDeletes] = useState([]);
  const [syncHistory, setSyncHistory] = useState([]);
  const [sync, setSync] = useState(idleSync);

  const latest = useRef({ products, pendingDeletes });
  latest.current = { products, pendingDeletes };
  const syncing = useRef(false);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await loadCatalog();
      setProducts(data.products);
      setPendingDeletes(data.pendingDeletes);
      setSyncHistory(data.syncHistory);
      setStatus('ready');
    } catch (err) {
      setError(err.message || 'Failed to load the catalog.');
      setStatus('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Persist on every change once the initial load has finished.
  useEffect(() => {
    if (status !== 'ready') return;
    saveCatalog({ products, pendingDeletes, syncHistory }).catch((err) => {
      toast.error(`Could not save changes: ${err.message || 'storage error'}`);
    });
  }, [status, products, pendingDeletes, syncHistory, toast]);

  const addProduct = useCallback((form) => {
    const ts = new Date().toISOString();
    const product = {
      ...normalizeProduct(form),
      id: makeId('p'), wooId: null, syncStatus: 'pending', syncError: null, createdAt: ts, updatedAt: ts,
    };
    setProducts((prev) => [product, ...prev]);
    return product;
  }, []);

  const updateProduct = useCallback((id, form) => {
    const ts = new Date().toISOString();
    setProducts((prev) => prev.map((p) => (p.id === id
      ? { ...p, ...normalizeProduct(form), id, wooId: p.wooId, syncStatus: 'pending', syncError: null, updatedAt: ts }
      : p)));
  }, []);

  const deleteProduct = useCallback((id) => {
    const target = latest.current.products.find((p) => p.id === id);
    if (!target) return;
    if (target.wooId) setPendingDeletes((prev) => [...prev, { wooId: target.wooId, name: target.name }]);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const runSync = useCallback(async () => {
    if (syncing.current) return null;
    syncing.current = true;
    setSync({ running: true, percent: 0, label: 'Connecting to WooCommerce…', result: null });
    const snapshot = latest.current;
    try {
      const out = await wooCommerceService.syncProducts(snapshot.products, {
        pendingDeletes: snapshot.pendingDeletes,
        onProgress: (p) => setSync((s) => ({ ...s, percent: p.percent, label: p.label })),
      });
      setProducts((current) => mergeSyncResult(snapshot.products, current, out.products));
      setPendingDeletes((current) => [
        ...current.filter((d) => !snapshot.pendingDeletes.some((s) => s.wooId === d.wooId)),
        ...out.pendingDeletes,
      ]);
      setSyncHistory((h) => [out.run, ...h].slice(0, 20));
      setSync({ running: false, percent: 100, label: '', result: out.run });
      if (out.run.status === 'success') toast.success(`Sync complete: ${out.run.synced} change${out.run.synced === 1 ? '' : 's'} applied.`);
      else if (out.run.status === 'partial') toast.error(`Sync finished with ${out.run.failed} failure${out.run.failed === 1 ? '' : 's'}.`);
      else toast.error('Sync failed. Check the details on the Sync page.');
      return out.run;
    } catch (err) {
      const run = { id: makeId('sync'), status: 'failed', synced: 0, failed: 1, errors: [{ name: 'Sync', message: err.message }], startedAt: new Date().toISOString(), finishedAt: new Date().toISOString() };
      setSyncHistory((h) => [run, ...h].slice(0, 20));
      setSync({ running: false, percent: 0, label: '', result: run });
      toast.error(`Sync failed: ${err.message}`);
      return run;
    } finally {
      syncing.current = false;
    }
  }, [toast]);

  const clearSyncResult = useCallback(() => setSync((s) => ({ ...s, result: null })), []);

  const resetDemoData = useCallback(async () => {
    try {
      await resetCatalog();
    } catch (err) {
      toast.error(`Reset failed: ${err.message}`);
      return;
    }
    setSync(idleSync);
    await load();
    toast.success('Sample data restored.');
  }, [load, toast]);

  const summary = useMemo(() => getSyncSummary(products, pendingDeletes), [products, pendingDeletes]);
  const lastSync = syncHistory[0] ?? null;

  const value = useMemo(() => ({
    status, error, reload: load,
    products, pendingDeletes, syncHistory, lastSync, summary, sync,
    addProduct, updateProduct, deleteProduct, runSync, clearSyncResult, resetDemoData,
  }), [status, error, load, products, pendingDeletes, syncHistory, lastSync, summary, sync,
    addProduct, updateProduct, deleteProduct, runSync, clearSyncResult, resetDemoData]);

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used inside <ProductsProvider>');
  return ctx;
}
