const GRADIENTS = {
  brand: 'from-indigo-500 to-violet-500',
  blue: 'from-sky-500 to-blue-600',
  green: 'from-emerald-500 to-teal-500',
  teal: 'from-teal-500 to-cyan-500',
  amber: 'from-amber-400 to-orange-500',
  red: 'from-rose-500 to-red-500',
  violet: 'from-violet-500 to-fuchsia-500',
};

export function StatCard({ icon: Icon, label, value, hint, tone = 'brand' }) {
  return (
    <div className="card card-hover group flex items-start gap-4 p-5">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform duration-200 group-hover:scale-110 ${GRADIENTS[tone]}`}><Icon size={20} /></span>
      <div className="min-w-0">
        <p className="text-sm text-ink-500">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">{value}</p>
        {hint && <p className="mt-0.5 truncate text-xs text-ink-500">{hint}</p>}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// A titled card for page sections
export function Section({ title, subtitle, actions, children, className = '', bodyClass = 'p-5' }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4 dark:border-ink-800">
          <div>
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">{title}</h2>
            {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}