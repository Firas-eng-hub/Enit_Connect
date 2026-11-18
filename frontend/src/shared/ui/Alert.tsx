import { useTranslation } from 'react-i18next';
import { forwardRef, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const variantConfig = {
  info: {
    icon: Info,
    containerClass: 'bg-primary-50 border-primary-200 text-primary-900',
    iconClass: 'text-primary-700',
  },
  success: {
    icon: CheckCircle2,
    containerClass: 'bg-success-50 border-success-200 text-success-800',
    iconClass: 'text-success-600',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'bg-warning-50 border-warning-200 text-warning-800',
    iconClass: 'text-warning-600',
  },
  danger: {
    icon: AlertCircle,
    containerClass: 'bg-danger-50 border-danger-200 text-danger-800',
    iconClass: 'text-danger-600',
  },
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'info', title, children, onClose, className, action }, ref) => {
    const { t } = useTranslation();
    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative flex gap-3 p-4 rounded-md border',
          config.containerClass,
          className
        )}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconClass)} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          {title && <h5 className="font-semibold mb-1">{title}</h5>}
          <div className="text-sm">{children}</div>
          {action && (
            <button
              onClick={action.onClick}
              className="mt-3 text-sm font-medium underline underline-offset-2 hover:no-underline"
            >
              {action.label}
            </button>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';
