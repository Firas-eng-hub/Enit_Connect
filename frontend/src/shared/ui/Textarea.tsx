import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-ink mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full px-3 py-2 rounded-md border text-ink bg-surface placeholder:text-neutral-500 resize-y',
            'focus:outline-none focus-visible:outline-none focus:border-ink focus:ring-2 focus:ring-gold/40 focus-visible:shadow-none',
            'disabled:bg-neutral-100 disabled:cursor-not-allowed',
            error ? 'border-danger-600 focus:border-danger-600 focus:ring-danger-600/20' : 'border-neutral-400 hover:border-neutral-500',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          {...props}
        />
        {error && <p id={`${textareaId}-error`} className="mt-1.5 text-sm text-danger-600">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
