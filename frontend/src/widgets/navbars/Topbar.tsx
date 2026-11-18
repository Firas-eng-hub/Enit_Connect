import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, Bell, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { Avatar } from '@/shared/ui/Avatar';
import { Dropdown, DropdownItem, DropdownDivider } from '@/shared/ui/Dropdown';
import { useAuth } from '@/features/auth/hooks/useAuth';
import httpClient from '@/shared/api/httpClient';
import { useSSENotifications } from '@/hooks/useSSENotifications';

// Import the actual ENIT logo
import enitLogo from '@/assets/img/ENIT.png';

interface TopbarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

const PREFERENCES_UPDATED_EVENT = 'auth:preferences-updated';
const NOTIFICATIONS_REFRESH_EVENT = 'notifications:refresh';
const NOTIFICATIONS_NEW_EVENT = 'notifications:new';

export function Topbar({ onMenuClick, showMenuButton = true }: TopbarProps) {
  const { user, userName, userType, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [notificationCount, setNotificationCount] = useState(0);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const pushNotificationsEnabledRef = useRef(true);
  const previousNotificationCount = useRef<number | null>(null);
  const notificationRole = userType === 'admin' ? 'admin' : userType === 'company' ? 'company' : 'student';

  const applyPushPreference = useCallback((enabled: boolean) => {
    setPushNotificationsEnabled(enabled);
    pushNotificationsEnabledRef.current = enabled;
    if (
      enabled &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().catch(() => { });
    }
  }, []);

  const fetchPreferences = useCallback(() => {
    httpClient.get('/api/auth/preferences')
      .then((response) => {
        const enabled = response.data?.notifications?.pushNotifications !== false;
        applyPushPreference(enabled);
      })
      .catch(() => {
        applyPushPreference(true);
      });
  }, [applyPushPreference]);

  const fetchUnreadCount = useCallback(() => {
    if (!userType) return;
    const endpoint = userType === 'admin'
      ? '/api/admin/notifications/unread-count'
      : userType === 'company'
        ? '/api/company/notifications/unread-count'
        : '/api/student/notifications/unread-count';

    httpClient.get(endpoint)
      .then((response) => {
        const nextCount = response.data?.count ?? 0;
        const previousCount = previousNotificationCount.current;
        setNotificationCount(nextCount);
        if (
          pushNotificationsEnabledRef.current &&
          previousCount !== null &&
          nextCount > previousCount &&
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          const delta = nextCount - previousCount;
          const label = userType === 'admin' ? 'admin' : userType === 'company' ? 'company' : 'student';
          const body =
            delta === 1
              ? t('notifications.newOne')
              : t('notifications.newMany', { count: delta });
          new Notification(`ENIT Connect (${label})`, { body });
        }
        previousNotificationCount.current = nextCount;
      })
      .catch(() => {
        setNotificationCount(0);
        previousNotificationCount.current = null;
      });
  }, [userType, t]);

  useEffect(() => {
    pushNotificationsEnabledRef.current = pushNotificationsEnabled;
  }, [pushNotificationsEnabled]);

  useEffect(() => {
    if (!userType) return;
    previousNotificationCount.current = null;

    fetchPreferences();
    fetchUnreadCount();

    const handlePreferencesUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ notifications?: { pushNotifications?: boolean } }>;
      const pushPref = customEvent.detail?.notifications?.pushNotifications;
      if (typeof pushPref === 'boolean') {
        applyPushPreference(pushPref);
        return;
      }
      fetchPreferences();
    };

    const handleRefresh = () => fetchUnreadCount();
    window.addEventListener(PREFERENCES_UPDATED_EVENT, handlePreferencesUpdated);
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefresh);

    const intervalId = window.setInterval(fetchUnreadCount, 30000);
    return () => {
      window.removeEventListener(PREFERENCES_UPDATED_EVENT, handlePreferencesUpdated);
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefresh);
      window.clearInterval(intervalId);
    };
  }, [applyPushPreference, fetchPreferences, fetchUnreadCount, userType]);

  useSSENotifications({
    role: notificationRole,
    enabled: Boolean(userType),
    onNotification: () => {
      fetchUnreadCount();
      window.dispatchEvent(new Event(NOTIFICATIONS_NEW_EVENT));
    },
  });

  const handleLogout = async () => { await logout(); };

  const handleNotifications = () => {
    const basePath = userType === 'admin' ? '/admin' : userType === 'company' ? '/company' : '/user';
    navigate(`${basePath}/notifications`);
  };

  const handleSettings = () => {
    const basePath = userType === 'admin' ? '/admin' : userType === 'company' ? '/company' : '/user';
    navigate(`${basePath}/settings`);
  };

  const handleProfile = () => {
    if (userType === 'admin') { navigate('/admin/settings'); return; }
    const basePath = userType === 'company' ? '/company' : '/user';
    navigate(`${basePath}/profile`);
  };

  const displayName = userName || user?.name || t('auth.' + (userType || 'student'));
  const roleLabel = userType ? t(`auth.${userType}`) : '';

  const userMenuTrigger = (
    <button
      type="button"
      className="flex items-center gap-2.5 rounded-md px-2 py-1 hover:bg-canvas"
      aria-haspopup="menu"
    >
      <Avatar src={null} fallback={displayName} size="sm" />
      <span className="hidden md:block text-start leading-tight">
        <span className="block text-sm font-medium text-ink line-clamp-1">{displayName}</span>
        <span className="block text-xs text-muted-foreground">{roleLabel}</span>
      </span>
      <ChevronDown className="w-4 h-4 text-neutral-500 hidden md:block" aria-hidden="true" />
    </button>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[var(--topbar-height)] border-b border-line bg-surface">
      <div className="h-full px-3 sm:px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {showMenuButton && (
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-ink hover:bg-canvas"
              aria-label={t('visitor.nav.openMenu')}
              aria-controls="app-sidebar"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 px-1">
            <img src={enitLogo} alt="" className="w-8 h-8 object-contain" />
            <span className="hidden sm:block font-semibold text-ink">ENIT Connect</span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNotifications}
            className="relative p-2 rounded-md text-body hover:bg-canvas hover:text-ink"
            aria-label={
              notificationCount > 0
                ? `${t('nav.notifications')} (${notificationCount})`
                : t('nav.notifications')
            }
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            {notificationCount > 0 && (
              <span
                className="absolute top-1 end-1 min-w-4 h-4 px-1 bg-danger-600 text-white text-[10px] font-medium rounded-full flex items-center justify-center tabular-nums"
                aria-hidden="true"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          <Dropdown trigger={userMenuTrigger} align="right">
            <DropdownItem icon={<User className="w-4 h-4" />} onClick={handleProfile}>
              {t('nav.profile')}
            </DropdownItem>
            <DropdownItem icon={<Settings className="w-4 h-4" />} onClick={handleSettings}>
              {t('nav.settings')}
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem icon={<LogOut className="w-4 h-4" />} onClick={handleLogout} danger>
              {t('auth.logout')}
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
