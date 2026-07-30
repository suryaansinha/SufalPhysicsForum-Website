import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import api from '../lib/api';
import type { Batch, ApiResponse } from '../types';

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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchBatches = useCallback(() => {
    setLoading(true);
    api
      .get<ApiResponse<Batch[]>>('/batches')
      .then((res) => {
        if (res.data.success) {
          setBatches(res.data.data || []);
        }
      })
      .catch(() => setError('Failed to load batches'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post<ApiResponse<Batch>>('/batches', {
        name: form.name,
        gradeLevel: form.gradeLevel || null,
        grade: form.grade || null,
        targetExam: form.targetExam || null,
        subject: form.subject || 'Physics',
        timing: form.timing || null,
        feeAmount: form.feeAmount || null,
      });
      if (res.data.success) {
        setShowForm(false);
        setForm({ name: '', gradeLevel: '', grade: '', targetExam: '', subject: 'Physics', timing: '', feeAmount: '' });
        setSuccessMsg('Batch created successfully');
        fetchBatches();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch {
      setError('Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Batches</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your class batches</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Batch
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-700 text-sm">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Create Batch</h4>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                  <input
                    type="text"
                    value={form.gradeLevel}
                    onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                    placeholder="e.g. 11"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                  <input
                    type="text"
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    placeholder="e.g. A+"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Exam</label>
                <select
                  value={form.targetExam}
                  onChange={(e) => setForm({ ...form, targetExam: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="">None</option>
                  <option value="JEE">JEE</option>
                  <option value="NEET">NEET</option>
                  <option value="Boards">Boards</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timing</label>
                  <input
                    type="text"
                    value={form.timing}
                    onChange={(e) => setForm({ ...form, timing: e.target.value })}
                    placeholder="e.g. 4:00 PM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Amount</label>
                <input
                  type="number"
                  value={form.feeAmount}
                  onChange={(e) => setForm({ ...form, feeAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {batches.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpenPlaceholder />
          <p className="text-gray-500 mt-4">No batches found. Create your first batch to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => (
            <Link
              key={batch.id}
              to={`/dashboard/batches/${batch.id}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow block"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-900">{batch.name}</h4>
                <span className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                  {batch.gradeLevel ? `Class ${batch.gradeLevel}` : 'All'}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-500">
                {batch.targetExam && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Target:</span>
                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">
                      {batch.targetExam}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600">Subject:</span> {batch.subject}
                </div>
                {batch.timing && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Timing:</span> {batch.timing}
                  </div>
                )}
                {batch.feeAmount != null && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Fee:</span> {batch.feeAmount}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600">Students:</span>{' '}
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
    <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
