import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, MapPin, GraduationCap, Calendar, Camera } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
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

    setUploadingPicture(true);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information</p>
      </div>

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">
          Profile updated successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
      )}

      <div className="card">
        {/* Profile header with picture */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <div className="relative">
              {profile?.picture ? (
                <img
                  src={profile.picture}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePictureUpload}
                  className="hidden"
                  disabled={uploadingPicture}
                />
              </label>
              {uploadingPicture && (
                <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {profile?.firstname} {profile?.lastname}
              </h2>
              <p className="text-gray-500">{profile?.email}</p>
              <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                profile?.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {profile?.status}
              </span>
            </div>
          </div>
        </div>

        {/* Profile form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="btn-secondary"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    reset(profile || {});
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" /> First Name
              </label>
              <input
                {...register('firstname')}
                disabled={!editing}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" /> Last Name
              </label>
              <input
                {...register('lastname')}
                disabled={!editing}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" /> Email
              </label>
              <input
                value={profile?.email || ''}
                disabled
                className="input bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" /> Phone
              </label>
              <input
                {...register('phone')}
                disabled={!editing}
                className="input"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <GraduationCap className="w-4 h-4 inline mr-1" /> Class
              </label>
              <select {...register('class')} disabled={!editing} className="input">
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" /> Promotion
              </label>
              <select {...register('promotion')} disabled={!editing} className="input">
                <option value="">Select year</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" /> Country
              </label>
              <input
                {...register('country')}
                disabled={!editing}
                className="input"
                placeholder="Enter country"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" /> City
              </label>
              <input
                {...register('city')}
                disabled={!editing}
                className="input"
                placeholder="Enter city"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
