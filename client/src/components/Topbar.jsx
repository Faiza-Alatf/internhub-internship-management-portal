import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Search, Settings, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useClickOutside from '../hooks/useClickOutside';
import Avatar from './ui/Avatar';
import NotificationBell from './NotificationBell';

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  const isIntern = user.role === 'INTERN';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  // Interns search their tasks; admins and mentors search interns (the pages read ?q= from the URL)
  const search = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(`${isIntern ? '/tasks' : '/interns'}${term ? `?q=${encodeURIComponent(term)}` : ''}`);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-ink-100 bg-white/80 px-4 backdrop-blur dark:border-ink-800 dark:bg-ink-950/80 sm:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button className="icon-btn !h-9 !w-9 lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button>
        <form onSubmit={search} role="search" className="relative hidden w-full max-w-md sm:block">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input !rounded-xl !bg-ink-50 pl-10 dark:!bg-ink-900" placeholder={isIntern ? 'Search my tasks...' : 'Search interns by name or email...'} aria-label="Search" />
        </form>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="mr-2 hidden text-sm text-ink-500 xl:block">{today}</span>
        <button className="icon-btn !h-9 !w-9" onClick={toggleTheme} aria-label="Toggle dark mode">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
        <NotificationBell />
        <div className="relative ml-1" ref={ref}>
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-ink-100 dark:hover:bg-ink-800" aria-expanded={open}>
            <Avatar name={user.fullName} size="sm" />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-ink-900 dark:text-ink-50">{user.fullName}</span>
              <span className="block text-xs capitalize leading-tight text-ink-500">{user.role.toLowerCase()}</span>
            </span>
          </button>
          {open && (
            <div className="absolute right-0 z-40 mt-2 w-56 animate-drop-in overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-pop dark:border-ink-700 dark:bg-ink-900">
              <div className="border-b border-ink-100 px-4 py-2.5 dark:border-ink-800"><p className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">{user.fullName}</p><p className="truncate text-xs text-ink-500">{user.email}</p></div>
              <Link to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800"><Settings size={16} /> Settings</Link>
              <button onClick={() => { logout(); navigate('/login', { replace: true }); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"><LogOut size={16} /> Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}