import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Shield, Mail, Search, UserPlus, FileText, MessageSquare, LogOut } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function AdminSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const navItems = [
    { path: '/admin/home', label: t('nav.newsManagement'), icon: Home },
    { path: '/admin/send', label: t('nav.sendEmail'), icon: Mail },
    { path: '/admin/search', label: t('nav.searchUsers'), icon: Search },
    { path: '/admin/add', label: t('nav.addUsers'), icon: UserPlus },
    { path: '/admin/documents', label: t('nav.documents'), icon: FileText },
    { path: '/admin/messages', label: t('nav.messages'), icon: MessageSquare },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/visitor/news');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-700">
        <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold">{t('nav.dashboard')}</span>
      </div>

      {/* Admin info */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
            <Shield className="w-5 h-5 text-gray-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.name || 'Admin'}
            </p>
            <p className="text-xs text-gray-400">{t('profile.administrator')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-4 py-6">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-400 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  );
}
