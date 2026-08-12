import { useEffect, useState, useMemo } from 'react';
import { Loader2, CalendarDays, CheckCircle2, XCircle, Percent, AlertCircle } from 'lucide-react';
import type { MyAttendanceRecord, AttendanceStatus } from '../../../types';
import { fetchMyAttendance } from '../../../api/attendance.api';

const STATUS_BADGES: Record<AttendanceStatus, { label: string; className: string }> = {
  PRESENT: {
    label: 'Present',
    className:
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 dark:text-emerald-300',
  },
  ABSENT: {
    label: 'Absent',
    className:
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 border border-red-500/30 dark:text-red-300',
  },
  LATE: {
    label: 'Late',
    className:
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-600 border border-amber-400/30 dark:text-amber-300',
  },
  EXCUSED: {
    label: 'Excused',
    className:
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/30 dark:text-blue-300',
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00.000Z');
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function SummaryCard({
  icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconClass: string;
}) {
  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-6">
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg mb-4 ${iconClass}`}>
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="text-3xl font-bold text-slate-100 mt-1">{value}</p>
    </div>
  );
}

export default function MyAttendance() {
  const [records, setRecords] = useState<MyAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchMyAttendance()
      .then((data) => {
        if (active) setRecords(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, percentage };
  }, [records]);

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Attendance</h3>
        <p className="text-sm text-slate-500 mt-1">Track your attendance records across batches</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-slate-200 p-12 text-center dark:bg-slate-900/40 dark:border-slate-700/50">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500/70" />
          <p className="text-slate-500 mt-4">Failed to load attendance records.</p>
          <p className="text-sm text-slate-400 mt-1">Please try again later.</p>
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-slate-200 p-12 text-center dark:bg-slate-900/40 dark:border-slate-700/50">
          <CalendarDays className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
          <p className="text-slate-500 mt-4">No attendance records yet.</p>
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
            <SummaryCard
              icon={<CalendarDays className="w-5 h-5 text-blue-300" />}
              iconClass="bg-blue-500/10"
              label="Total Classes"
              value={String(stats.total)}
            />
            <SummaryCard
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-300" />}
              iconClass="bg-emerald-500/10"
              label="Present"
              value={String(stats.present)}
            />
            <SummaryCard
              icon={<XCircle className="w-5 h-5 text-red-300" />}
              iconClass="bg-red-500/10"
              label="Absent"
              value={String(stats.absent)}
            />
            <SummaryCard
              icon={<Percent className="w-5 h-5 text-yellow-300" />}
              iconClass="bg-yellow-400/10"
              label="Attendance"
              value={`${stats.percentage}%`}
            />
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-slate-200 overflow-hidden dark:bg-slate-900/40 dark:border-slate-700/50">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Date
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Batch
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {records.map((record) => {
                    const badge = STATUS_BADGES[record.status];
                    return (
                      <tr key={record.id} className="hover:bg-slate-200/40 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                          {formatDate(record.date)}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{record.batch.name}</td>
                        <td className="px-4 py-3">
                          <span className={badge.className}>{badge.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
