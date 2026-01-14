import { Link, useLocation } from 'react-router-dom';
import { Home, Newspaper, BarChart3, Users, Info } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const navItems = [
  { path: '/visitor/news', label: 'News', icon: Newspaper },
  { path: '/visitor/statistics', label: 'Statistics', icon: BarChart3 },
  { path: '/visitor/members', label: 'Members', icon: Users },
  { path: '/visitor/about', label: 'About', icon: Info },
];

export function VisitorSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
        <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
          <Home className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">ENIT Connect</span>
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
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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

      {/* Login/Register buttons */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="space-y-2">
          <Link
            to="/login"
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </aside>
  );
}
