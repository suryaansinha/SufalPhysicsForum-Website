import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, Video, Plus, ExternalLink,
  FileText, Upload, Download, BookOpenCheck, Loader2, PlayCircle,
} from 'lucide-react';
import api from '../lib/api';
import type { Batch, LiveClass, StudyMaterial, Homework, ApiResponse } from '../types';
import VideoModal from '../components/VideoModal';

type Tab = 'live' | 'materials' | 'homework';

interface MatForm {
  title: string;
  description: string;
  category: string;
  materialType: 'file' | 'youtube';
  file: File | null;
  youtubeUrl: string;
}

interface HwForm {
  title: string;
  description: string;
  dueDate: string;
  file: File | null;
}

export default function BatchDetailsPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('live');
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showLiveForm, setShowLiveForm] = useState(false);
  const [liveForm, setLiveForm] = useState({ title: '', agenda: '', scheduledFor: '', durationMins: '60' });
  const [submittingLive, setSubmittingLive] = useState(false);

  const [showMatForm, setShowMatForm] = useState(false);
  const [matForm, setMatForm] = useState<MatForm>({ title: '', description: '', category: 'NOTES', materialType: 'file', file: null, youtubeUrl: '' });
  const [submittingMat, setSubmittingMat] = useState(false);
  const [uploading, setUploading] = useState(false);
  const matFileRef = useRef<HTMLInputElement>(null);

  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [videoModalTitle, setVideoModalTitle] = useState('');

  const [showHwForm, setShowHwForm] = useState(false);
  const [hwForm, setHwForm] = useState<HwForm>({ title: '', description: '', dueDate: '', file: null });
  const [submittingHw, setSubmittingHw] = useState(false);
  const hwFileRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Batch>>(`/batches/${batchId}`);
      if (res.data.success && res.data.data) {
        setBatch(res.data.data);
      }
    } catch {
      setError('Failed to load batch details');
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  const fetchLiveClasses = useCallback(async () => {
    if (!batchId) return;
    try {
      const res = await api.get<ApiResponse<LiveClass[]>>(`/live-classes/batch/${batchId}`);
      if (res.data.success && res.data.data) setClasses(res.data.data);
    } catch {}
  }, [batchId]);

  const fetchMaterials = useCallback(async () => {
    if (!batchId) return;
    try {
      const res = await api.get<ApiResponse<StudyMaterial[]>>(`/materials/batch/${batchId}`);
      if (res.data.success && res.data.data) setMaterials(res.data.data);
    } catch {}
  }, [batchId]);

  const fetchHomework = useCallback(async () => {
    if (!batchId) return;
    try {
      const res = await api.get<ApiResponse<Homework[]>>(`/homework/batch/${batchId}`);
      if (res.data.success && res.data.data) setHomework(res.data.data);
    } catch {}
  }, [batchId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchLiveClasses(); }, [fetchLiveClasses]);
  useEffect(() => { if (activeTab === 'materials') fetchMaterials(); }, [activeTab, fetchMaterials]);
  useEffect(() => { if (activeTab === 'homework') fetchHomework(); }, [activeTab, fetchHomework]);

  const handleScheduleLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || !liveForm.title || !liveForm.scheduledFor) return;
    setSubmittingLive(true);
    try {
      const res = await api.post<ApiResponse<LiveClass>>('/live-classes', {
        batchId,
        title: liveForm.title,
        agenda: liveForm.agenda || null,
        scheduledFor: liveForm.scheduledFor,
        durationMins: liveForm.durationMins,
      });
      if (res.data.success && res.data.data) {
        setClasses((prev) => [res.data.data!, ...prev]);
        setShowLiveForm(false);
        setLiveForm({ title: '', agenda: '', scheduledFor: '', durationMins: '60' });
      }
    } catch { setError('Failed to schedule class'); }
    finally { setSubmittingLive(false); }
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const isYoutube = matForm.materialType === 'youtube';
    if (!batchId || !matForm.title) return;
    if (!isYoutube && !matForm.file) return;
    if (isYoutube && !matForm.youtubeUrl) return;

    setSubmittingMat(true);
    setUploading(!isYoutube);
    try {
      const fd = new FormData();
      fd.append('batchId', batchId);
      fd.append('title', matForm.title);
      fd.append('description', matForm.description);
      fd.append('category', isYoutube ? 'YOUTUBE_VIDEO' : matForm.category);
      if (isYoutube) {
        fd.append('youtubeUrl', matForm.youtubeUrl);
      } else if (matForm.file) {
        fd.append('file', matForm.file);
      }

      const res = await api.post<ApiResponse<StudyMaterial>>('/materials', fd);
      if (res.data.success && res.data.data) {
        setMaterials((prev) => [res.data.data!, ...prev]);
        setShowMatForm(false);
        setMatForm({ title: '', description: '', category: 'NOTES', materialType: 'file', file: null, youtubeUrl: '' });
        if (matFileRef.current) matFileRef.current.value = '';
      }
    } catch { setError('Failed to upload material'); }
    finally { setSubmittingMat(false); setUploading(false); }
  };

  const handleAssignHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || !hwForm.title || !hwForm.dueDate) return;
    setSubmittingHw(true);
    try {
      const fd = new FormData();
      fd.append('batchId', batchId);
      fd.append('title', hwForm.title);
      fd.append('description', hwForm.description);
      fd.append('dueDate', hwForm.dueDate);
      if (hwForm.file) fd.append('file', hwForm.file);

      const res = await api.post<ApiResponse<Homework>>('/homework', fd);
      if (res.data.success && res.data.data) {
        setHomework((prev) => [res.data.data!, ...prev]);
        setShowHwForm(false);
        setHwForm({ title: '', description: '', dueDate: '', file: null });
        if (hwFileRef.current) hwFileRef.current.value = '';
      }
    } catch { setError('Failed to assign homework'); }
    finally { setSubmittingHw(false); }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const tabs: { key: Tab; label: string; icon: typeof Video }[] = [
    { key: 'live', label: 'Live Classes', icon: Video },
    { key: 'materials', label: 'Study Materials', icon: BookOpenCheck },
    { key: 'homework', label: 'Homework', icon: FileText },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
  }
  if (error || !batch) {
    return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error || 'Batch not found'}</div>;
  }

  return (
    <div>
      <button onClick={() => navigate('/dashboard/batches')} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Batches
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-2xl font-bold text-gray-900">{batch.name}</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {batch.gradeLevel && <span className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">Class {batch.gradeLevel}</span>}
          {batch.targetExam && <span className="text-xs font-medium px-2 py-1 bg-amber-50 text-amber-700 rounded-full">{batch.targetExam}</span>}
          <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{batch.subject}</span>
        </div>
        <div className="mt-3 text-sm text-gray-500 space-y-1">
          {batch.timing && <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{batch.timing}</div>}
          <div>{batch.enrollments?.length || 0} student{(batch.enrollments?.length || 0) !== 1 ? 's' : ''} enrolled</div>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === LIVE CLASSES TAB === */}
      {activeTab === 'live' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Live Classes</h4>
            <button onClick={() => setShowLiveForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" /> Schedule Class
            </button>
          </div>

          {showLiveForm && <LiveClassForm form={liveForm} setForm={setLiveForm} submitting={submittingLive} onSubmit={handleScheduleLive} onCancel={() => setShowLiveForm(false)} />}

          {classes.length === 0 ? (
            <EmptyState icon={Video} text="No live classes scheduled yet." />
          ) : (
            <div className="space-y-3">
              {classes.map((lc) => <LiveClassCard key={lc.id} lc={lc} batchId={batchId!} />)}
            </div>
          )}
        </div>
      )}

      {/* === STUDY MATERIALS TAB === */}
      {activeTab === 'materials' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Study Materials</h4>
            <button onClick={() => setShowMatForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              <Upload className="w-4 h-4" /> Upload Material
            </button>
          </div>

          {showMatForm && <MaterialForm ref={matFileRef} form={matForm} setForm={setMatForm} submitting={submittingMat} uploading={uploading} onSubmit={handleUploadMaterial} onCancel={() => setShowMatForm(false)} />}

          {materials.length === 0 ? (
            <EmptyState icon={BookOpenCheck} text="No study materials uploaded yet." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {materials.map((m) => {
                const isVideo = m.category === 'YOUTUBE_VIDEO';
                return (
                  <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isVideo ? 'bg-red-50' : 'bg-indigo-50'}`}>
                      {isVideo ? <PlayCircle className="w-5 h-5 text-red-500" /> : <FileText className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-semibold text-gray-900 truncate">{m.title}</h5>
                      {m.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{m.description}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${isVideo ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                          {isVideo ? 'Video' : m.category}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(m.createdAt)}</span>
                      </div>
                    </div>
                    {isVideo ? (
                      <button
                        onClick={() => { setVideoModalUrl(m.fileUrl); setVideoModalTitle(m.title); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors flex-shrink-0"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Play
                      </button>
                    ) : (
                      <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors flex-shrink-0">
                        <Download className="w-3.5 h-3.5" /> View
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === HOMEWORK TAB === */}
      {activeTab === 'homework' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Homework</h4>
            <button onClick={() => setShowHwForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" /> Assign Homework
            </button>
          </div>

          {showHwForm && <HomeworkForm ref={hwFileRef} form={hwForm} setForm={setHwForm} submitting={submittingHw} onSubmit={handleAssignHomework} onCancel={() => setShowHwForm(false)} />}

          {homework.length === 0 ? (
            <EmptyState icon={FileText} text="No homework assigned yet." />
          ) : (
            <div className="space-y-3">
              {homework.map((hw) => (
                <div key={hw.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                      <h5 className="text-base font-semibold text-gray-900">{hw.title}</h5>
                      {hw.description && <p className="text-sm text-gray-500 mt-1">{hw.description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Due: {formatDate(hw.dueDate)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTime(hw.dueDate)}</span>
                      </div>
                    </div>
                    {hw.fileUrl && (
                      <a href={hw.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors flex-shrink-0">
                        <Download className="w-3.5 h-3.5" /> Attachment
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {videoModalUrl && (
        <VideoModal
          videoUrl={videoModalUrl}
          title={videoModalTitle}
          onClose={() => { setVideoModalUrl(null); setVideoModalTitle(''); }}
        />
      )}
    </div>
  );
}

/* ===== Sub-Components ===== */

function EmptyState({ icon: Icon, text }: { icon: typeof Video; text: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <Icon className="w-10 h-10 text-gray-300 mx-auto" />
      <p className="text-gray-500 mt-4">{text}</p>
    </div>
  );
}

function LiveClassForm({ form, setForm, submitting, onSubmit, onCancel }: {
  form: { title: string; agenda: string; scheduledFor: string; durationMins: string };
  setForm: (f: typeof form) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h5 className="text-sm font-semibold text-gray-700 mb-4">Schedule a New Live Class</h5>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
            <input type="datetime-local" value={form.scheduledFor} onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Agenda</label>
          <textarea value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" />
        </div>
        <div className="max-w-[160px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
          <input type="number" value={form.durationMins} onChange={(e) => setForm({ ...form, durationMins: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
        </div>
        <FormActions submitting={submitting} label="Schedule" onCancel={onCancel} />
      </form>
    </div>
  );
}

function MaterialForm({ ref: fileRef, form, setForm, submitting, uploading, onSubmit, onCancel }: {
  ref: React.RefObject<HTMLInputElement | null>;
  form: MatForm;
  setForm: (f: MatForm) => void;
  submitting: boolean;
  uploading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const isYoutube = form.materialType === 'youtube';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h5 className="text-sm font-semibold text-gray-700 mb-4">Upload Study Material</h5>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, materialType: 'file' })}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                !isYoutube
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              File Upload (PDF)
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, materialType: 'youtube' })}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                isYoutube
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              YouTube Video
            </button>
          </div>
        </div>
        <Field label="Title *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
        {!isYoutube && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
              <option value="NOTES">Notes</option>
              <option value="ASSIGNMENT">Assignment</option>
              <option value="QUESTION_PAPER">Question Paper</option>
              <option value="SOLUTION">Solution</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" />
        </div>
        {isYoutube ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL *</label>
            <input
              type="url"
              value={form.youtubeUrl}
              onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File * (PDF, DOC, Images)</label>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" required={!isYoutube} />
          </div>
        )}
        {uploading && !isYoutube && <UploadingIndicator />}
        <FormActions submitting={submitting} label={isYoutube ? 'Save Video' : 'Upload'} onCancel={onCancel} />
      </form>
    </div>
  );
}

function HomeworkForm({ ref: fileRef, form, setForm, submitting, onSubmit, onCancel }: {
  ref: React.RefObject<HTMLInputElement | null>;
  form: HwForm;
  setForm: (f: HwForm) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h5 className="text-sm font-semibold text-gray-700 mb-4">Assign Homework</h5>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
            <input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (optional)</label>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
        </div>
        <FormActions submitting={submitting} label="Assign" onCancel={onCancel} />
      </form>
    </div>
  );
}

function LiveClassCard({ lc, batchId }: { lc: LiveClass; batchId: string }) {
  const navigate = useNavigate();
  const isPast = new Date(lc.scheduledFor) < new Date();
  const isLive = !isPast && new Date(lc.scheduledFor).getTime() - Date.now() < 10 * 60 * 1000 && new Date(lc.scheduledFor).getTime() + lc.durationMins * 60 * 1000 > Date.now();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2">
            <h5 className="text-base font-semibold text-gray-900">{lc.title}</h5>
            {isLive && <span className="text-xs font-bold px-2 py-0.5 bg-red-50 text-red-600 rounded-full animate-pulse">LIVE</span>}
          </div>
          {lc.agenda && <p className="text-sm text-gray-500 mt-1">{lc.agenda}</p>}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(lc.scheduledFor).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(lc.scheduledFor).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ({lc.durationMins} min)</span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/dashboard/batches/${batchId}/live/${lc.id}`)}
          disabled={isPast}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex-shrink-0 ${isPast ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
          {isPast ? 'Ended' : isLive ? (<><ExternalLink className="w-4 h-4" />Join Now</>) : (<><ExternalLink className="w-4 h-4" />Join Class</>)}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" required={required} />
    </div>
  );
}

function FormActions({ submitting, label, onCancel }: { submitting: boolean; label: string; onCancel: () => void }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
      <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">{submitting ? `${label}...` : label}</button>
    </div>
  );
}

function UploadingIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-indigo-600">
      <Loader2 className="w-4 h-4 animate-spin" />
      Uploading file...
    </div>
  );
}
