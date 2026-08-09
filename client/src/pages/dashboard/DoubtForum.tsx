import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  HelpCircle,
  ImagePlus,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  X,
} from 'lucide-react';
import type { Batch } from '../../types';
import api from '../../lib/api';
import {
  addAnswer,
  createQuestion,
  fetchQuestion,
  fetchQuestions,
  resolveQuestion,
} from '../../api/forum.api';
import type { ForumAnswer, ForumPagination, ForumQuestion } from '../../api/forum.api';

const PAGE_SIZE = 10;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type ForumTab = 'all' | 'open' | 'resolved';

interface CurrentUser {
  id: string;
  role: string;
}

function getCurrentUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const parsed = JSON.parse(raw) as { id?: string; role?: string };
      if (parsed.id && parsed.role) return { id: parsed.id, role: parsed.role };
    }
  } catch {
    // ignore malformed local storage
  }
  return null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function isTeacherRole(role: string): boolean {
  return role === 'TEACHER' || role === 'SUPER_ADMIN';
}

export default function DoubtForum() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const [tab, setTab] = useState<ForumTab>('all');
  const [allQuestions, setAllQuestions] = useState<ForumQuestion[]>([]);
  const [pagination, setPagination] = useState<ForumPagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Record<string, ForumQuestion>>({});
  const [threadLoadingId, setThreadLoadingId] = useState<string | null>(null);
  const [threadErrorId, setThreadErrorId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const paginationRef = useRef<ForumPagination | null>(null);
  const currentUser = useRef<CurrentUser | null>(getCurrentUser()).current;

  useEffect(() => {
    api
      .get<{ success: boolean; data: Batch[] }>('/batches')
      .then((res) => {
        if (res.data.success) {
          setBatches(res.data.data || []);
          setSelectedBatchId((prev) => prev || res.data.data?.[0]?.id || null);
        }
      })
      .catch(() => setError('Failed to load batches'))
      .finally(() => setBatchesLoading(false));
  }, []);

  const loadQuestions = useCallback(
    async (reset: boolean) => {
      if (!selectedBatchId) return;
      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const page = reset ? 1 : (paginationRef.current?.page ?? 0) + 1;
        const res = await fetchQuestions(selectedBatchId, page, PAGE_SIZE);
        paginationRef.current = res.pagination;
        setPagination(res.pagination);
        setAllQuestions((prev) => (reset ? res.questions : [...prev, ...res.questions]));
      } catch {
        setError('Failed to load questions. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedBatchId]
  );

  useEffect(() => {
    if (selectedBatchId) {
      setThreads({});
      setExpandedId(null);
      loadQuestions(true);
    }
  }, [selectedBatchId, loadQuestions]);

  const displayedQuestions =
    tab === 'all'
      ? allQuestions
      : allQuestions.filter((q) => (tab === 'open' ? !q.isResolved : q.isResolved));

  const hasMore = pagination ? allQuestions.length < pagination.total : false;

  const handleToggleQuestion = useCallback(
    (question: ForumQuestion) => {
      if (expandedId === question.id) {
        setExpandedId(null);
        return;
      }
      setExpandedId(question.id);
      setThreadErrorId(null);
      setReplyError(null);
      if (!threads[question.id]) {
        setThreadLoadingId(question.id);
        fetchQuestion(question.id)
          .then((thread) => setThreads((prev) => ({ ...prev, [question.id]: thread })))
          .catch(() => setThreadErrorId(question.id))
          .finally(() => setThreadLoadingId(null));
      }
    },
    [expandedId, threads]
  );

  const handleCreate = useCallback(async (formData: FormData): Promise<boolean> => {
    try {
      await createQuestion(formData);
      setShowCreateModal(false);
      await loadQuestions(true);
      return true;
    } catch {
      return false;
    }
  }, [loadQuestions]);

  const handleReply = useCallback(
    async (questionId: string, body: string, file: File | null): Promise<boolean> => {
      setReplyingTo(questionId);
      setReplyError(null);
      const formData = new FormData();
      formData.append('body', body);
      if (file) formData.append('image', file);
      try {
        const answer = await addAnswer(questionId, formData);
        setThreads((prev) => {
          const thread = prev[questionId];
          if (!thread) return prev;
          return {
            ...prev,
            [questionId]: {
              ...thread,
              answers: [...(thread.answers ?? []), answer],
              _count: { answers: (thread._count?.answers ?? 0) + 1 },
            },
          };
        });
        setAllQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId ? { ...q, _count: { answers: (q._count?.answers ?? 0) + 1 } } : q
          )
        );
        return true;
      } catch {
        setReplyError('Failed to submit your answer. Please try again.');
        return false;
      } finally {
        setReplyingTo(null);
      }
    },
    []
  );

  const handleResolve = useCallback(async (questionId: string) => {
    setResolvingId(questionId);
    setActionError(null);
    try {
      const updated = await resolveQuestion(questionId);
      setThreads((prev) => ({ ...prev, [questionId]: updated }));
      setAllQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, isResolved: true } : q))
      );
    } catch {
      setActionError('Failed to mark this question as resolved.');
    } finally {
      setResolvingId(null);
    }
  }, []);

  return (
    <div className="max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-100">Doubt Forum</h3>
          <p className="text-sm text-slate-500 mt-1">
            Ask questions and clear your doubts with teachers and classmates.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!selectedBatchId}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-400 text-slate-950 text-sm font-medium rounded-xl hover:bg-yellow-300 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-yellow-500/20"
        >
          <Plus className="w-4 h-4" />
          Ask a Doubt
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="relative">
          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={selectedBatchId ?? ''}
            onChange={(e) => setSelectedBatchId(e.target.value || null)}
            disabled={batchesLoading}
            className="pl-9 pr-8 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none appearance-none disabled:opacity-50"
          >
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
                {batch.gradeLevel ? ` · Class ${batch.gradeLevel}` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>

        <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1">
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'open', label: 'Open' },
              { key: 'resolved', label: 'Resolved' },
            ] as { key: ForumTab; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                tab === t.key ? 'bg-slate-900/70 text-yellow-300 shadow-sm' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 sm:ml-auto">
          {loading ? 'Loading...' : `${displayedQuestions.length} shown`}
        </span>
      </div>

      {actionError && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
          {actionError}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-sm text-red-300 flex-1">{error}</span>
          <button
            onClick={() => loadQuestions(true)}
            className="text-sm font-medium text-red-300 hover:text-red-100"
          >
            Retry
          </button>
        </div>
      )}

      <div className="space-y-4">
        {loading && <FeedSkeleton />}

        {!loading && batchesLoading && !selectedBatchId && (
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto text-blue-400 animate-spin" />
          </div>
        )}

        {!loading && !batchesLoading && batches.length === 0 && (
          <EmptyState
            icon={<GraduationCap className="w-8 h-8 text-blue-400" />}
            title="No batches found"
            description="Create a batch first so students can start asking doubts."
          />
        )}

        {!loading && selectedBatchId && displayedQuestions.length === 0 && !error && (
          <EmptyState
            icon={<HelpCircle className="w-8 h-8 text-blue-400" />}
            title={tab === 'all' ? 'No doubts yet' : `No ${tab} doubts`}
            description="Be the first to ask a doubt in this batch."
            action={
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-xl hover:bg-yellow-500/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ask a Doubt
              </button>
            }
          />
        )}

        {!loading &&
          selectedBatchId &&
          displayedQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              expanded={expandedId === question.id}
              thread={threads[question.id]}
              threadLoading={threadLoadingId === question.id}
              threadError={threadErrorId === question.id}
              replyingTo={replyingTo === question.id}
              replyError={replyError}
              resolving={resolvingId === question.id}
              currentUser={currentUser}
              onToggle={() => handleToggleQuestion(question)}
              onReply={handleReply}
              onResolve={handleResolve}
            />
          ))}
      </div>

      {hasMore && !loading && (
        <div className="mt-6 text-center">
          <button
            onClick={() => loadQuestions(false)}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-slate-200 bg-slate-900/40 border border-slate-700/50 rounded-xl hover:bg-slate-800/40 transition-colors disabled:opacity-50"
          >
            {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {showCreateModal && (
        <CreateQuestionModal
          batchId={selectedBatchId}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: ForumQuestion;
  expanded: boolean;
  thread?: ForumQuestion;
  threadLoading: boolean;
  threadError: boolean;
  replyingTo: boolean;
  replyError: string | null;
  resolving: boolean;
  currentUser: CurrentUser | null;
  onToggle: () => void;
  onReply: (questionId: string, body: string, file: File | null) => Promise<boolean>;
  onResolve: (questionId: string) => void;
}

function QuestionCard({
  question,
  expanded,
  thread,
  threadLoading,
  threadError,
  replyingTo,
  replyError,
  resolving,
  currentUser,
  onToggle,
  onReply,
  onResolve,
}: QuestionCardProps) {
  const canResolve =
    !!currentUser &&
    (isTeacherRole(currentUser.role) || question.author.id === currentUser.id);

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left p-5 hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-start gap-4">
          <Avatar name={question.author.name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-semibold text-slate-100">{question.title}</h4>
              {question.isResolved && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Resolved
                </span>
              )}
            </div>
            <p className={`mt-1 text-sm text-slate-400 ${expanded ? '' : 'line-clamp-2'}`}>
              {question.body}
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
              <span className="font-medium text-slate-400">{question.author.name}</span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {formatDate(question.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {question._count?.answers ?? 0} answers
              </span>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-800 px-5 py-5 space-y-5">
          {question.imageUrl && (
            <div className="rounded-xl overflow-hidden bg-slate-900/60 border border-slate-800 max-h-96">
              <img
                src={question.imageUrl}
                alt="Question attachment"
                className="w-full max-h-96 object-contain"
              />
            </div>
          )}

          <div>
            <h5 className="text-sm font-semibold text-slate-300 mb-3">
              Answers{' '}
              <span className="text-slate-500 font-normal">
                ({question._count?.answers ?? 0})
              </span>
            </h5>

            {threadLoading && (
              <div className="space-y-3">
                <div className="h-16 bg-slate-800 rounded-xl animate-pulse" />
                <div className="h-16 bg-slate-800 rounded-xl animate-pulse" />
              </div>
            )}

            {!threadLoading && threadError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Could not load the answers. Please collapse and reopen the question.
              </div>
            )}

            {!threadLoading && thread && thread.answers && thread.answers.length === 0 && (
              <p className="text-sm text-slate-500 italic">No answers yet. Be the first to reply.</p>
            )}

            {!threadLoading &&
              thread?.answers?.map((answer) => <AnswerItem key={answer.id} answer={answer} />)}
          </div>

          <ReplyBox
            submitting={replyingTo}
            error={replyError}
            onSubmit={(body, file) => onReply(question.id, body, file)}
          />

          {canResolve && (
            <div className="flex justify-end">
              {question.isResolved ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Resolved
                </span>
              ) : (
                <button
                  onClick={() => onResolve(question.id)}
                  disabled={resolving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                >
                  {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {resolving ? 'Marking...' : 'Mark as Resolved'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnswerItem({ answer }: { answer: ForumAnswer }) {
  return (
    <div className="flex items-start gap-3">
      <Avatar name={answer.author.name} size="sm" />
      <div className="flex-1 bg-slate-800/50 rounded-xl rounded-tl-none px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-slate-200">{answer.author.name}</span>
          <span className="text-xs text-slate-500">
            {formatDate(answer.createdAt)} · {formatTime(answer.createdAt)}
          </span>
        </div>
        <p className="text-sm text-slate-300 whitespace-pre-wrap">{answer.body}</p>
        {answer.imageUrl && (
          <div className="mt-3 rounded-lg overflow-hidden border border-slate-700 max-h-72">
            <img
              src={answer.imageUrl}
              alt="Answer attachment"
              className="w-full max-h-72 object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface ReplyBoxProps {
  submitting: boolean;
  error: string | null;
  onSubmit: (body: string, file: File | null) => Promise<boolean>;
}

function ReplyBox({ submitting, error, onSubmit }: ReplyBoxProps) {
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFileError(null);
    if (!selected) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(selected.type)) {
      setFileError('Only JPEG, PNG, or WebP images are allowed.');
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || submitting) return;
    const ok = await onSubmit(body.trim(), file);
    if (ok) {
      setBody('');
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your answer..."
        rows={3}
        className="w-full px-3 py-2.5 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none resize-none bg-slate-900/60 text-slate-100 placeholder-slate-500"
      />

      {previewUrl && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Answer preview"
            className="h-24 w-32 object-cover rounded-lg border border-slate-700"
          />
          <button
            type="button"
            onClick={() => {
              setFile(null);
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }}
            className="absolute -top-2 -right-2 bg-slate-800 rounded-full shadow border border-slate-700 p-0.5 text-slate-400 hover:text-slate-100"
            aria-label="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {(fileError || error) && (
        <p className="text-xs text-red-400">{fileError || error}</p>
      )}

      <div className="flex items-center justify-between gap-3">
        <label className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-100 cursor-pointer">
          <ImagePlus className="w-4 h-4" />
          {file ? 'Change image' : 'Add image'}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        </label>
        <button
          type="submit"
          disabled={!body.trim() || submitting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-950 bg-yellow-400 rounded-xl hover:bg-yellow-300 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {submitting ? 'Posting...' : 'Post Answer'}
        </button>
      </div>
    </form>
  );
}

interface CreateQuestionModalProps {
  batchId: string | null;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<boolean>;
}

function CreateQuestionModal({ batchId, onClose, onSubmit }: CreateQuestionModalProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFileError(null);
    if (!selected) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(selected.type)) {
      setFileError('Only JPEG, PNG, or WebP images are allowed.');
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('body', body.trim());
    if (batchId) formData.append('batchId', batchId);
    if (file) formData.append('image', file);
    const ok = await onSubmit(formData);
    if (!ok) {
      setError('Failed to post your doubt. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <h4 className="text-lg font-semibold text-slate-100">Ask a Doubt</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How does electromagnetic induction work?"
              className="w-full px-3 py-2.5 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-slate-900/60 text-slate-100 placeholder-slate-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Question *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the full question. Upload a photo of your handwritten work if needed."
              rows={4}
              className="w-full px-3 py-2.5 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none resize-none bg-slate-900/60 text-slate-100 placeholder-slate-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Attachment</label>
            {previewUrl ? (
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt="Attachment preview"
                  className="h-28 w-40 object-cover rounded-xl border border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }}
                  className="absolute -top-2 -right-2 bg-slate-800 rounded-full shadow border border-slate-700 p-0.5 text-slate-400 hover:text-slate-100"
                  aria-label="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-700 rounded-xl px-4 py-6 text-slate-400 hover:border-yellow-500/50 hover:text-yellow-300 cursor-pointer transition-colors">
                <ImagePlus className="w-6 h-6" />
                <span className="text-sm font-medium">Click to upload an image</span>
                <span className="text-xs text-slate-500">JPEG, PNG, or WebP · up to 5MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFile}
                />
              </label>
            )}
            {fileError && <p className="mt-1 text-xs text-red-400">{fileError}</p>}
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800/60 rounded-xl hover:bg-slate-700/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-slate-950 bg-yellow-400 rounded-xl hover:bg-yellow-300 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Posting...' : 'Post Doubt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-700 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-700 rounded w-2/3" />
              <div className="h-3 bg-slate-800 rounded w-full" />
              <div className="h-3 bg-slate-800 rounded w-1/2" />
              <div className="h-3 bg-slate-800 rounded w-24" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
      {icon}
      <h4 className="text-lg font-semibold text-slate-100 mt-4">{title}</h4>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className={`${size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'} rounded-full bg-blue-600/30 flex items-center justify-center font-semibold text-blue-300 shrink-0`}
    >
      {initials}
    </div>
  );
}
