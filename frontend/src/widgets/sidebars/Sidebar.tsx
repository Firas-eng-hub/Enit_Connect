import { Link, useLocation } from 'react-router-dom';
import { type LucideIcon, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface SidebarNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
}

export interface SidebarSection {
  title?: string;
  items: SidebarNavItem[];
}

export interface SidebarProps {
  sections: SidebarSection[];
  isOpen: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
}

export function Sidebar({ sections, isOpen, onClose, footer }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 bottom-0 z-40 w-[280px]',
          'bg-surface border-r border-border',
          'flex flex-col',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={cn(sectionIndex > 0 && 'mt-8')}>
              {section.title && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => onClose()}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                          'text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-primary-900 text-white shadow-sm'
                            : 'text-neutral-600 hover:bg-neutral-100 hover:text-foreground'
                        )}
                      >
                        <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-accent-400')} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              'px-2 py-0.5 text-xs font-medium rounded-full',
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-accent-100 text-accent-700'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-border">
            {footer}
          </div>
        )}
      </aside>
    </>
  );
}
