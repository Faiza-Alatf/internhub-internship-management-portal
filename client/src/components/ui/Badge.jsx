const TONES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20',
  teal: 'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-400/10 dark:text-teal-300 dark:ring-teal-400/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20',
  slate: 'bg-ink-100 text-ink-600 ring-ink-500/20 dark:bg-ink-700/50 dark:text-ink-200 dark:ring-ink-400/20',
};
const DOTS = { green: 'bg-emerald-500', blue: 'bg-sky-500', amber: 'bg-amber-500', red: 'bg-rose-500', violet: 'bg-violet-500', teal: 'bg-teal-500', slate: 'bg-ink-400' };

// Which colour each status / priority word gets
export const STATUS_TONES = {
  Active: 'teal', Completed: 'green', 'On Hold': 'amber', Terminated: 'red',
  Pending: 'amber', 'In Progress': 'blue', Overdue: 'red',
  Low: 'slate', Medium: 'blue', High: 'amber', Critical: 'red',
  Present: 'green', Absent: 'red', Late: 'amber', Leave: 'violet',
};

export default function Badge({ children, tone = 'slate', dot = true, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOTS[tone]}`} />}
      {children}
    </span>
  );
}

export const StatusBadge = ({ value, dot = true }) => <Badge tone={STATUS_TONES[value] || 'slate'} dot={dot}>{value}</Badge>;