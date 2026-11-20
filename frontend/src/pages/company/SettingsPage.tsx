import { Building2, Bell, Lock, Globe } from 'lucide-react';
import { PasswordInput } from '@/shared/ui/PasswordInput';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import httpClient from '@/shared/api/httpClient';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';

const PREFERENCES_UPDATED_EVENT = 'auth:preferences-updated';

export function SettingsPage() {
  const { t } = useTranslation();

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState<string | null>(null);


  const loadPreferences = useCallback(async () => {
    setPrefsLoading(true);
    try {
      const response = await httpClient.get('/api/auth/preferences');
      const notifications = response.data?.notifications || {};
      setEmailNotifications(Boolean(notifications.emailNotifications));
      setPushNotifications(Boolean(notifications.pushNotifications));
      setPrefsMessage(null);
    } catch {
      setPrefsMessage(t('common.error'));
    } finally {
      setPrefsLoading(false);
    }
  }, [t]);

  useEffect(() => { loadPreferences(); }, [loadPreferences]);

  const savePreferences = async (patch: { emailNotifications?: boolean; pushNotifications?: boolean }) => {
    setPrefsSaving(true);
    try {
      const response = await httpClient.patch('/api/auth/preferences', patch);
      const notifications = response.data?.notifications || {};
      setEmailNotifications(Boolean(notifications.emailNotifications));
      setPushNotifications(Boolean(notifications.pushNotifications));
      window.dispatchEvent(new CustomEvent(PREFERENCES_UPDATED_EVENT, { detail: { notifications } }));
      setPrefsMessage(t('common.success'));
    } catch {
      setPrefsMessage(t('common.error'));
      await loadPreferences();
    } finally {
      setPrefsSaving(false);
    }
  };

  const toggleEmail = () => { if (!prefsLoading && !prefsSaving) savePreferences({ emailNotifications: !emailNotifications }); };
  const togglePush = () => { if (!prefsLoading && !prefsSaving) savePreferences({ pushNotifications: !pushNotifications }); };

  return (
    <div>
      <div className="mb-8 pb-5 border-b border-line">
        <h1 className="text-2xl font-semibold text-ink mb-2">{t('settings.title')}</h1>
        <p className="text-muted-foreground text-lg">{t('settings.companySubtitle')}</p>
      </div>

      <div className="space-y-6">
        {/* Company account */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-canvas px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-primary-50 w-10 h-10 rounded-xl flex items-center justify-center text-primary-700">
                <Building2 className="w-5 h-5 text-primary-700" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{t('settings.account.title')}</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('settings.account.email')}</label>
              <input type="email" defaultValue="contact@company.com" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('settings.account.changePassword')}</label>
              <PasswordInput autoComplete="new-password" placeholder={t('settings.account.passwordPlaceholder')} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-canvas px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-primary-50 w-10 h-10 rounded-xl flex items-center justify-center text-primary-700">
                <Bell className="w-5 h-5 text-primary-700" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{t('settings.notifications.title')}</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: t('settings.notifications.email'), desc: t('settings.notifications.emailDescCompany'), value: emailNotifications, toggle: toggleEmail },
              { label: t('settings.notifications.push'), desc: t('settings.notifications.pushDescCompany'), value: pushNotifications, toggle: togglePush },
            ].map(({ label, desc, value, toggle }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{label}</h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
                <button onClick={toggle} disabled={prefsLoading || prefsSaving} className={`relative w-14 h-8 rounded-full transition-colors ${value ? 'bg-primary-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            ))}
          </div>
          {prefsMessage && (
            <p className={`text-sm px-6 pb-4 ${prefsMessage === t('common.success') ? 'text-emerald-600' : 'text-red-600'}`}>{prefsMessage}</p>
          )}
        </div>

        {/* Privacy */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-canvas px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-primary-50 w-10 h-10 rounded-xl flex items-center justify-center text-primary-700">
                <Lock className="w-5 h-5 text-primary-700" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{t('settings.privacy.title')}</h2>
            </div>
          </div>
          <div className="p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('settings.privacy.visibilityCompany')}</label>
            <select value={profileVisibility} onChange={(e) => setProfileVisibility(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white">
              <option value="public">{t('settings.privacy.publicCompany')}</option>
              <option value="verified">{t('settings.privacy.verifiedCompany')}</option>
              <option value="private">{t('settings.privacy.privateCompany')}</option>
            </select>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-canvas px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-primary-50 w-10 h-10 rounded-xl flex items-center justify-center text-primary-700">
                <Globe className="w-5 h-5 text-primary-700" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{t('settings.language.title')}</h2>
            </div>
          </div>
          <div className="p-6">
            <LanguageSwitcher variant="settings" />
          </div>
        </div>

        <div className="flex justify-end">
          <span className="px-6 py-3 text-sm font-semibold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            {t('settings.notifications.autoSave')}
          </span>
        </div>
      </div>
    </div>
  );
}
