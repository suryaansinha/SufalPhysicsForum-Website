import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  CalendarCheck,
  IndianRupee,
  HelpCircle,
  Settings as SettingsIcon,
  Pencil,
  Loader2,
  X,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import axios from 'axios';
import { getCurrentUserRole } from '../lib/auth';
import {
  getMyProfile,
  updateMyProfile,
  type AuthProfile,
  type ClassLevel,
  type TargetExam,
} from '../api/auth.api';

interface SidebarLink {
  to: string;
  icon: LucideIcon;
  label: string;
  adminOnly?: boolean;
  teacherOnly?: boolean;
  studentOnly?: boolean;
}

const sidebarLinks: SidebarLink[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/batches', icon: BookOpen, label: 'Batches' },
  { to: '/dashboard/students', icon: Users, label: 'Students' },
  { to: '/dashboard/attendance', icon: ClipboardCheck, label: 'Attendance', teacherOnly: true },
  { to: '/dashboard/my-attendance', icon: CalendarCheck, label: 'My Attendance', studentOnly: true },
  { to: '/dashboard/fees', icon: IndianRupee, label: 'Fees' },
  { to: '/dashboard/doubt-forum', icon: HelpCircle, label: 'Doubt Forum' },
  { to: '/dashboard/settings', icon: SettingsIcon, label: 'Settings', adminOnly: true },
];

const CLASS_OPTIONS: { value: ClassLevel | ''; label: string }[] = [
  { value: '', label: 'Not set' },
  { value: 'CLASS_9', label: '9' },
  { value: 'CLASS_10', label: '10' },
  { value: 'CLASS_11', label: '11' },
  { value: 'CLASS_12', label: '12' },
  { value: 'DROPPER', label: 'Dropper' },
];

const EXAM_OPTIONS: { value: TargetExam | ''; label: string }[] = [
  { value: '', label: 'Not set' },
  { value: 'JEE', label: 'JEE' },
  { value: 'NEET', label: 'NEET' },
  { value: 'BOARDS', label: 'Boards' },
  { value: 'OTHERS', label: 'Others' },
];

const profileLabelClass =
  'block text-sm font-medium text-slate-800 mb-1 dark:text-slate-200';

const profileFieldClass =
  'w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm outline-none bg-white text-slate-900 placeholder-slate-400 ' +
  'transition-[border-color,box-shadow,background-color] duration-150 ease-out motion-reduce:transition-none ' +
  'hover:border-slate-400 hover:bg-slate-50 ' +
  'focus-visible:border-yellow-400 focus-visible:shadow-[0_0_0_3px_rgba(245,184,0,0.25)] ' +
  'dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 ' +
  'dark:hover:border-[#3b4a66] dark:hover:bg-[#111b30]';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  canManageSettings: boolean;
  onNameUpdated: (name: string) => void;
}

function persistProfile(profile: AuthProfile): void {
  localStorage.setItem('userName', profile.name);
  try {
    const raw = localStorage.getItem('user');
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    localStorage.setItem('user', JSON.stringify({ ...parsed, ...profile }));
  } catch {
    localStorage.setItem('user', JSON.stringify(profile));
  }
}

export default function Sidebar({
  open,
  onClose,
  userName,
  canManageSettings,
  onNameUpdated,
}: SidebarProps) {
  const userRole = getCurrentUserRole();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const visibleLinks = sidebarLinks.filter((link) => {
    if (link.adminOnly && !canManageSettings) return false;
    if (link.teacherOnly && userRole === 'STUDENT') return false;
    if (link.studentOnly && userRole !== 'STUDENT') return false;
    return true;
  });

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
            <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-yellow-300">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate flex-1">
              {userName}
            </span>
            <button
              type="button"
              onClick={() => setShowEditProfile(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800/60 transition-colors shrink-0"
              aria-label="Edit profile"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
      {showEditProfile && (
        <EditProfileModal
          currentName={userName}
          onClose={() => setShowEditProfile(false)}
          onSaved={(profile) => {
            persistProfile(profile);
            onNameUpdated(profile.name);
            setShowEditProfile(false);
            setToast('Profile updated');
          }}
        />
      )}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg border backdrop-blur-xl bg-emerald-500/10 border-emerald-500/30">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{toast}</span>
        </div>
      )}
    </>
  );
}

function readStoredProfile(currentName: string): AuthProfile {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) {
      return {
        id: '',
        name: currentName,
        email: '',
        role: getCurrentUserRole() || '',
        classLevel: null,
        targetExam: null,
      };
    }
    const parsed = JSON.parse(raw) as Partial<AuthProfile>;
    return {
      id: parsed.id || '',
      name: parsed.name || currentName,
      email: parsed.email || '',
      role: parsed.role || getCurrentUserRole() || '',
      classLevel: parsed.classLevel ?? null,
      targetExam: parsed.targetExam ?? null,
    };
  } catch {
    return {
      id: '',
      name: currentName,
      email: '',
      role: getCurrentUserRole() || '',
      classLevel: null,
      targetExam: null,
    };
  }
}

function EditProfileModal({
  currentName,
  onClose,
  onSaved,
}: {
  currentName: string;
  onClose: () => void;
  onSaved: (profile: AuthProfile) => void;
}) {
  const stored = readStoredProfile(currentName);
  const [name, setName] = useState(stored.name || currentName);
  const [classLevel, setClassLevel] = useState<ClassLevel | ''>(stored.classLevel ?? '');
  const [targetExam, setTargetExam] = useState<TargetExam | ''>(stored.targetExam ?? '');
  const [role, setRole] = useState(stored.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStudent = role === 'STUDENT';
  const trimmedName = name.trim();
  const nameValid = trimmedName.length >= 2 && trimmedName.length <= 80;

  useEffect(() => {
    let cancelled = false;
    getMyProfile()
      .then((profile) => {
        if (cancelled) return;
        setName(profile.name);
        setClassLevel(profile.classLevel ?? '');
        setTargetExam(profile.targetExam ?? '');
        setRole(profile.role);
      })
      .catch(() => {
        // keep localStorage prefill if the profile fetch fails
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameValid) {
      setError('Name must be between 2 and 80 characters');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: {
        name: string;
        classLevel?: ClassLevel | null;
        targetExam?: TargetExam | null;
      } = { name: trimmedName };
      if (isStudent) {
        payload.classLevel = classLevel === '' ? null : classLevel;
        payload.targetExam = targetExam === '' ? null : targetExam;
      }
      const updated = await updateMyProfile(payload);
      onSaved(updated);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        const message = (err.response.data as { message?: string } | undefined)?.message;
        setError(message || 'Name must be between 2 and 80 characters');
      } else {
        setError('Could not update profile');
      }
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto dark:bg-slate-900/80 dark:border-slate-700/50">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700/50">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit profile</h4>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={profileLabelClass}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              maxLength={80}
              className={profileFieldClass}
            />
          </div>
          {isStudent && (
            <>
              <div>
                <label className={profileLabelClass}>Class</label>
                <div className="relative">
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value as ClassLevel | '')}
                    className={`${profileFieldClass} appearance-none pr-10 ${classLevel === '' ? 'text-slate-400 dark:text-slate-400' : ''}`}
                  >
                    {CLASS_OPTIONS.map((option) => (
                      <option key={option.value || 'not-set'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                </div>
              </div>
              <div>
                <label className={profileLabelClass}>
                  Target exam
                </label>
                <div className="relative">
                  <select
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value as TargetExam | '')}
                    className={`${profileFieldClass} appearance-none pr-10 ${targetExam === '' ? 'text-slate-400 dark:text-slate-400' : ''}`}
                  >
                    {EXAM_OPTIONS.map((option) => (
                      <option key={option.value || 'not-set'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                </div>
              </div>
            </>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-600 dark:text-red-300">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200/80 transition-colors dark:text-slate-300 dark:bg-slate-800/60 dark:hover:bg-slate-700/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !nameValid}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-slate-950 bg-yellow-400 rounded-xl hover:bg-yellow-300 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
