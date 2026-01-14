import { Link, useNavigate } from 'react-router-dom';
import { Home, Mail, Search, UserPlus, FileText, MessageSquare, LogOut } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';

const navItems = [
  { path: '/admin/home', label: 'News', icon: Home },
  { path: '/admin/send', label: 'Send Email', icon: Mail },
  { path: '/admin/search', label: 'Search', icon: Search },
  { path: '/admin/add', label: 'Add Users', icon: UserPlus },
  { path: '/admin/documents', label: 'Documents', icon: FileText },
  { path: '/admin/messages', label: 'Messages', icon: MessageSquare },
];

interface AdminNavbarProps {
  currentPath?: string;
}

export function AdminNavbar({ currentPath }: AdminNavbarProps) {
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
            <Link to="/admin/home" className="text-xl font-bold text-primary-600">
              ENIT Connect <span className="text-xs text-gray-500">Admin</span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center space-x-1">
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
            <span className="text-sm text-gray-600">{userName}</span>
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
