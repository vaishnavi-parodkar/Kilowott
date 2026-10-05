import { describe, it, expect } from 'vitest';
import { mergeSyncResult } from '../utils/syncMerge.js';

const p = (id, extra = {}) => ({ id, name: id, updatedAt: '2026-01-01T00:00:00Z', syncStatus: 'pending', wooId: null, ...extra });

describe('mergeSyncResult', () => {
  it('applies sync results to untouched products', () => {
    const snapshot = [p('a')];
    const result = [p('a', { syncStatus: 'synced', wooId: 7 })];
    expect(mergeSyncResult(snapshot, snapshot, result)).toEqual(result);
  });

  it('keeps edits made during the sync and leaves them pending', () => {
    const snapshot = [p('a')];
    const current = [p('a', { name: 'edited', updatedAt: '2026-02-02T00:00:00Z' })];
    const result = [p('a', { syncStatus: 'synced', wooId: 7 })];
    const [merged] = mergeSyncResult(snapshot, current, result);
    expect(merged).toMatchObject({ name: 'edited', syncStatus: 'pending', wooId: 7 });
  });

  it('keeps products added during the sync, drops deleted ones and appends imports', () => {
    const snapshot = [p('a'), p('b')];
    const current = [p('a'), p('new')]; // b deleted, "new" added mid-sync
    const result = [p('a', { syncStatus: 'synced' }), p('b', { syncStatus: 'synced' }), p('imported', { syncStatus: 'synced' })];
    const merged = mergeSyncResult(snapshot, current, result);
    expect(merged.map((x) => x.id)).toEqual(['a', 'new', 'imported']);
  });
});
