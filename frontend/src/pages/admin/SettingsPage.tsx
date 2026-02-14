import { Shield, Bell, Lock, Globe, Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import httpClient from '@/shared/api/httpClient';

const PREFERENCES_UPDATED_EVENT = 'auth:preferences-updated';

export function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState<string | null>(null);

  const loadPreferences = async () => {
    setPrefsLoading(true);
    try {
      const response = await httpClient.get('/api/auth/preferences');
      const notifications = response.data?.notifications || {};
      setEmailNotifications(Boolean(notifications.emailNotifications));
      setPushNotifications(Boolean(notifications.pushNotifications));
      setPrefsMessage(null);
    } catch {
      setPrefsMessage('Failed to load notification preferences.');
    } finally {
      setPrefsLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const savePreferences = async (patch: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  }) => {
    setPrefsSaving(true);
    try {
      const response = await httpClient.patch('/api/auth/preferences', patch);
      const notifications = response.data?.notifications || {};
      setEmailNotifications(Boolean(notifications.emailNotifications));
      setPushNotifications(Boolean(notifications.pushNotifications));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(PREFERENCES_UPDATED_EVENT, {
            detail: { notifications },
          })
        );
      }
      setPrefsMessage('Preferences saved.');
    } catch {
      setPrefsMessage('Unable to save preferences. Please retry.');
      await loadPreferences();
    } finally {
      setPrefsSaving(false);
    }
  };

  const toggleEmailNotifications = () => {
    if (prefsLoading || prefsSaving) return;
    savePreferences({ emailNotifications: !emailNotifications });
  };

  const togglePushNotifications = () => {
    if (prefsLoading || prefsSaving) return;
    savePreferences({ pushNotifications: !pushNotifications });
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 shadow-xl mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Admin Settings</h1>
        <p className="text-primary-100 text-lg">Manage system and account preferences</p>
      </div>

      <div className="space-y-6">
        {/* Admin Account Settings */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Admin Account</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Email</label>
              <input
                type="email"
                defaultValue="admin@enit.tn"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Change Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600">Add an extra layer of security</p>
              </div>
              <button
                onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  twoFactorAuth ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    twoFactorAuth ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-900">
                <strong>Recommended:</strong> Enable two-factor authentication to protect your admin account.
              </p>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-600">Receive system alerts via email</p>
              </div>
              <button
                onClick={toggleEmailNotifications}
                disabled={prefsLoading || prefsSaving}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  emailNotifications ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    emailNotifications ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Push Notifications</h3>
                <p className="text-sm text-gray-600">Receive browser notifications for critical events</p>
              </div>
              <button
                onClick={togglePushNotifications}
                disabled={prefsLoading || prefsSaving}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  pushNotifications ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    pushNotifications ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>
          {prefsMessage && (
            <p className={`text-sm ${prefsMessage.includes('saved') ? 'text-emerald-600' : 'text-red-600'}`}>
              {prefsMessage}
            </p>
          )}
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">System Settings</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
              <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white">
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
              <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white">
                <option value="africa/tunis">Africa/Tunis (GMT+1)</option>
                <option value="europe/paris">Europe/Paris (GMT+1)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <span className="px-6 py-3 text-sm font-semibold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            Notification preferences save automatically
          </span>
        </div>
      </div>
    </div>
  );
}
