import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, Building2, CalendarCheck, ChevronsLeft, ChevronsRight, ClipboardCheck, GraduationCap, KanbanSquare, LayoutDashboard, LogOut, Settings, UserCircle, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './ui/Avatar';

// Menu items per role
function menuFor(user) {
  const common = [
    { to: '/tasks', label: user.role === 'INTERN' ? 'My Tasks' : 'Tasks', icon: KanbanSquare },
    { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/evaluations', label: user.role === 'INTERN' ? 'My Feedback' : 'Evaluations', icon: ClipboardCheck },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];
  const dashboard = { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true };
  if (user.role === 'ADMIN') {
    return [dashboard, { to: '/interns', label: 'Interns', icon: GraduationCap }, { to: '/mentors', label: 'Mentors', icon: Users }, { to: '/departments', label: 'Departments', icon: Building2 }, ...common];
  }
  if (user.role === 'MENTOR') return [dashboard, { to: '/interns', label: 'My Interns', icon: GraduationCap }, ...common];
  return [dashboard, { to: '/profile', label: 'My Profile', icon: UserCircle }, ...common];
}

// "collapsed" only affects desktop (lg). On mobile the sidebar is always a full-width drawer.
export default function Sidebar({ open, onClose, collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = menuFor(user);
  const hide = collapsed ? 'lg:hidden' : '';
  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <>
      {open && <div className="fixed inset-0 z-30 animate-fade-in bg-ink-950/50 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-100 bg-white transition-all duration-300 dark:border-ink-800 dark:bg-ink-900 lg:translate-x-0 ${collapsed ? 'lg:w-[4.75rem]' : 'lg:w-64'} ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`flex h-16 items-center justify-between px-4 ${collapsed ? 'lg:justify-center' : ''}`}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 text-white shadow-lift"><GraduationCap size={19} /></span>
            <span className={`text-lg font-semibold tracking-tight text-ink-900 dark:text-white ${hide}`}>Intern<span className="text-brand-600 dark:text-brand-400">Hub</span></span>
          </div>
          <button className="icon-btn lg:hidden" onClick={onClose} aria-label="Close menu"><X size={18} /></button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-3" aria-label="Main navigation">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} title={collapsed ? label : undefined}
              className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${collapsed ? 'lg:justify-center' : ''} ${isActive ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-lift' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white'}`}>
              <Icon size={18} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className={hide}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-100 p-3 dark:border-ink-800">
          <div className={`mb-2 flex items-center gap-3 rounded-xl bg-ink-50 p-2 dark:bg-ink-800/60 ${collapsed ? 'lg:justify-center' : ''}`}>
            <Avatar name={user.fullName} size="sm" />
            <div className={`min-w-0 ${hide}`}>
              <p className="truncate text-sm font-medium text-ink-900 dark:text-white">{user.fullName}</p>
              <p className="truncate text-xs capitalize text-ink-500">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button onClick={handleLogout} title={collapsed ? 'Logout' : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-ink-300 dark:hover:bg-rose-500/10 ${collapsed ? 'lg:justify-center' : ''}`}>
            <LogOut size={18} className="shrink-0" /> <span className={hide}>Logout</span>
          </button>
          <button onClick={onToggle} className={`mt-1 hidden w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-500 transition-colors hover:bg-ink-100 dark:hover:bg-ink-800 lg:flex ${collapsed ? 'justify-center' : ''}`} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronsRight size={18} /> : <><ChevronsLeft size={18} /> Collapse</>}
          </button>
        </div>
      </aside>
    </>
  );
}