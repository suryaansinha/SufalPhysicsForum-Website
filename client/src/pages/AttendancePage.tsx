import { useEffect, useState, useCallback, memo } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';
import type { Batch, Student, ApiResponse, AttendanceRecord, AttendanceStatus } from '../types';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; className: string }[] = [
  { value: 'PRESENT', label: 'Present', className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20' },
  { value: 'ABSENT', label: 'Absent', className: 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20' },
  { value: 'LATE', label: 'Late', className: 'bg-amber-400/10 text-amber-300 border-amber-400/30 hover:bg-amber-400/20' },
  { value: 'EXCUSED', label: 'Excused', className: 'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20' },
];

interface StudentStatus {
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: AttendanceStatus;
}

const StudentRow = memo(function StudentRow({
  record,
  onStatusChange,
}: {
  record: StudentStatus;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-slate-800/40 rounded-lg transition-colors">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-medium text-slate-100 truncate">{record.studentName}</p>
        <p className="text-xs text-slate-500 truncate">{record.studentEmail}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onStatusChange(record.studentId, opt.value)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
              record.status === opt.value
                ? `${opt.className} ring-1 ring-offset-1 ring-current ring-offset-slate-900`
                : 'bg-slate-900/60 text-slate-500 border-slate-700 hover:bg-slate-800/60'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
});

export default function AttendancePage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<Student[]>([]);
  const [statuses, setStatuses] = useState<Map<string, AttendanceStatus>>(new Map());
  const [, setExistingAttendance] = useState<Map<string, AttendanceStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ApiResponse<Batch[]>>('/batches')
      .then((res) => {
        if (res.data.success && res.data.data) {
          setBatches(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const fetchStudentsAndAttendance = useCallback(async (batchId: string, dateStr: string) => {
    setLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        api.get<ApiResponse<Batch>>(`/batches/${batchId}`),
        api.get<ApiResponse<AttendanceRecord[]>>(`/attendance/${batchId}?date=${dateStr}`),
      ]);

      const enrolledStudents: StudentStatus[] = [];
      const existingMap = new Map<string, AttendanceStatus>();

      if (studentsRes.data.success && studentsRes.data.data) {
        for (const enrollment of studentsRes.data.data.enrollments) {
          enrolledStudents.push({
            studentId: enrollment.student.id,
            studentName: enrollment.student.name,
            studentEmail: enrollment.student.email,
            status: 'PRESENT',
          });
        }
      }

      if (attendanceRes.data.success && attendanceRes.data.data) {
        for (const record of attendanceRes.data.data) {
          existingMap.set(record.studentId, record.status);
        }
      }

      setExistingAttendance(existingMap);

      const initialStatuses = new Map<string, AttendanceStatus>();
      for (const s of enrolledStudents) {
        initialStatuses.set(s.studentId, existingMap.get(s.studentId) || 'PRESENT');
      }

      setStudents(
        enrolledStudents.map((s) => ({
          id: s.studentId,
          name: s.studentName,
          email: s.studentEmail,
          phone: null,
          isActive: true,
          createdAt: '',
          enrollments: [],
        }))
      );
      setStatuses(initialStatuses);
    } catch {
      setStudents([]);
      setStatuses(new Map());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBatchId && date) {
      fetchStudentsAndAttendance(selectedBatchId, date);
    } else {
      setStudents([]);
      setStatuses(new Map());
      setExistingAttendance(new Map());
    }
  }, [selectedBatchId, date, fetchStudentsAndAttendance]);

  const handleStatusChange = useCallback((studentId: string, status: AttendanceStatus) => {
    setStatuses((prev) => {
      const next = new Map(prev);
      next.set(studentId, status);
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (!selectedBatchId || !date) return;
    setSaving(true);
    try {
      const records = Array.from(statuses.entries()).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      const res = await api.post<ApiResponse<{ count: number }>>('/attendance/bulk', {
        batchId: selectedBatchId,
        date,
        records,
      });

      if (res.data.success) {
        const newExisting = new Map(statuses);
        setExistingAttendance(newExisting);
        const count = res.data.data?.count || 0;
        setToast(`Attendance saved for ${count} students`);
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast('Failed to save attendance');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Array.from(statuses.values()).filter((s) => s === 'PRESENT').length;
  const absentCount = Array.from(statuses.values()).filter((s) => s === 'ABSENT').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-100">Attendance</h3>
          <p className="text-sm text-slate-500 mt-1">Track student attendance for each batch</p>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/30 rounded-lg px-4 py-3 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">{toast}</span>
        </div>
      )}

      <div className="bg-slate-900/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 mb-6">
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-slate-300 mb-1">Select Batch</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-slate-900/60 text-slate-100"
            >
              <option value="">Choose a batch...</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="max-w-[180px]">
            <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-slate-900/60 text-slate-100"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
        </div>
      )}

      {!loading && selectedBatchId && students.length > 0 && (
        <>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Present: {presentCount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-400">Absent: {absentCount}</span>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden mb-6">
            <div className="divide-y divide-slate-800">
              {students.map((student) => (
                <StudentRow
                  key={student.id}
                  record={{
                    studentId: student.id,
                    studentName: student.name,
                    studentEmail: student.email,
                    status: statuses.get(student.id) || 'PRESENT',
                  }}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-yellow-400 text-slate-950 text-sm font-medium rounded-lg hover:bg-yellow-300 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </>
      )}

      {!loading && selectedBatchId && students.length === 0 && (
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-12 text-center">
          <p className="text-slate-500">No students enrolled in this batch.</p>
        </div>
      )}

      {!loading && !selectedBatchId && (
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-slate-500 mt-4">Select a batch and date to start taking attendance.</p>
        </div>
      )}
    </div>
  );
}
