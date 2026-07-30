import { Routes, Route, Link } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import PublicLayout from './components/PublicLayout';
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import BatchesPage from './pages/BatchesPage';
import BatchDetailsPage from './pages/BatchDetailsPage';
import StudentsPage from './pages/StudentsPage';
import AttendancePage from './pages/AttendancePage';
import LiveClassRoom from './pages/LiveClassRoom';
import FeesPage from './pages/dashboard/FeesPage';

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to access your dashboard</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <p className="text-sm text-gray-500 text-center">Login form coming soon...</p>
        </div>
        <p className="text-center mt-6">
          <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-700">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}

function DashboardHome() {
  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-900">Dashboard</h3>
      <p className="text-sm text-gray-500 mt-1">Welcome to SufalPhysicsForum</p>
      <div className="grid gap-6 mt-8 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Batches"
          value="--"
          href="/dashboard/batches"
          color="indigo"
        />
        <StatCard
          label="Total Students"
          value="--"
          href="/dashboard/students"
          color="emerald"
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, href, color }: { label: string; value: string; href: string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <Link
      to={href}
      className={`rounded-xl border p-6 hover:shadow-md transition-shadow ${colorMap[color] || colorMap.indigo}`}
    >
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </Link>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="batches" element={<BatchesPage />} />
        <Route path="batches/:batchId" element={<BatchDetailsPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="fees" element={<FeesPage />} />
      </Route>
      <Route path="/dashboard/batches/:batchId/live/:liveClassId" element={<LiveClassRoom />} />
    </Routes>
  );
}
