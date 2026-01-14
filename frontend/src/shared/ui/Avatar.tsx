import { type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps) {
  const initials = fallback
    ? fallback
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'Avatar'}
        className={cn(
          'inline-block rounded-full object-cover ring-2 ring-surface',
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'bg-gradient-to-br from-primary-400 to-primary-600 text-white font-medium',
        sizes[size],
        className
      )}
      role="img"
      aria-label={alt || fallback || 'Avatar'}
    >
      {initials}
    </div>
  );
}

export interface AvatarGroupProps {
  children: ReactNode;
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}

export function AvatarGroup({ children, max = 4, size = 'md', className }: AvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const visibleAvatars = childArray.slice(0, max);
  const remainingCount = childArray.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleAvatars}
      {remainingCount > 0 && (
        <div
          className={cn(
            'inline-flex items-center justify-center rounded-full',
            'bg-neutral-200 text-neutral-600 font-medium ring-2 ring-surface',
            sizes[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
