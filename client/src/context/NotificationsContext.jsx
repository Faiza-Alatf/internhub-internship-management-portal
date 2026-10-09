import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { notificationsApi } from '../services/resources';

const NotificationsContext = createContext(null);
export const useNotifications = () => useContext(NotificationsContext);

// Loads notifications from SQL Server via the API and refreshes every 30 seconds
export function NotificationsProvider({ children }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const data = await notificationsApi.list();
      setItems(data.items);
      setUnread(data.unreadCount);
    } catch { /* the bell simply keeps its last state */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    reload();
    const id = setInterval(reload, 30000);
    return () => clearInterval(id);
  }, [reload]);

  const markRead = useCallback(async (id) => {
    await notificationsApi.markRead(id);
    setItems((list) => list.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    setItems((list) => list.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }, []);

  const value = useMemo(() => ({ items, unread, loading, reload, markRead, markAllRead }), [items, unread, loading, reload, markRead, markAllRead]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
