import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { NotificationsProvider } from '../context/NotificationsContext';

// Sidebar + top navbar + page content. On mobile the sidebar becomes a slide-in drawer;
// on desktop it can be collapsed to icons (the choice is remembered).
export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('ip_sidebar') === 'collapsed'; } catch { return false; } });
  const { pathname } = useLocation();
  useEffect(() => setMenuOpen(false), [pathname]);

  const toggle = () => setCollapsed((c) => {
    try { localStorage.setItem('ip_sidebar', c ? 'open' : 'collapsed'); } catch { /* ignore */ }
    return !c;
  });

  return (
    <NotificationsProvider>
      <div className={`min-h-screen transition-[padding] duration-300 ${collapsed ? 'lg:pl-[4.75rem]' : 'lg:pl-64'}`}>
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} collapsed={collapsed} onToggle={toggle} />
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="px-4 py-6 sm:px-8">
          <div key={pathname} className="mx-auto max-w-7xl animate-page"><Outlet /></div>
        </main>
      </div>
    </NotificationsProvider>
  );
}