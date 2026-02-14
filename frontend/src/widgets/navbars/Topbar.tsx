import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { Avatar } from '@/shared/ui/Avatar';
import { Dropdown, DropdownItem, DropdownDivider } from '@/shared/ui/Dropdown';
import { useAuth } from '@/features/auth/hooks/useAuth';
import httpClient from '@/shared/api/httpClient';

// Import the actual ENIT logo
import enitLogo from '@/assets/img/ENIT.png';

interface TopbarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

const PREFERENCES_UPDATED_EVENT = 'auth:preferences-updated';

export function Topbar({ onMenuClick, showMenuButton = true }: TopbarProps) {
  const { user, userName, userType, logout } = useAuth();
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(0);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const pushNotificationsEnabledRef = useRef(true);
  const previousNotificationCount = useRef<number | null>(null);

  useEffect(() => {
    pushNotificationsEnabledRef.current = pushNotificationsEnabled;
  }, [pushNotificationsEnabled]);

  useEffect(() => {
    if (!userType) return;
    previousNotificationCount.current = null;

    const applyPushPreference = (enabled: boolean) => {
      setPushNotificationsEnabled(enabled);
      pushNotificationsEnabledRef.current = enabled;
      if (
        enabled &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'default'
      ) {
        Notification.requestPermission().catch(() => {});
      }
    };

    const fetchPreferences = () => {
      httpClient.get('/api/auth/preferences')
        .then((response) => {
          const enabled = response.data?.notifications?.pushNotifications !== false;
          applyPushPreference(enabled);
        })
        .catch(() => {
          applyPushPreference(true);
        });
    };

    const fetchUnreadCount = () => {
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
                ? 'You received a new notification.'
                : `You received ${delta} new notifications.`;
            // Browser notification for critical awareness while user is in other tabs/apps.
            new Notification(`ENIT Connect (${label})`, { body });
          }
          previousNotificationCount.current = nextCount;
        })
        .catch(() => {
          setNotificationCount(0);
          previousNotificationCount.current = null;
        });
    };

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
    window.addEventListener('notifications:refresh', handleRefresh);

    const intervalId = window.setInterval(fetchUnreadCount, 30000);
    return () => {
      window.removeEventListener(PREFERENCES_UPDATED_EVENT, handlePreferencesUpdated);
      window.removeEventListener('notifications:refresh', handleRefresh);
      window.clearInterval(intervalId);
    };
  }, [userType]);

  const handleLogout = async () => {
    await logout();
  };

  const handleNotifications = () => {
    const basePath = userType === 'admin' ? '/admin' : userType === 'company' ? '/company' : '/user';
    navigate(`${basePath}/notifications`);
  };

  const handleSettings = () => {
    const basePath = userType === 'admin' ? '/admin' : userType === 'company' ? '/company' : '/user';
    navigate(`${basePath}/settings`);
  };
  
  const handleProfile = () => {
    if (userType === 'admin') {
      navigate('/admin/settings');
      return;
    }
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
              <p className="text-xs text-muted-foreground -mt-0.5">Career Platform</p>
            </div>
          </Link>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button 
            onClick={handleNotifications}
            className="relative p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
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
              Profile
            </DropdownItem>
            <DropdownItem 
              icon={<Settings className="w-4 h-4" />}
              onClick={handleSettings}
            >
              Settings
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem 
              icon={<LogOut className="w-4 h-4" />} 
              onClick={handleLogout}
              danger
            >
              Sign out
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
