import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, ClipboardCheck, CalendarCheck, IndianRupee, HelpCircle, Settings as SettingsIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SidebarLink {
  to: string;
  icon: LucideIcon;
  label: string;
  adminOnly?: boolean;
}

const sidebarLinks: SidebarLink[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/batches', icon: BookOpen, label: 'Batches' },
  { to: '/dashboard/students', icon: Users, label: 'Students' },
  { to: '/dashboard/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { to: '/dashboard/attendance-tracker', icon: CalendarCheck, label: 'Attendance Tracker' },
  { to: '/dashboard/fees', icon: IndianRupee, label: 'Fees' },
  { to: '/dashboard/doubt-forum', icon: HelpCircle, label: 'Doubt Forum' },
  { to: '/dashboard/settings', icon: SettingsIcon, label: 'Settings', adminOnly: true },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  canManageSettings: boolean;
}

export default function Sidebar({ open, onClose, userName, canManageSettings }: SidebarProps) {
  const visibleLinks = sidebarLinks.filter((link) => !link.adminOnly || canManageSettings);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-white/80 backdrop-blur-xl border-r border-slate-200 dark:bg-slate-900/40 dark:border-slate-700/50 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700/50">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">SufalPhysicsForum</h1>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-1">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out ${
                  isActive
                    ? 'bg-blue-600/30 text-yellow-300 shadow-lg shadow-blue-900/30 dark:bg-blue-600/30 dark:text-yellow-300'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/30 dark:hover:text-slate-100'
                }`
              }
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-3 px-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center">
              <span className="text-sm font-semibold text-yellow-300">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{userName}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
