import { Link } from 'react-router-dom';
import { Newspaper, BarChart2, Users, Info } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const navItems = [
  { path: '/visitor/news', label: 'News', icon: Newspaper },
  { path: '/visitor/statistics', label: 'Statistics', icon: BarChart2 },
  { path: '/visitor/members', label: 'Members', icon: Users },
  { path: '/visitor/about', label: 'About', icon: Info },
];

interface VisitorNavbarProps {
  currentPath?: string;
}

export function VisitorNavbar({ currentPath }: VisitorNavbarProps) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/visitor/news" className="text-xl font-bold text-primary-600">
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

          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-secondary text-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary text-sm">
              Register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
