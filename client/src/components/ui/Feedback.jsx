import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

export const Spinner = ({ size = 16 }) => <Loader2 size={size} className="animate-spin" aria-hidden="true" />;

export const Skeleton = ({ className = '' }) => <div className={`skeleton ${className}`} aria-hidden="true" />;

export function TableSkeleton({ rows = 6, cols = 6 }) {
  return (
    <div role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-ink-100 px-4 py-4 dark:border-ink-800">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          {Array.from({ length: cols - 1 }).map((__, c) => <Skeleton key={c} className="h-4 flex-1" />)}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 4, height = 'h-28' }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => <Skeleton key={i} className={`${height} rounded-xl`} />)}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="relative mb-5 h-32 w-40">
        <svg viewBox="0 0 160 128" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <ellipse cx="80" cy="114" rx="56" ry="9" className="fill-ink-100 dark:fill-ink-800" />
          <rect x="34" y="30" width="92" height="72" rx="12" strokeWidth="2" className="fill-brand-50 stroke-brand-200 dark:fill-brand-500/10 dark:stroke-brand-500/30" />
          <rect x="48" y="48" width="44" height="6" rx="3" className="fill-brand-200 dark:fill-brand-500/30" />
          <rect x="48" y="62" width="64" height="6" rx="3" className="fill-ink-200 dark:fill-ink-700" />
          <rect x="48" y="76" width="30" height="6" rx="3" className="fill-ink-200 dark:fill-ink-700" />
          <circle cx="128" cy="30" r="5" className="fill-teal-400" />
          <circle cx="26" cy="54" r="4" className="fill-violet-300" />
          <circle cx="140" cy="86" r="3" className="fill-brand-300" />
        </svg>
        <span className="absolute right-4 top-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-lift"><Icon size={22} /></span>
      </div>
      <h3 className="text-base font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10"><AlertCircle size={22} /></span>
      <h3 className="text-base font-semibold text-ink-900 dark:text-ink-50">Could not load this data</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-500">{error?.message || 'Something went wrong.'}</p>
      {onRetry && <button className="btn-secondary mt-5" onClick={onRetry}>Try again</button>}
    </div>
  );
}