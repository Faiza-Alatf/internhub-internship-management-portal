import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Spinner } from './Feedback';

const WIDTHS = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' };

export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-ink-950/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative flex max-h-[92vh] w-full ${WIDTHS[size]} animate-pop-in flex-col rounded-t-2xl bg-white shadow-pop dark:bg-ink-900 sm:rounded-2xl`}>
        <header className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-4 dark:border-ink-800">
          <div>
            <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-50">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="icon-btn -mr-2" aria-label="Close dialog"><X size={18} /></button>
        </header>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-ink-100 px-6 py-4 dark:border-ink-800">{footer}</footer>}
      </div>
    </div>
  );
}

// Confirmation before destructive actions
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading = false }) {
  return (
    <Modal
      open={open} onClose={loading ? () => {} : onClose} size="sm" title={title}
      footer={(
        <>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>{loading && <Spinner />}{confirmLabel}</button>
        </>
      )}
    >
      <div className="flex gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10"><AlertTriangle size={20} /></span>
        <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-300">{message}</p>
      </div>
    </Modal>
  );
}
