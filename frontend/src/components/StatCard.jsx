import { Card, Skeleton } from './ui.jsx';

export default function StatCard({ label, value, hint, loading, tone = 'text-slate-900' }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-500">{label}</p>
      {loading ? <Skeleton className="mt-2 h-8 w-16" /> : <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>}
      {hint && !loading && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}
