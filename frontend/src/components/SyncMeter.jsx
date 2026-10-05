/** Segmented bar showing how much of the catalog is synced / pending / failed. */
export default function SyncMeter({ summary }) {
  const { synced, pending, failed, total } = summary;
  const denominator = Math.max(total, synced + pending + failed, 1);
  const pct = (n) => `${(n / denominator) * 100}%`;
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${synced} synced, ${pending} pending, ${failed} failed`}>
        <div className="bg-emerald-500" style={{ width: pct(synced) }} />
        <div className="bg-amber-400" style={{ width: pct(pending) }} />
        <div className="bg-red-500" style={{ width: pct(failed) }} />
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><dt className="text-slate-500">Synced</dt><dd className="font-semibold text-slate-900">{synced}</dd></div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><dt className="text-slate-500">Pending</dt><dd className="font-semibold text-slate-900">{pending}</dd></div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /><dt className="text-slate-500">Failed</dt><dd className="font-semibold text-slate-900">{failed}</dd></div>
      </dl>
    </div>
  );
}
