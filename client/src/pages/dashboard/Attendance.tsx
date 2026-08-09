import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Save, CheckCircle2, AlertCircle, Loader2, CalendarDays, Users } from 'lucide-react';
import type { AttendanceStatus } from '../../types';
import { fetchBatches, fetchBatch } from '../../api/batch.api';
import { fetchAttendanceByBatchAndDate, markBulkAttendance } from '../../api/attendance.api';

interface RosterStudent {
  id: string;
  name: string;
  email: string;
}

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  activeClass: string;
  inactiveClass: string;
  dotClass: string;
}[] = [
  {
    value: 'PRESENT',
    label: 'Present',
    activeClass: 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30 border-emerald-500',
    inactiveClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20 dark:text-emerald-300',
    dotClass: 'bg-emerald-500',
  },
  {
    value: 'ABSENT',
    label: 'Absent',
    activeClass: 'bg-red-500 text-white shadow-sm shadow-red-500/30 border-red-500',
    inactiveClass: 'bg-red-500/10 text-red-700 border-red-500/30 hover:bg-red-500/20 dark:text-red-300',
    dotClass: 'bg-red-500',
  },
  {
    value: 'LATE',
    label: 'Late',
    activeClass: 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/30 border-amber-400',
    inactiveClass: 'bg-amber-400/10 text-amber-700 border-amber-400/30 hover:bg-amber-400/20 dark:text-amber-300',
    dotClass: 'bg-amber-400',
  },
  {
    value: 'EXCUSED',
    label: 'Excused',
    activeClass: 'bg-blue-500 text-white shadow-sm shadow-blue-500/30 border-blue-500',
    inactiveClass: 'bg-blue-500/10 text-blue-700 border-blue-500/30 hover:bg-blue-500/20 dark:text-blue-300',
    dotClass: 'bg-blue-500',
  },
];

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const StudentRow = memo(function StudentRow({
  student,
  status,
  onStatusChange,
}: {
  student: RosterStudent;
  status: AttendanceStatus;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-blue-600/30 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-300 shrink-0">
          {initials(student.name)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate dark:text-slate-100">{student.name}</p>
          <p className="text-xs text-slate-500 truncate">{student.email}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((opt) => {
          const active = status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusChange(student.id, opt.value)}
              className={`px-3 py-2 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                active ? opt.activeClass : opt.inactiveClass
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default function Attendance() {
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  });
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [statuses, setStatuses] = useState<Map<string, AttendanceStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchBatches()
      .then((data) => {
        setBatches(data.map((b) => ({ id: b.id, name: b.name })));
        if (data.length > 0) {
          setSelectedBatchId(data[0].id);
        }
      })
      .catch(() =>
        setToast({ type: 'error', message: 'Failed to load batches. Please try again.' })
      );
  }, []);

  const loadRoster = useCallback(async (batchId: string, dateStr: string) => {
    setLoading(true);
    setToast(null);
    try {
      const [batch, attendance] = await Promise.all([
        fetchBatch(batchId),
        fetchAttendanceByBatchAndDate(batchId, dateStr),
      ]);

      const roster: RosterStudent[] = (batch.enrollments ?? []).map((e) => ({
        id: e.student.id,
        name: e.student.name,
        email: e.student.email,
      }));

      const existing = new Map(
        attendance.map((record) => [record.studentId, record.status])
      );

      const initialStatuses = new Map<string, AttendanceStatus>();
      for (const student of roster) {
        initialStatuses.set(student.id, existing.get(student.id) ?? 'PRESENT');
      }

      setStudents(roster);
      setStatuses(initialStatuses);
    } catch {
      setStudents([]);
      setStatuses(new Map());
      setToast({ type: 'error', message: 'Failed to load students for this batch.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBatchId && date) {
      loadRoster(selectedBatchId, date);
    } else {
      setStudents([]);
      setStatuses(new Map());
    }
  }, [selectedBatchId, date, loadRoster]);

  const handleStatusChange = useCallback((studentId: string, status: AttendanceStatus) => {
    setStatuses((prev) => {
      const next = new Map(prev);
      next.set(studentId, status);
      return next;
    });
  }, []);

  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    for (const status of statuses.values()) {
      if (status === 'PRESENT') present += 1;
      else if (status === 'ABSENT') absent += 1;
      else if (status === 'LATE') late += 1;
    }
    return { present, absent, late };
  }, [statuses]);

  const handleSave = async () => {
    if (!selectedBatchId || !date || saving) return;
    setSaving(true);
    try {
      const records = Array.from(statuses.entries()).map(([studentId, status]) => ({
        studentId,
        status,
      }));
      const result = await markBulkAttendance({ batchId: selectedBatchId, date, records });
      setToast({
        type: 'success',
        message: `Attendance saved for ${result.count} students`,
      });
    } catch {
      setToast({ type: 'error', message: 'Failed to save attendance. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Attendance</h3>
          <p className="text-sm text-slate-500 mt-1">Mark daily attendance for your batch</p>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg border ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 backdrop-blur-xl'
              : 'bg-red-500/10 border-red-500/30 backdrop-blur-xl'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          )}
          <span
            className={`text-sm font-medium ${
              toast.type === 'success' ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
            }`}
          >
            {toast.message}
          </span>
        </div>
      )}

      <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-slate-200 p-4 mb-6 dark:bg-slate-900/40 dark:border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 min-w-0 sm:max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300">Select Batch</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
            >
              <option value="">Choose a batch...</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
        </div>
      )}

      {!loading && selectedBatchId && students.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {STATUS_OPTIONS.filter((opt) => opt.value !== 'EXCUSED').map((opt) => {
              const count =
                opt.value === 'PRESENT'
                  ? counts.present
                  : opt.value === 'ABSENT'
                    ? counts.absent
                    : counts.late;
              return (
                <div key={opt.value} className="flex items-center gap-2 text-sm">
                  <span className={`w-3 h-3 rounded-full ${opt.dotClass}`} />
                  <span className="text-slate-600 dark:text-slate-400">
                    {opt.label}: <span className="font-semibold text-slate-900 dark:text-slate-100">{count}</span>
                  </span>
                </div>
              );
            })}
            <div className="flex items-center gap-1.5 text-sm text-slate-500 ml-auto">
              <Users className="w-4 h-4" />
              {students.length} students
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-slate-200 overflow-hidden mb-6 dark:bg-slate-900/40 dark:border-slate-700/50">
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {students.map((student) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  status={statuses.get(student.id) ?? 'PRESENT'}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || statuses.size === 0}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-slate-950 text-sm font-medium rounded-lg hover:bg-yellow-300 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </>
      )}

      {!loading && selectedBatchId && students.length === 0 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-slate-200 p-12 text-center dark:bg-slate-900/40 dark:border-slate-700/50">
          <Users className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
          <p className="text-slate-500 mt-4">No students enrolled in this batch.</p>
        </div>
      )}

      {!loading && !selectedBatchId && (
        <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-slate-200 p-12 text-center dark:bg-slate-900/40 dark:border-slate-700/50">
          <CalendarDays className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
          <p className="text-slate-500 mt-4">Select a batch and date to start taking attendance.</p>
        </div>
      )}
    </div>
  );
}
