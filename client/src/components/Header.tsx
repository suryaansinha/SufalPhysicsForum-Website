import { Menu, LogOut } from 'lucide-react';
import ThemeToggle from './ui/ThemeToggle';

interface HeaderProps {
  onMenuClick: () => void;
  onLogout: () => void;
}

export default function Header({ onMenuClick, onLogout }: HeaderProps) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 dark:bg-slate-900/40 dark:border-slate-700/50 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-700/30 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">SufalPhysicsForum</h2>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-500/10 dark:text-slate-300 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/20"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
