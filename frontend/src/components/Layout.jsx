import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { DashboardIcon, BoxIcon, SyncIcon, MenuIcon, XIcon } from './icons.jsx';
import { useProducts } from '../hooks/ProductsContext.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/products', label: 'Products', icon: BoxIcon },
  { to: '/sync', label: 'WooCommerce sync', icon: SyncIcon },
];

function Sidebar({ onNavigate }) {
  const { summary } = useProducts();
  const attention = summary.pending + summary.failed;
  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <img src="/favicon.svg" alt="" className="h-8 w-8" />
        <div>
          <p className="text-base font-semibold leading-tight text-white">Woo PIM</p>
          <p className="text-xs text-slate-400">Product information</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}
          >
            <Icon className="h-5 w-5" />
            <span className="flex-1">{label}</span>
            {to === '/sync' && attention > 0 && (
              <span className="rounded-full bg-amber-400 px-1.5 text-xs font-semibold text-slate-900" aria-label={`${attention} items need syncing`}>{attention}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 rounded-md bg-white/5 p-3 text-xs text-slate-400">
        <p className="font-medium text-slate-200">Simulated store</p>
        <p className="mt-1">WooCommerce is mocked locally. No credentials needed.</p>
      </div>
    </div>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block"><Sidebar /></aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="h-7 w-7" />
          <span className="font-semibold text-slate-900">Woo PIM</span>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100" aria-label="Open navigation menu">
          <MenuIcon />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">
            <Sidebar onNavigate={() => setOpen(false)} />
            <button type="button" onClick={() => setOpen(false)} className="absolute right-2 top-4 rounded-md p-1 text-slate-300 hover:bg-white/10" aria-label="Close navigation menu">
              <XIcon />
            </button>
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
