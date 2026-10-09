import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import { useNotifications } from '../context/NotificationsContext';
import { useToast } from '../context/ToastContext';
import useClickOutside from '../hooks/useClickOutside';
import { timeAgo } from '../utils/format';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { items, unread, markRead, markAllRead } = useNotifications();
  const toast = useToast();
  useClickOutside(ref, () => setOpen(false), open);

  const handleMarkAll = async () => { try { await markAllRead(); } catch (e) { toast.error(e.message); } };
  const handleClick = async (n) => { if (!n.isRead) { try { await markRead(n.notificationId); } catch (e) { toast.error(e.message); } } };

  return (
    <div className="relative" ref={ref}>
      <button className="icon-btn !h-9 !w-9" onClick={() => setOpen((o) => !o)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}>
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] animate-drop-in overflow-hidden rounded-xl border border-ink-100 bg-white shadow-pop dark:border-ink-700 dark:bg-ink-900">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-ink-800">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">Notifications</h3>
            <button onClick={handleMarkAll} disabled={!unread} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline disabled:text-ink-400 disabled:no-underline">
              <CheckCheck size={14} /> Mark all read
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.slice(0, 6).map((n) => (
              <li key={n.notificationId}>
                <button onClick={() => handleClick(n)} className="flex w-full gap-3 border-b border-ink-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-800/60">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-brand-500'}`} />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${n.isRead ? 'text-ink-600 dark:text-ink-300' : 'font-medium text-ink-900 dark:text-ink-50'}`}>{n.title}</span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-ink-500">{n.message}</span>
                    <span className="mt-1 block text-[11px] text-ink-400">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
            {!items.length && (
              <li className="flex flex-col items-center px-4 py-10 text-center text-sm text-ink-500"><BellOff className="mb-2" size={22} />You are all caught up.</li>
            )}
          </ul>
          <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t border-ink-100 px-4 py-2.5 text-center text-sm font-medium text-brand-600 hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-800/60">View all notifications</Link>
        </div>
      )}
    </div>
  );
}
