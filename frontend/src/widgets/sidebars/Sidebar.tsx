import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type LucideIcon, X, ChevronsLeft } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useSidebarCollapsed } from './useSidebarCollapsed';

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

/**
 * App navigation. Fixed at ≥lg, off-canvas below. Uses logical properties so
 * it sits on the right in Arabic. Active item: ink text, light tint and the
 * gold inline-start marker. At ≥lg it can collapse to an icon-only rail.
 */
export function Sidebar({ sections, isOpen, onClose, footer }: SidebarProps) {
  const { t } = useTranslation();
  const { collapsed, toggle } = useSidebarCollapsed();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-950/40 lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="app-sidebar"
        className={cn(
          'fixed start-0 bottom-0 z-40 w-[var(--sidebar-width)] top-[var(--topbar-height)]',
          'flex flex-col bg-surface border-e border-line',
          'transition-[transform,width] duration-150',
          !isOpen && 'max-lg:ltr:-translate-x-full max-lg:rtl:translate-x-full'
        )}
      >
        <div className="flex justify-end px-3 pt-3 lg:hidden">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-500 hover:text-ink hover:bg-canvas"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label={t('visitor.nav.main')} className="flex-1 overflow-y-auto px-3 py-4 lg:py-6">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={cn(sectionIndex > 0 && (collapsed ? 'mt-6 lg:mt-3' : 'mt-6'))}>
              {section.title && (
                <h2 className={cn('px-3 mb-1.5 text-xs font-medium text-muted-foreground', collapsed && 'lg:sr-only')}>
                  {section.title}
                </h2>
              )}
              {collapsed && sectionIndex > 0 && (
                <div className="hidden lg:block mx-2 mb-3 h-px bg-line" aria-hidden="true" />
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end
                        onClick={onClose}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          cn(
                            'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                            collapsed && 'lg:justify-center lg:px-0',
                            isActive
                              ? 'bg-primary-50 text-ink before:absolute before:inset-y-1.5 before:start-0 before:w-[3px] before:rounded-full before:bg-gold'
                              : 'text-body hover:bg-canvas hover:text-ink'
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              className={cn('w-[18px] h-[18px] flex-shrink-0', isActive ? 'text-ink' : 'text-neutral-500')}
                              aria-hidden="true"
                            />
                            <span className={cn('flex-1 truncate', collapsed && 'lg:sr-only')}>{item.label}</span>
                            {item.badge !== undefined && item.badge !== '' && (
                              <span className={cn(collapsed && 'lg:hidden', 'rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-700 tabular-nums')}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {footer && <div className={cn('p-4 border-t border-line', collapsed && 'lg:hidden')}>{footer}</div>}

        <div className="hidden lg:block border-t border-line p-3">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar"
            title={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-canvas hover:text-ink',
              collapsed && 'justify-center px-0'
            )}
          >
            <ChevronsLeft
              className={cn('w-[18px] h-[18px] flex-shrink-0 text-neutral-500 transition-transform rtl:rotate-180', collapsed && 'rotate-180 rtl:rotate-0')}
              aria-hidden="true"
            />
            <span className={cn('truncate', collapsed && 'sr-only')}>
              {collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
