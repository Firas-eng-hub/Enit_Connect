import { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, children, align = 'right', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className={cn(
              'absolute z-50 mt-2 min-w-[200px] bg-surface rounded-xl border border-border',
              'shadow-dropdown animate-scale-in origin-top overflow-hidden',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            <div className="p-1" onClick={() => setIsOpen(false)}>
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function DropdownItem({ children, onClick, disabled, danger, icon, className }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors rounded-lg',
        'appearance-none border-0 bg-transparent',
        'hover:bg-neutral-100 focus-visible:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed',
        danger && 'text-danger-600 hover:bg-danger-50',
        className
      )}
    >
      {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-border" />;
}

export interface DropdownButtonProps {
  children: ReactNode;
  className?: string;
}

export function DropdownButton({ children, className }: DropdownButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium',
        'bg-surface border border-neutral-300 rounded-lg',
        'hover:bg-neutral-50 transition-colors',
        className
      )}
    >
      {children}
      <ChevronDown className="w-4 h-4" />
    </button>
  );
}
