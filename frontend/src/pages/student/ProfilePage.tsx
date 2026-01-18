import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, MapPin, GraduationCap, Calendar, Camera, Briefcase, Linkedin, FileText } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import { getApiErrorMessage, validateFile } from '@/shared/lib/utils';
import type { Student } from '@/entities/student/types';

const classes = [
  '1st CS 1', '1st CS 2', '1st CS 3',
  '2nd CS 1', '2nd CS 2', '2nd CS 3',
  '3rd CS 1', '3rd CS 2', '3rd CS 3',
  '1st Tel 1', '1st Tel 2', '1st Tel 3',
  '2nd Tel 1', '2nd Tel 2', '2nd Tel 3',
  '3rd Tel 1', '3rd Tel 2', '3rd Tel 3',
];

export function ProfilePage() {
  const [profile, setProfile] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<Partial<Student>>();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2000 + 5 }, (_, i) => (2000 + i).toString());

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const response = await httpClient.get(`/api/student/${userId}`);
      setProfile(response.data);
      reset(response.data);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Partial<Student>) => {
    setSaving(true);
    setError(null);
    try {
      const userId = localStorage.getItem('user_id');
      await httpClient.patch(`/api/student/${userId}`, data);
      setSuccess(true);
      setEditing(false);
      fetchProfile();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingPicture(true);
    setUploadError(null);
    try {
      const userId = localStorage.getItem('user_id');
      const formData = new FormData();
      formData.append('name', file.name);
      formData.append('image', file);

      await httpClient.post(`/api/student/upload/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchProfile();
    } catch (err) {
      console.error('Failed to upload picture:', err);
      setUploadError(getApiErrorMessage(err, 'Failed to upload picture. Please try again.'));
    } finally {
      setUploadingPicture(false);
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
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-8 py-10 shadow-xl mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-primary-100 text-lg">Manage your personal information and preferences</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 p-4 rounded-xl mb-6 shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-semibold">Profile updated successfully!</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-red-700 p-4 rounded-xl mb-6 shadow-md">
          {error}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Profile header with picture */}
        <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex flex-col items-center md:items-start">
              <div className="relative group">
              {profile?.picture ? (
                <img
                  src={profile.picture}
                  alt="Profile"
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-2xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-white/20 backdrop-blur-sm border-4 border-white flex items-center justify-center shadow-2xl">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
              <label className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-all shadow-lg group-hover:scale-110">
                <Camera className="w-5 h-5 text-primary-600" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePictureUpload}
                  className="hidden"
                  disabled={uploadingPicture}
                />
              </label>
                {uploadingPicture && (
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
              <h2 className="text-3xl font-bold text-white mb-2">
                {profile?.firstname} {profile?.lastname}
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
                {profile?.type && (
                  <span className="inline-flex items-center gap-1 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-bold">
                    <GraduationCap className="w-4 h-4" />
                    {profile.type}
                  </span>
                )}
                {profile?.class && (
                  <span className="inline-flex items-center gap-1 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-bold">
                    Class: {profile.class}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Personal Information</h3>
              <p className="text-gray-500 mt-1">Update your profile details and contact information</p>
            </div>
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    reset(profile || {});
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl disabled:opacity-50"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 text-primary-600" /> First Name
              </label>
              <input
                {...register('firstname')}
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
                <User className="w-4 h-4 text-primary-600" /> Last Name
              </label>
              <input
                {...register('lastname')}
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
                <Mail className="w-4 h-4 text-primary-600" /> Email
              </label>
              <input
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4 text-primary-600" /> Phone
              </label>
              <input
                {...register('phone')}
                disabled={!editing}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                  editing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500' 
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <GraduationCap className="w-4 h-4 text-primary-600" /> Class
              </label>
              <select 
                {...register('class')} 
                disabled={!editing} 
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                  editing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500' 
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-primary-600" /> Promotion
              </label>
              <select 
                {...register('promotion')} 
                disabled={!editing} 
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                  editing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500' 
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                <option value="">Select year</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-primary-600" /> Country
              </label>
              <input
                {...register('country')}
                disabled={!editing}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                  editing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500' 
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
                placeholder="Enter country"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-primary-600" /> City
              </label>
              <input
                {...register('city')}
                disabled={!editing}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                  editing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500' 
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
                placeholder="Enter city"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-primary-600" /> Address
              </label>
              <input
                {...register('address')}
                disabled={!editing}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                  editing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500' 
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
                placeholder="Enter address"
              />
              <p className="text-xs text-gray-500 mt-1">Required for map location</p>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 text-primary-600" /> Currently Working At
              </label>
              <input
                {...register('workAt')}
                disabled={!editing}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                  editing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500' 
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Linkedin className="w-4 h-4 text-primary-600" /> LinkedIn Profile
              </label>
              <input
                {...register('linkedin')}
                disabled={!editing}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                  editing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500' 
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <FileText className="w-4 h-4 text-primary-600" /> About Me
              </label>
              <textarea
                {...register('aboutme')}
                disabled={!editing}
                rows={4}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                  editing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500' 
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
