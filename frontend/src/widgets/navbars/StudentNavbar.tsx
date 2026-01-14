import { Link, useNavigate } from 'react-router-dom';
import { Home, User, Search, FileText, LogOut } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';

const navItems = [
  { path: '/user/home', label: 'Offers', icon: Home },
  { path: '/user/profile', label: 'Profile', icon: User },
  { path: '/user/search', label: 'Search', icon: Search },
  { path: '/user/documents', label: 'Documents', icon: FileText },
];

interface StudentNavbarProps {
  currentPath?: string;
}

export function StudentNavbar({ currentPath }: StudentNavbarProps) {
  const { logout, userName } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/visitor/news');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/user/home" className="text-xl font-bold text-primary-600">
              ENIT Connect
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Hi, {userName}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
