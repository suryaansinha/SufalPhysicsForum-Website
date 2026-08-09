import { useEffect, useMemo, useState } from 'react';
import { Search, X, Users, Loader2 } from 'lucide-react';
import { fetchUnenrolledStudents, enrollStudents } from '../../api/batch.api';
import type { UnenrolledStudent } from '../../types';

interface EnrollStudentsModalProps {
  open: boolean;
  batchId: string;
  batchName: string;
  onClose: () => void;
  onEnrolled: () => void;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function EnrollStudentsModal({
  open,
  batchId,
  batchName,
  onClose,
  onEnrolled,
}: EnrollStudentsModalProps) {
  const [students, setStudents] = useState<UnenrolledStudent[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setStudents([]);
    setSelected(new Set());
    setQuery('');
    fetchUnenrolledStudents(batchId)
      .then((list) => {
        if (!cancelled) setStudents(list);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load unenrolled students');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, batchId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(q) || student.email.toLowerCase().includes(q)
    );
  }, [students, query]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filtered.forEach((s) => next.delete(s.id));
      } else {
        filtered.forEach((s) => next.add(s.id));
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await enrollStudents(batchId, Array.from(selected));
      onEnrolled();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll students');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[85vh] dark:bg-slate-900/80 dark:border-slate-700/50">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700/50">
          <div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Enroll Students</h4>
            <p className="text-xs text-slate-500 mt-0.5">Add unenrolled students to "{batchName}"</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-white text-slate-900 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
            </div>
          ) : error ? (
            <div className="m-6 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-600 dark:text-red-300">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-6">
              <Users className="w-10 h-10 text-slate-400" />
              <p className="text-sm text-slate-500 mt-3">
                {students.length === 0
                  ? 'No unenrolled students found. All students are already enrolled in this batch.'
                  : 'No students match your search.'}
              </p>
            </div>
          ) : (
            <div>
              <label className="flex items-center gap-3 px-6 py-2.5 text-sm text-slate-600 hover:bg-slate-100 cursor-pointer dark:text-slate-400 dark:hover:bg-slate-800/40">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  className="w-4 h-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-500"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {allVisibleSelected ? 'Unselect all' : 'Select all'} ({filtered.length})
                </span>
              </label>
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtered.map((student) => {
                  const isChecked = selected.has(student.id);
                  return (
                    <li key={student.id}>
                      <label className="flex items-center gap-3 px-6 py-3 hover:bg-slate-100 cursor-pointer transition-colors dark:hover:bg-slate-800/40">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(student.id)}
                          className="w-4 h-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-500"
                        />
                        <span className="w-9 h-9 rounded-full bg-blue-600/10 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0 dark:bg-blue-600/30 dark:text-blue-300">
                          {initials(student.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-slate-900 truncate dark:text-slate-100">
                            {student.name}
                          </span>
                          <span className="block text-xs text-slate-600 truncate dark:text-slate-400">
                            {student.email}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700/50">
          <span className="text-sm text-slate-500">
            {selected.size} student{selected.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200/80 transition-colors dark:text-slate-300 dark:bg-slate-800/60 dark:hover:bg-slate-700/60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selected.size === 0 || submitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-slate-950 bg-yellow-400 rounded-lg hover:bg-yellow-300 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Saving...' : 'Save Enrollments'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
