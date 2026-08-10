import { AlertTriangle, Loader2, X } from 'lucide-react';

interface DeleteStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  studentName: string;
  isLoading: boolean;
}

export default function DeleteStudentModal({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  isLoading,
}: DeleteStudentModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white/95 backdrop-blur-md border border-red-200 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 dark:bg-slate-900/90 dark:border-red-900/50">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-red-500/15 shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Delete Student</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
              Are you sure you want to delete{' '}
              <span className="font-medium text-slate-900 dark:text-slate-100">{studentName}</span>?
              This will permanently remove their account, enrollments, attendance, fees, and forum
              activity. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 shrink-0 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200/80 border border-slate-300 transition-colors dark:text-slate-300 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 dark:border-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all disabled:opacity-60"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Deleting...' : 'Delete Student'}
          </button>
        </div>
      </div>
    </div>
  );
}
