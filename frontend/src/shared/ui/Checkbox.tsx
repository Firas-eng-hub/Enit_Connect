import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="relative flex items-start">
        <div className="flex h-6 items-center">
          <div className="relative">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              className={cn(
                'peer h-5 w-5 shrink-0 rounded border-2 cursor-pointer',
                'appearance-none bg-surface transition-colors duration-200',
                'checked:bg-primary-900 checked:border-primary-900',
                'hover:border-primary-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                error ? 'border-danger-500' : 'border-neutral-300',
                className
              )}
              {...props}
            />
            <Check 
              className={cn(
                'absolute top-0.5 left-0.5 h-4 w-4 text-white pointer-events-none',
                'opacity-0 peer-checked:opacity-100 transition-opacity'
              )}
              strokeWidth={3}
            />
          </div>
        </div>
        {(label || description) && (
          <div className="ml-3 text-sm leading-6">
            {label && (
              <label htmlFor={checkboxId} className="font-medium text-foreground cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
            {error && (
              <p className="text-danger-600 mt-1">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
