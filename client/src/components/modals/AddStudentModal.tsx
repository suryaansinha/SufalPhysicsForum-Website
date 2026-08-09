import { useEffect, useRef, useState } from 'react';
import { X, Loader2, CheckCircle2, Copy, Check } from 'lucide-react';
import type { Batch, Student } from '../../types';
import { fetchBatches } from '../../api/batch.api';
import { createStudent } from '../../api/student.api';

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (student: Student) => void;
}

interface Credentials {
  email: string;
  password: string;
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none';

const LOGIN_URL = 'https://yourdomain.com/login';

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

export default function AddStudentModal({ open, onClose, onCreated }: AddStudentModalProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', batchId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setForm({ name: '', email: '', phone: '', batchId: '' });
      setCredentials(null);
      setCreatedStudent(null);
      setCopied(false);
      fetchBatches()
        .then(setBatches)
        .catch(() => setError('Failed to load batches'));
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) {
        clearTimeout(copyTimer.current);
      }
    };
  }, []);

  if (!open) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await createStudent({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        batchId: form.batchId || null,
      });
      setCreatedStudent(result.student);
      setCredentials({ email: result.student.email, password: result.tempPassword });
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(
        axiosErr.response?.data?.message ||
          (err instanceof Error ? err.message : 'Failed to create student')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!credentials) {
      return;
    }
    const message = `🎓 Welcome to SufalPhysicsForum!\nLogin: ${LOGIN_URL}\nEmail: ${credentials.email}\nPassword: ${credentials.password}\n\nPlease log in and change your password.`;
    await copyToClipboard(message);
    setCopied(true);
    if (copyTimer.current) {
      clearTimeout(copyTimer.current);
    }
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (createdStudent) {
      onCreated(createdStudent);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            {credentials ? 'Student Added' : 'Add Student'}
          </h4>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {credentials ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {createdStudent?.name} is now enrolled.
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Share these temporary credentials with the student via WhatsApp or Email.
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5 break-all">
                  {credentials.email}
                </p>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Password</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm font-semibold text-gray-900 font-mono">
                    {credentials.password}
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 shrink-0">
                    Temporary Password
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Students can change their password after logging in.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? 'Copied!' : 'Copy Credentials'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Rahul Kumar"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="student@example.com"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
              <select
                value={form.batchId}
                onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                className={inputClass}
              >
                <option value="">No batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                    {batch.subject ? ` (${batch.subject})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Adding...' : 'Add Student'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
