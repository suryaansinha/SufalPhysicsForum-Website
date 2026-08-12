// import { useEffect, useMemo, useState } from 'react';
// import { CalendarDays, CheckCircle2, AlertCircle, Loader2, Save, Users } from 'lucide-react';
// import { fetchBatches } from '../../api/batch.api';
// import { fetchAttendanceRoster, saveBatchAttendance } from '../../api/attendance.api';
// import type { AttendanceRosterStudent, AttendanceStatus } from '../../types';

// function todayLocal(): string {
//   const now = new Date();
//   const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
//   return local.toISOString().slice(0, 10);
// }

// const PRESENT_ACTIVE = 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/30';
// const PRESENT_INACTIVE =
//   'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20 dark:text-emerald-300';
// const ABSENT_ACTIVE = 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/30';
// const ABSENT_INACTIVE = 'bg-red-500/10 text-red-700 border-red-500/30 hover:bg-red-500/20 dark:text-red-300';

// export default function AttendanceTracker() {
//   const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
//   const [selectedBatchId, setSelectedBatchId] = useState('');
//   const [date, setDate] = useState(todayLocal);
//   const [roster, setRoster] = useState<AttendanceRosterStudent[]>([]);
//   const [statuses, setStatuses] = useState<Map<string, AttendanceStatus>>(new Map());
//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

//   useEffect(() => {
//     fetchBatches()
//       .then((data) => {
//         setBatches(data.map((b) => ({ id: b.id, name: b.name })));
//         if (data.length > 0) {
//           setSelectedBatchId(data[0].id);
//         }
//       })
//       .catch(() => setToast({ type: 'error', message: 'Failed to load batches' }));
//   }, []);

//   useEffect(() => {
//     if (!selectedBatchId) return;
//     let cancelled = false;
//     setLoading(true);
//     fetchAttendanceRoster(selectedBatchId, date)
//       .then((list) => {
//         if (cancelled) return;
//         setRoster(list);
//         setStatuses(new Map(list.map((s) => [s.studentId, s.status])));
//       })
//       .catch(() => {
//         if (!cancelled) setToast({ type: 'error', message: 'Failed to load attendance' });
//       })
//       .finally(() => {
//         if (!cancelled) setLoading(false);
//       });
//     return () => {
//       cancelled = true;
//     };
//   }, [selectedBatchId, date]);

//   const selectedBatchName = batches.find((b) => b.id === selectedBatchId)?.name ?? '';

//   const setStatus = (studentId: string, status: AttendanceStatus) => {
//     setStatuses((prev) => {
//       const next = new Map(prev);
//       next.set(studentId, status);
//       return next;
//     });
//   };

//   const presentCount = useMemo(() => {
//     let count = 0;
//     statuses.forEach((status) => {
//       if (status === 'PRESENT') count += 1;
//     });
//     return count;
//   }, [statuses]);

//   const handleSave = async () => {
//     if (!selectedBatchId || saving) return;
//     const records = roster.map((s) => ({
//       studentId: s.studentId,
//       status: statuses.get(s.studentId) ?? s.status,
//     }));
//     setSaving(true);
//     try {
//       const { count } = await saveBatchAttendance(selectedBatchId, date, records);
//       setToast({ type: 'success', message: `Attendance saved for ${count} students` });
//       setTimeout(() => setToast(null), 3000);
//     } catch (err) {
//       setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save attendance' });
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div>
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
//         <div>
//           <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Attendance Tracker</h3>
//           <p className="text-sm text-slate-500 mt-1">
//             {selectedBatchName ? `Marking attendance for ${selectedBatchName}` : 'Select a batch to begin'}
//           </p>
//         </div>
//         <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
//           <select
//             value={selectedBatchId}
//             onChange={(e) => setSelectedBatchId(e.target.value)}
//             className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
//           >
//             <option value="">Select a batch</option>
//             {batches.map((batch) => (
//               <option key={batch.id} value={batch.id}>
//                 {batch.name}
//               </option>
//             ))}
//           </select>
//           <div className="relative">
//             <CalendarDays className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
//             <input
//               type="date"
//               value={date}
//               onChange={(e) => setDate(e.target.value)}
//               className="w-full sm:w-auto pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
//             />
//           </div>
//         </div>
//       </div>

//       {toast && (
//         <div
//           className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg border backdrop-blur-xl ${
//             toast.type === 'success'
//               ? 'bg-emerald-500/10 border-emerald-500/30'
//               : 'bg-red-500/10 border-red-500/30'
//           }`}
//         >
//           {toast.type === 'success' ? (
//             <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
//           ) : (
//             <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
//           )}
//           <span
//             className={`text-sm font-medium ${
//               toast.type === 'success' ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
//             }`}
//           >
//             {toast.message}
//           </span>
//         </div>
//       )}

//       <div className="bg-white rounded-xl border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-700/50">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b border-slate-200 bg-slate-100 dark:border-slate-700/50 dark:bg-slate-800/60">
//                 <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-400">
//                   Student
//                 </th>
//                 <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-400">
//                   Email
//                 </th>
//                 <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-400">
//                   Status
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
//               {loading ? (
//                 <tr>
//                   <td colSpan={3} className="px-6 py-16 text-center">
//                     <Loader2 className="w-6 h-6 animate-spin text-yellow-500 mx-auto" />
//                   </td>
//                 </tr>
//               ) : !selectedBatchId ? (
//                 <tr>
//                   <td colSpan={3} className="px-6 py-16 text-center text-slate-500">
//                     Select a batch to view its roster.
//                   </td>
//                 </tr>
//               ) : roster.length === 0 ? (
//                 <tr>
//                   <td colSpan={3} className="px-6 py-16 text-center">
//                     <Users className="w-10 h-10 text-slate-400 mx-auto" />
//                     <p className="text-sm text-slate-500 mt-3">No students enrolled in this batch yet.</p>
//                   </td>
//                 </tr>
//               ) : (
//                 roster.map((student) => {
//                   const status = statuses.get(student.studentId) ?? student.status;
//                   return (
//                     <tr key={student.studentId} className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/40">
//                       <td className="px-6 py-4">
//                         <div className="font-medium text-slate-900 dark:text-slate-100">{student.name}</div>
//                       </td>
//                       <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{student.email}</td>
//                       <td className="px-6 py-4">
//                         <div className="flex justify-end gap-1.5">
//                           <button
//                             type="button"
//                             onClick={() => setStatus(student.studentId, 'PRESENT')}
//                             className={`px-3 py-2 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
//                               status === 'PRESENT' ? PRESENT_ACTIVE : PRESENT_INACTIVE
//                             }`}
//                           >
//                             Present
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => setStatus(student.studentId, 'ABSENT')}
//                             className={`px-3 py-2 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
//                               status === 'ABSENT' ? ABSENT_ACTIVE : ABSENT_INACTIVE
//                             }`}
//                           >
//                             Absent
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       <div className="sticky bottom-4 mt-4 flex items-center justify-between gap-4 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-xl px-5 py-3 shadow-lg dark:bg-slate-900/90 dark:border-slate-700/50">
//         <p className="text-sm text-slate-600 dark:text-slate-400">
//           <span className="font-semibold text-emerald-600 dark:text-emerald-400">{presentCount}</span> present ·{' '}
//           <span className="font-semibold text-red-600 dark:text-red-400">{roster.length - presentCount}</span> absent
//         </p>
//         <button
//           type="button"
//           onClick={handleSave}
//           disabled={saving || roster.length === 0}
//           className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-950 bg-yellow-500 hover:bg-yellow-400 rounded-lg transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/30 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
//         >
//           {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
//           {saving ? 'Saving...' : 'Save Attendance'}
//         </button>
//       </div>
//     </div>
//   );
// }
