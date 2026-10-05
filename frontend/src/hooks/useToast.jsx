import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { makeId } from '../utils/makeId.js';
import { CheckIcon, AlertIcon, XIcon } from '../components/icons.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((type, message) => {
    const id = makeId('t');
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const api = useMemo(() => ({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 left-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 lg:left-72" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-lg border bg-white p-3 shadow-lg ${t.type === 'success' ? 'border-emerald-200' : 'border-red-200'}`}
          >
            <span className={`mt-0.5 ${t.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
              {t.type === 'success' ? <CheckIcon className="h-5 w-5" /> : <AlertIcon className="h-5 w-5" />}
            </span>
            <p className="flex-1 text-sm text-slate-700">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss notification">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
