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
                'peer h-[18px] w-[18px] shrink-0 rounded-sm border cursor-pointer',
                'appearance-none bg-surface',
                'checked:bg-ink checked:border-ink',
                'hover:border-neutral-500',
                                'disabled:cursor-not-allowed disabled:opacity-50',
                error ? 'border-danger-600' : 'border-neutral-400',
                className
              )}
              {...props}
            />
            <Check 
              className={cn(
                'absolute top-[3px] start-[3px] h-3 w-3 text-white pointer-events-none',
                'opacity-0 peer-checked:opacity-100'
              )}
              strokeWidth={3}
            />
          </div>
        </div>
        {(label || description) && (
          <div className="ms-3 text-sm leading-6">
            {label && (
              <label htmlFor={checkboxId} className="font-medium text-ink cursor-pointer">
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
