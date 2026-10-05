/**
 * Merge the result of a sync run back into the live catalog.
 * Edits made while the sync was running are preserved (and stay "pending"),
 * deletions made during the run stay deleted, and imported products are appended.
 */
export function mergeSyncResult(snapshot, current, result) {
  const snapById = new Map(snapshot.map((p) => [p.id, p]));
  const resultById = new Map(result.map((p) => [p.id, p]));
  const merged = [];

  current.forEach((cur) => {
    const snap = snapById.get(cur.id);
    const res = resultById.get(cur.id);
    if (!snap || !res) {
      merged.push(cur); // created while syncing → remains pending for the next run
    } else if (cur.updatedAt !== snap.updatedAt) {
      merged.push({ ...cur, wooId: res.wooId ?? cur.wooId, syncStatus: 'pending' });
    } else {
      merged.push(res);
    }
  });

  result.forEach((r) => {
    if (!snapById.has(r.id)) merged.push(r); // imported from WooCommerce
  });
  return merged;
}
