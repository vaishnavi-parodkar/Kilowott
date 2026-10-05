import { Spinner } from './ui.jsx';

export default function SyncProgress({ sync }) {
  return (
    <div className="rounded-md border border-brand-200 bg-brand-50 p-3" role="status" aria-live="polite">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-brand-700"><Spinner /> Synchronizing…</span>
        <span className="tabular-nums text-brand-700">{sync.percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-brand-600 transition-all duration-300" style={{ width: `${sync.percent}%` }} />
      </div>
      <p className="mt-2 truncate text-xs text-brand-700">{sync.label}</p>
    </div>
  );
}
