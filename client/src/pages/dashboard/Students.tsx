import { useCallback, useEffect, useState } from 'react';
import { Plus, Mail, Phone, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { isTeacherRole } from '../../lib/auth';
import { fetchStudents, deleteStudent } from '../../api/student.api';
import type { Student } from '../../types';
import AddStudentModal from '../../components/modals/AddStudentModal';
import DeleteStudentModal from '../../components/modals/DeleteStudentModal';

export default function Students() {
  const { user } = useAuth();
  const canManageStudents = isTeacherRole(user?.role ?? null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadStudents = useCallback(() => {
    setLoading(true);
    fetchStudents()
      .then(setStudents)
      .catch(() => setError('Failed to load students'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleCreated = (student: Student) => {
    setStudents((prev) => [student, ...prev]);
  };

  const handleDelete = async () => {
    if (!studentToDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteStudent(studentToDelete.id);
      setStudentToDelete(null);
      setToast({ type: 'success', message: `${studentToDelete.name} deleted successfully` });
      loadStudents();
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to delete student' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-600 dark:text-red-300 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Students</h3>
          <p className="text-sm text-slate-500 mt-1">{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
        </div>
        {canManageStudents && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400 text-slate-950 text-sm font-medium rounded-lg hover:bg-yellow-300 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        )}
      </div>

      {students.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-slate-200 p-12 text-center dark:bg-slate-900/40 dark:border-slate-700/50">
          <UsersPlaceholder />
          <p className="text-slate-500 mt-4">No students enrolled yet.</p>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-slate-200 overflow-hidden dark:bg-slate-900/40 dark:border-slate-700/50">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 dark:border-slate-700/50 dark:bg-slate-800/40">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-400">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-400">
                    Contact
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-400">
                    Enrolled Batches
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-400">
                    Status
                  </th>
                  {canManageStudents && (
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-400">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-100 transition-colors dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{student.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          {student.email}
                        </div>
                        {student.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            {student.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {student.enrollments.length > 0 ? (
                          student.enrollments.map((enrollment) => (
                            <span
                              key={enrollment.batch.id}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600/10 text-blue-700 dark:bg-blue-600/30 dark:text-blue-300"
                            >
                              {enrollment.batch.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500 dark:text-slate-600">No batches</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.isActive
                            ? 'bg-green-500/15 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                            : 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                        }`}
                      >
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canManageStudents && (
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setStudentToDelete(student)}
                          aria-label={`Delete ${student.name}`}
                          className="p-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddStudentModal open={showModal} onClose={() => setShowModal(false)} onCreated={handleCreated} />

      <DeleteStudentModal
        isOpen={studentToDelete !== null}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleDelete}
        studentName={studentToDelete?.name ?? ''}
        isLoading={deleting}
      />

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg border backdrop-blur-xl ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-red-500/10 border-red-500/30'
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
    </div>
  );
}

function UsersPlaceholder() {
  return (
    <svg className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );
}
