import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Building2, Mail, Phone, Globe, MapPin, Camera } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import { getApiErrorMessage, validateFile } from '@/shared/lib/utils';
import { config } from '@/app/config/env';
import type { Company } from '@/entities/company/types';

export function ProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<Partial<Company>>();

  const resolveLogoSrc = (logo?: string | null) => {
    if (!logo) return null;
    const trimmed = logo.trim();
    if (!trimmed) return null;
    const apiBase = config.apiUrl || window.location.origin;

    if (trimmed.startsWith('/uploads')) {
      return config.apiUrl ? `${config.apiUrl}${trimmed}` : trimmed;
    }
    if (trimmed.startsWith('uploads/')) {
      return config.apiUrl ? `${config.apiUrl}/${trimmed}` : `/${trimmed}`;
    }
    if (
      trimmed.startsWith('http://localhost') ||
      trimmed.startsWith('http://127.0.0.1') ||
      trimmed.startsWith('http://0.0.0.0') ||
      trimmed.startsWith('https://localhost') ||
      trimmed.startsWith('https://127.0.0.1')
    ) {
      try {
        const url = new URL(trimmed);
        return `${apiBase}${url.pathname}`;
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  };

  const fetchProfile = useCallback(async () => {
    try {
      const companyId = localStorage.getItem('company_id');
      const response = await httpClient.get(`/api/company/info?id=${companyId}`);
      setProfile(response.data);
      reset(response.data);
    } catch (err) {
      setError(t('pagesMisc.profileFailed'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [reset, t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onSubmit = async (data: Partial<Company>) => {
    setSaving(true);
    setError(null);
    try {
      await httpClient.patch(`/api/company/update`, data);
      setSuccess(true);
      setEditing(false);
      fetchProfile();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(t('pagesMisc.profileUpdateFailed'));
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file, {
      maxSizeMB: 5,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
      label: 'image',
    });
    if (validationError) {
      setUploadError(validationError);
      e.target.value = '';
      return;
    }

    setUploadingLogo(true);
    setUploadError(null);
    try {
      const companyId = localStorage.getItem('company_id');
      const formData = new FormData();
      formData.append('name', file.name);
      formData.append('image', file);

      await httpClient.post(`/api/company/upload/${companyId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchProfile();
    } catch (err) {
      console.error('Failed to upload logo:', err);
      setUploadError(getApiErrorMessage(err, t('pagesMisc.logoFailed')));
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error && !profile) {
    return <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>;
  }

  return (
    <div>
      <div className="mb-8 pb-5 border-b border-line">
        <h1 className="text-2xl font-semibold text-ink mb-2">{t('profile.companyProfile')}</h1>
        <p className="text-muted-foreground text-lg">{t('profile.companyInfoDesc')}</p>
      </div>

      {success && (
        <div className="bg-success-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-semibold">{t('profile.profileUpdated')}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-danger-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-ink relative px-4 py-12 text-sm">
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex flex-col items-center md:items-start">
              <div className="relative group">
                {resolveLogoSrc(profile?.logo) ? (
                  <img
                    src={resolveLogoSrc(profile?.logo) as string}
                    alt={t('pagesMisc.companyLogoAlt')}
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-white"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-white/20 border-4 border-white flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-white" />
                  </div>
                )}
                <label className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                  <Camera className="w-5 h-5 text-primary-600" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                </label>
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-white/90 rounded-2xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                  </div>
                )}
              </div>
              {uploadError && (
                <p className="mt-3 text-sm text-red-100 bg-red-500/20 border border-red-200/30 rounded-lg px-3 py-2">
                  {uploadError}
                </p>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-semibold text-white mb-2">
                {profile?.name}
              </h2>
              <p className="text-primary-100 text-lg mb-3">{profile?.email}</p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${
                  profile?.status === 'Active'
                    ? 'bg-green-500 text-white'
                    : 'bg-yellow-500 text-white'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${profile?.status === 'Active' ? 'bg-white' : 'bg-white'} animate-pulse`}></div>
                  {profile?.status}
                </span>
                {profile?.sector && (
                  <span className="inline-flex items-center gap-1 px-4 py-2 bg-white/20 text-white rounded-xl text-sm font-semibold">
                    {profile.sector}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900">{t('profile.companyInfo')}</h3>
              <p className="text-gray-500 mt-1">{t('profile.companyInfoDescForm')}</p>
            </div>
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="bg-ink px-4 py-2 text-white rounded-md transition-colors font-medium hover:bg-primary-800 text-sm"
              >
                {t('common.editProfile')}
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    reset(profile || {});
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-success-600 px-4 py-2 text-white rounded-md transition-colors font-medium disabled:opacity-50 hover:bg-success-700 text-sm"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border border-white border-t-transparent" />
                      <span>{t('common.saving')}</span>
                    </div>
                  ) : (
                    t('common.saveChanges')
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Building2 className="w-4 h-4 text-primary-600" /> {t('profile.companyName')}
              </label>
              <input
                {...register('name')}
                disabled={!editing}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                  editing
                    ? 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 text-primary-600" /> {t('profile.email')}
              </label>
              <input
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">{t('profile.emailCannotChange')}</p>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Building2 className="w-4 h-4 text-primary-600" /> {t('profile.sector')}
              </label>
              <input
                {...register('sector')}
                disabled={!editing}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                  editing
                    ? 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
                placeholder="e.g., IT, Engineering, Finance"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4 text-primary-600" /> {t('profile.phone')}
              </label>
              <input
                {...register('phone')}
                disabled={!editing}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                  editing
                    ? 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
                placeholder={t('pagesMisc.phonePh')}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Globe className="w-4 h-4 text-primary-600" /> {t('profile.website')}
              </label>
              <input
                {...register('website')}
                disabled={!editing}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                  editing
                    ? 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-primary-600" /> {t('profile.address')}
              </label>
              <input
                {...register('address')}
                disabled={!editing}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                  editing
                    ? 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
                placeholder={t('pagesMisc.addressPh')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Building2 className="w-4 h-4 text-primary-600" /> {t('profile.description')}
              </label>
              <textarea
                {...register('description')}
                disabled={!editing}
                rows={4}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                  editing
                    ? 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
                placeholder={t('pagesMisc.aboutCompanyPh')}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
