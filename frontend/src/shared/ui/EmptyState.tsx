import { type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {icon && (
        <div className="mb-3 text-neutral-400" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-ink mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-5">{description}</p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          leftIcon={action.icon || <Plus className="w-4 h-4" />}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
