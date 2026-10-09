import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const STYLES = {
  success: { icon: CheckCircle2, color: 'text-emerald-500' },
  error: { icon: AlertCircle, color: 'text-rose-500' },
  info: { icon: Info, color: 'text-sky-500' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const push = useCallback((type, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((list) => [...list.slice(-3), { id, type, message }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const api = useMemo(() => ({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map(({ id, type, message }) => {
          const { icon: Icon, color } = STYLES[type];
          return (
            <div key={id} role="status" className="pointer-events-auto flex animate-slide-in items-start gap-3 rounded-xl border border-ink-100 bg-white p-3.5 shadow-pop dark:border-ink-700 dark:bg-ink-800">
              <Icon size={20} className={`mt-0.5 shrink-0 ${color}`} />
              <p className="flex-1 text-sm text-ink-800 dark:text-ink-100">{message}</p>
              <button onClick={() => dismiss(id)} className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-100" aria-label="Dismiss"><X size={16} /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
