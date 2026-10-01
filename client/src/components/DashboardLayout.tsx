import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { getCurrentUserRole, isTeacherRole } from '../lib/auth';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || 'User');
  const canManageSettings = isTeacherRole(getCurrentUserRole());

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const handleNameUpdated = (name: string) => {
    setUserName(name);
  };

  return (
    <div className="flex h-screen overflow-hidden text-slate-900 dark:text-slate-100">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={userName}
        canManageSettings={canManageSettings}
        onNameUpdated={handleNameUpdated}
      />
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-100/70 dark:bg-transparent">
        <Header onMenuClick={() => setSidebarOpen(true)} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-100/80 dark:bg-transparent">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
