import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'accent';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const { t } = useTranslation();
    const baseStyles = cn(
      'inline-flex items-center justify-center whitespace-nowrap font-medium rounded-md border',
      'transition-colors duration-150',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
    );

    // `accent` and `success` are kept for API compatibility and map onto the
    // primary style: one filled action colour across the product.
    const variants = {
      primary: 'bg-ink border-ink text-white hover:bg-primary-800 hover:border-primary-800',
      accent: 'bg-ink border-ink text-white hover:bg-primary-800 hover:border-primary-800',
      success: 'bg-success-600 border-success-600 text-white hover:bg-success-700 hover:border-success-700',
      secondary: 'bg-surface border-neutral-300 text-ink hover:bg-canvas hover:border-neutral-400',
      outline: 'bg-surface border-neutral-300 text-ink hover:bg-canvas hover:border-neutral-400',
      ghost: 'bg-transparent border-transparent text-body hover:bg-neutral-100 hover:text-ink',
      danger: 'bg-danger-600 border-danger-600 text-white hover:bg-danger-700 hover:border-danger-700',
    };

    const sizes = {
      xs: 'h-7 px-2.5 text-xs gap-1',
      sm: 'h-8 px-3 text-sm gap-1.5',
      md: 'h-9 px-4 text-sm gap-2',
      lg: 'h-11 px-5 text-base gap-2',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>{t('common.loading')}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0 rtl:-scale-x-100" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

