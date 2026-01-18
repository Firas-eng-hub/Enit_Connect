import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { Avatar } from '@/shared/ui/Avatar';
import { Dropdown, DropdownItem, DropdownDivider } from '@/shared/ui/Dropdown';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Import the actual ENIT logo
import enitLogo from '@/assets/img/ENIT.png';

interface TopbarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Topbar({ onMenuClick, showMenuButton = true }: TopbarProps) {
  const { user, userName, userType, logout } = useAuth();
  const navigate = useNavigate();
  const [notificationCount] = useState(3); // Mock notification count

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
