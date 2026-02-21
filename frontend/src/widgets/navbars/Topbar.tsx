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

  const userMenuTrigger = (
    <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
      <Avatar
        src={null}
        fallback={userName || user?.name || 'User'}
        size="sm"
      />
      <div className="hidden md:block text-left">
        <p className="text-sm font-medium text-foreground line-clamp-1">
          {userName || user?.name || 'User'}
        </p>
        <p className="text-xs text-muted-foreground capitalize">{userType}</p>
      </div>
      <ChevronDown className="w-4 h-4 text-neutral-400 hidden md:block" />
    </button>
  );

  return (
    <header className="dashboard-topbar">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left section */}
        <div className="flex items-center gap-3">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src={enitLogo}
              alt="ENIT Logo"
              className="w-10 h-10 object-contain"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-primary-900">ENIT-Connect</h1>
              <p className="text-xs text-muted-foreground -mt-0.5">{t('topbar.tagline')}</p>
            </div>
          </Link>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            onClick={handleNotifications}
            className="relative p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
            aria-label={t('nav.notifications')}
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* User menu */}
          <Dropdown trigger={userMenuTrigger} align="right">
            <DropdownItem icon={<User className="w-4 h-4" />} onClick={handleProfile}>
              {t('nav.profile')}
            </DropdownItem>
            <DropdownItem
              icon={<Settings className="w-4 h-4" />}
              onClick={handleSettings}
            >
              {t('nav.settings')}
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem
              icon={<LogOut className="w-4 h-4" />}
              onClick={handleLogout}
              danger
            >
              {t('auth.logout')}
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
