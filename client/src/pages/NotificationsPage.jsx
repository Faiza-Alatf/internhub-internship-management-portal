import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '../context/NotificationsContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui/Cards';
import { EmptyState, TableSkeleton } from '../components/ui/Feedback';
import { timeAgo } from '../utils/format';

export default function NotificationsPage() {
  const { items, unread, loading, markRead, markAllRead } = useNotifications();
  const toast = useToast();
  const run = async (fn) => { try { await fn(); } catch (e) { toast.error(e.message); } };

  return (
    <>
      <PageHeader title="Notifications" subtitle={unread ? `You have ${unread} unread notification${unread > 1 ? 's' : ''}.` : 'You are all caught up.'}
        actions={<button className="btn-secondary" disabled={!unread} onClick={() => run(markAllRead)}><CheckCheck size={16} /> Mark all as read</button>} />
      <div className="card">
        {loading ? <TableSkeleton rows={5} cols={3} /> : !items.length ? <EmptyState icon={Bell} title="No notifications" description="Task assignments, evaluations and attendance updates will show up here." /> : (
          <ul>
            {items.map((n) => (
              <li key={n.notificationId} className={`flex items-start gap-4 border-b border-ink-100 px-5 py-4 last:border-0 dark:border-ink-800 ${n.isRead ? '' : 'bg-brand-50/50 dark:bg-brand-500/5'}`}>
                <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-ink-300 dark:bg-ink-600' : 'bg-brand-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900 dark:text-ink-50">{n.title}</p>
                  <p className="mt-0.5 text-sm text-ink-600 dark:text-ink-300">{n.message}</p>
                  <p className="mt-1 text-xs text-ink-400">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <button className="btn-ghost !px-2.5 !py-1 text-xs" onClick={() => run(() => markRead(n.notificationId))}>Mark as read</button>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
