import { type ReactNode } from 'react';
import { FileQuestion, Inbox, Search, AlertCircle, Plus } from 'lucide-react';
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
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {icon && (
        <div className="mb-4 p-4 rounded-full bg-neutral-100 text-neutral-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground max-w-md mb-6">{description}</p>
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

// Pre-built empty states for common scenarios
export function EmptyStateNoData({ 
  title = 'No data yet',
  description = 'Get started by creating your first item.',
  action,
  className 
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={<Inbox className="w-8 h-8" />}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}

export function EmptyStateNoResults({ 
  title = 'No results found',
  description = 'Try adjusting your search or filters.',
  action,
  className 
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={<Search className="w-8 h-8" />}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}

export function EmptyStateError({ 
  title = 'Something went wrong',
  description = 'We encountered an error loading this data.',
  action,
  className 
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={<AlertCircle className="w-8 h-8 text-danger-500" />}
      title={title}
      description={description}
      action={action ? { ...action, icon: action.icon } : undefined}
      className={className}
    />
  );
}

export function EmptyStateNotFound({ 
  title = 'Page not found',
  description = 'The page you are looking for does not exist or has been moved.',
  action,
  className 
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={<FileQuestion className="w-8 h-8" />}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}
