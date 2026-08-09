import LoginPage from './pages/public/LoginPage';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { isTeacherRole, getCurrentUserRole } from './lib/auth';
import type { ReactNode } from 'react';
import DashboardLayout from './components/DashboardLayout';
import PublicLayout from './components/PublicLayout';
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import BlogPage from './pages/public/BlogPage';
import BatchesPage from './pages/BatchesPage';
import BatchDetailsPage from './pages/BatchDetailsPage';
import Students from './pages/dashboard/Students';
import Attendance from './pages/dashboard/Attendance';
import LiveClassRoom from './pages/LiveClassRoom';
import FeesPage from './pages/dashboard/FeesPage';
import DoubtForum from './pages/dashboard/DoubtForum';
import Settings from './pages/dashboard/Settings';
import { useEffect, useState } from 'react';
import { fetchBatches } from './api/batch.api';
import api from './lib/api';
import GlassBackground from './components/GlassBackground';

// function LoginPage() {
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
//       <div className="max-w-md w-full">
//         <div className="text-center mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
//           <p className="text-gray-600 mt-2">Sign in to access your dashboard</p>
//         </div>
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
//           <p className="text-sm text-gray-500 text-center">Login form coming soon...</p>
//         </div>
//         <p className="text-center mt-6">
//           <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-700">
//             ← Back to Home
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// }

function DashboardHome() {
  const [counts, setCounts] = useState<{ batches: number; students: number } | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([fetchBatches(), api.get('/students')])
      .then(([batches, studentsRes]) => {
        if (active) {
          const studentList = studentsRes.data?.data as unknown[] | undefined;
          setCounts({ batches: batches.length, students: studentList?.length ?? 0 });
        }
      })
      .catch(() => {
        if (active) setCounts({ batches: 0, students: 0 });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <h3 className="text-2xl font-bold text-slate-100">Dashboard</h3>
      <p className="text-sm text-slate-400 mt-1">Welcome to SufalPhysicsForum</p>
      <div className="grid gap-6 mt-8 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Batches"
          value={counts ? String(counts.batches) : '--'}
          href="/dashboard/batches"
          color="indigo"
        />
        <StatCard
          label="Total Students"
          value={counts ? String(counts.students) : '--'}
          href="/dashboard/students"
          color="emerald"
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, href, color }: { label: string; value: string; href: string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  };

  return (
    <Link
      to={href}
      className={`rounded-xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-xl p-6 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 ease-in-out hover:-translate-y-1 ${colorMap[color] || colorMap.indigo}`}
    >
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </Link>
  );
}

function RequireTeacherRole({ children }: { children: ReactNode }) {
  if (isTeacherRole(getCurrentUserRole())) {
    return <>{children}</>;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <GlassBackground />
      <Routes>
        <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
        <Route path="/blog" element={<PublicLayout><BlogPage /></PublicLayout>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="batches" element={<BatchesPage />} />
          <Route path="batches/:batchId" element={<BatchDetailsPage />} />
          <Route path="students" element={<Students />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="fees" element={<FeesPage />} />
          <Route path="doubt-forum" element={<DoubtForum />} />
          <Route
            path="settings"
            element={
              <RequireTeacherRole>
                <Settings />
              </RequireTeacherRole>
            }
          />
        </Route>
        <Route path="/dashboard/batches/:batchId/live/:liveClassId" element={<LiveClassRoom />} />
      </Routes>
    </div>
  );
}
