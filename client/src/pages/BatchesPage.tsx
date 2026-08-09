import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, X, Trash2, Loader2 } from 'lucide-react';
import { fetchBatches, createBatch, deleteBatch } from '../api/batch.api';
import { isTeacherRole, getCurrentUserRole } from '../lib/auth';
import type { Batch } from '../types';

function isUnauthorized(err: unknown): boolean {
  return (err as { response?: { status?: number } })?.response?.status === 401;
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    gradeLevel: '',
    grade: '',
    targetExam: '',
    subject: 'Physics',
    timing: '',
    feeAmount: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const canManageBatches = isTeacherRole(getCurrentUserRole());

  const loadBatches = useCallback(() => {
    setLoading(true);
    fetchBatches()
      .then(setBatches)
      .catch((err) => {
        if (isUnauthorized(err)) {
          navigate('/login');
          return;
        }
        setError('Failed to load batches');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await createBatch({
        name: form.name,
        gradeLevel: form.gradeLevel || null,
        grade: form.grade || null,
        targetExam: form.targetExam || null,
        subject: form.subject || 'Physics',
        timing: form.timing || null,
        feeAmount: form.feeAmount ? parseFloat(form.feeAmount) : null,
      });
      setShowForm(false);
      setForm({ name: '', gradeLevel: '', grade: '', targetExam: '', subject: 'Physics', timing: '', feeAmount: '' });
      setSuccessMsg('Batch created successfully');
      loadBatches();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      if (isUnauthorized(err)) {
        navigate('/login');
        return;
      }
      setError('Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (batch: Batch, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const enrolled = batch.enrollments?.length || 0;
    const confirmMsg =
      enrolled > 0
        ? `Delete "${batch.name}"? This will also remove ${enrolled} enrolled student(s) and all related records. This cannot be undone.`
        : `Delete "${batch.name}"? This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;
    setDeletingId(batch.id);
    setError(null);
    try {
      await deleteBatch(batch.id);
      setSuccessMsg(`Batch "${batch.name}" deleted`);
      loadBatches();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      if (isUnauthorized(err)) {
        navigate('/login');
        return;
      }
      setError('Failed to delete batch');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Batches</h3>
          <p className="text-sm text-slate-500 mt-1">Manage your class batches</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400 text-slate-950 text-sm font-medium rounded-lg hover:bg-yellow-300 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20"
        >
          <Plus className="w-4 h-4" />
          Create Batch
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-emerald-700 text-sm dark:text-emerald-300">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-600 text-sm dark:text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 dark:bg-slate-900/80 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create Batch</h4>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Batch Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Grade Level</label>
                  <input
                    type="text"
                    value={form.gradeLevel}
                    onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                    placeholder="e.g. 11"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Grade</label>
                  <input
                    type="text"
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    placeholder="e.g. A+"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Target Exam</label>
                <select
                  value={form.targetExam}
                  onChange={(e) => setForm({ ...form, targetExam: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                >
                  <option value="">None</option>
                  <option value="JEE">JEE</option>
                  <option value="NEET">NEET</option>
                  <option value="Boards">Boards</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Timing</label>
                  <input
                    type="text"
                    value={form.timing}
                    onChange={(e) => setForm({ ...form, timing: e.target.value })}
                    placeholder="e.g. 4:00 PM"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Fee Amount</label>
                <input
                  type="number"
                  value={form.feeAmount}
                  onChange={(e) => setForm({ ...form, feeAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200/80 transition-colors dark:text-slate-300 dark:bg-slate-800/60 dark:hover:bg-slate-700/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-slate-950 bg-yellow-400 rounded-lg hover:bg-yellow-300 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {batches.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-slate-200 p-12 text-center dark:bg-slate-900/40 dark:border-slate-700/50">
          <BookOpenPlaceholder />
          <p className="text-slate-500 mt-4">No batches found. Create your first batch to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => (
            <Link
              key={batch.id}
              to={`/dashboard/batches/${batch.id}`}
              className="bg-white/70 backdrop-blur-xl rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 ease-in-out hover:-translate-y-1 block group dark:bg-slate-900/40 dark:border-slate-700/50"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{batch.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 bg-blue-600/10 text-blue-700 rounded-full dark:bg-blue-600/30 dark:text-blue-300">
                    {batch.gradeLevel ? `Class ${batch.gradeLevel}` : 'All'}
                  </span>
                  {canManageBatches && (
                    <button
                      type="button"
                      onClick={(e) => handleDelete(batch, e)}
                      disabled={deletingId === batch.id}
                      aria-label={`Delete ${batch.name}`}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50 dark:hover:text-red-400"
                    >
                      {deletingId === batch.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                {batch.targetExam && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Target:</span>
                    <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-600 rounded text-xs font-medium dark:text-yellow-300">
                      {batch.targetExam}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Subject:</span> {batch.subject}
                </div>
                {batch.timing && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Timing:</span> {batch.timing}
                  </div>
                )}
                {batch.feeAmount != null && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Fee:</span> {batch.feeAmount}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Students:</span>{' '}
                  {batch.enrollments?.length || 0}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function BookOpenPlaceholder() {
  return (
    <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
