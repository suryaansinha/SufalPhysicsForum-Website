import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  Building2,
  Phone,
  Mail,
  MessageCircle,
  PlaySquare,
  FileText,
  X,
} from 'lucide-react';
import type { Institute } from '../../types';
import { fetchInstituteSettings, updateInstituteSettings } from '../../api/institute.api';

interface SettingsForm {
  name: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  youtubeUrl: string;
  aboutDescription: string;
}

const EMPTY_FORM: SettingsForm = {
  name: '',
  phone: '',
  email: '',
  whatsappNumber: '',
  youtubeUrl: '',
  aboutDescription: '',
};

const inputClass =
  'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white';

const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function Settings() {
  const [form, setForm] = useState<SettingsForm>(EMPTY_FORM);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyInstitute = useCallback((institute: Institute) => {
    setForm({
      name: institute.name ?? '',
      phone: institute.phone ?? '',
      email: institute.email ?? '',
      whatsappNumber: institute.whatsappNumber ?? '',
      youtubeUrl: institute.youtubeUrl ?? '',
      aboutDescription: institute.aboutDescription ?? '',
    });
    setLogoPreview(institute.logoUrl ?? null);
    setLogoFile(null);
  }, []);

  useEffect(() => {
    let active = true;
    fetchInstituteSettings()
      .then((institute) => {
        if (active) applyInstitute(institute);
      })
      .catch(() => {
        if (active) setToast({ type: 'error', message: 'Failed to load institute settings.' });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyInstitute]);

  const handleFieldChange = (
    field: keyof SettingsForm,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (file: File | undefined) => {
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (saving) return;
    if (!form.name.trim()) {
      setToast({ type: 'error', message: 'Institute name cannot be empty.' });
      return;
    }
    setSaving(true);
    setToast(null);
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('phone', form.phone.trim());
      formData.append('email', form.email.trim());
      formData.append('whatsappNumber', form.whatsappNumber.trim());
      formData.append('youtubeUrl', form.youtubeUrl.trim());
      formData.append('aboutDescription', form.aboutDescription.trim());
      if (logoFile) {
        formData.append('image', logoFile);
      }
      const updated = await updateInstituteSettings(formData);
      applyInstitute(updated);
      setToast({ type: 'success', message: 'Institute settings saved successfully.' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save institute settings.';
      setToast({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Institute Settings</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your institute profile and branding</p>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg border ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span
            className={`text-sm font-medium ${
              toast.type === 'success' ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            {toast.message}
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="max-w-3xl space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h4 className="text-base font-semibold text-gray-900">Institute Logo</h4>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="relative w-28 h-28 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Institute logo preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-gray-300" />
                )}
                {logoFile && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    aria-label="Remove selected logo"
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-gray-900/70 text-white flex items-center justify-center hover:bg-gray-900"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 w-fit"
                >
                  <Upload className="w-4 h-4" />
                  {logoFile ? 'Choose different image' : 'Upload logo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleLogoChange(e.target.files?.[0])}
                />
                <p className="text-xs text-gray-500">
                  PNG, JPEG or WebP. Max 5 MB.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h4 className="text-base font-semibold text-gray-900">Institute Information</h4>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Institute Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Sufal Physics Forum"
                />
              </div>

              <div>
                <label className={labelClass}>Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="e.g. contact@sufalphysics.com"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>WhatsApp Number</label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.whatsappNumber}
                    onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>YouTube Channel URL</label>
                <div className="relative">
                  <PlaySquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={form.youtubeUrl}
                    onChange={(e) => handleFieldChange('youtubeUrl', e.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="https://youtube.com/@sufalphysics"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>About Description</label>
                <textarea
                  value={form.aboutDescription}
                  onChange={(e) => handleFieldChange('aboutDescription', e.target.value)}
                  rows={5}
                  className={`${inputClass} resize-y`}
                  placeholder="Describe your institute..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
