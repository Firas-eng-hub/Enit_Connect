import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-ink mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full h-10 px-3 py-2 rounded-md border text-ink bg-surface placeholder:text-neutral-500',
            'focus:outline-none focus-visible:outline-none focus:border-ink focus:ring-2 focus:ring-gold/40 focus-visible:shadow-none',
            'disabled:bg-neutral-100 disabled:cursor-not-allowed',
            error ? 'border-danger-600 focus:border-danger-600 focus:ring-danger-600/20' : 'border-neutral-400 hover:border-neutral-500',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p id={`${selectId}-error`} className="mt-1.5 text-sm text-danger-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
