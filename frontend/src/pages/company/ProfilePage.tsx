import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, Mail, Phone, Globe, MapPin } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import type { Company } from '@/entities/company/types';

export function ProfilePage() {
  const [profile, setProfile] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset } = useForm<Partial<Company>>();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const companyId = localStorage.getItem('company_id');
      const response = await httpClient.get(`/api/company/info?id=${companyId}`);
      setProfile(response.data);
      reset(response.data);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Partial<Company>) => {
    setSaving(true);
    setError(null);
    try {
      const companyId = localStorage.getItem('company_id');
      await httpClient.patch(`/api/company/update?id=${companyId}`, data);
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
        <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
        <p className="text-gray-500 mt-1">Manage your company information</p>
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
        {/* Profile header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <div className="relative">
              {profile?.logo ? (
                <img
                  src={profile.logo}
                  alt="Company Logo"
                  className="w-24 h-24 rounded-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {profile?.name}
              </h2>
              <p className="text-gray-500">{profile?.sector || 'No sector specified'}</p>
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
            <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
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
                <Building2 className="w-4 h-4 inline mr-1" /> Company Name
              </label>
              <input
                {...register('name')}
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
                Sector
              </label>
              <input
                {...register('sector')}
                disabled={!editing}
                className="input"
                placeholder="e.g., IT, Engineering, Finance"
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
                <Globe className="w-4 h-4 inline mr-1" /> Website
              </label>
              <input
                {...register('website')}
                disabled={!editing}
                className="input"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" /> Address
              </label>
              <input
                {...register('address')}
                disabled={!editing}
                className="input"
                placeholder="Enter address"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                disabled={!editing}
                className="input h-32 resize-none"
                placeholder="Tell students about your company..."
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
