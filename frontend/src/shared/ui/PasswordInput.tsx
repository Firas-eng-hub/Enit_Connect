import { forwardRef, useRef, useState, type InputHTMLAttributes, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { AnimatedEye } from './AnimatedEye';

export type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Classes for the wrapping element (the input keeps `className`). */
  wrapperClassName?: string;
};

const assignRef = <T,>(ref: Ref<T> | undefined, value: T | null) => {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as React.MutableRefObject<T | null>).current = value;
};

/**
 * Password input with an animated show/hide eye. Works with react-hook-form
 * (`{...register('password')}`). Toggling keeps focus and caret position.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, wrapperClassName, ...props }, ref) => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const toggle = () => {
      const input = inputRef.current;
      const start = input?.selectionStart ?? null;
      const end = input?.selectionEnd ?? null;
      setVisible((v) => !v);
      requestAnimationFrame(() => {
        if (!input || document.activeElement !== input) return;
        if (start !== null && end !== null) input.setSelectionRange(start, end);
      });
    };

    return (
      <div className={cn('relative', wrapperClassName)}>
        <input
          {...props}
          ref={(el) => {
            inputRef.current = el;
            assignRef(ref, el);
          }}
          type={visible ? 'text' : 'password'}
          className={cn(className, 'pe-12')}
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggle}
          disabled={props.disabled}
          aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          aria-pressed={visible}
          aria-controls={props.id}
          className={cn(
            'absolute inset-y-0 my-auto end-1.5 grid h-9 w-9 place-items-center rounded-md transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:opacity-50',
            visible ? 'text-primary-700 hover:bg-primary-50' : 'text-neutral-500 hover:text-ink hover:bg-canvas'
          )}
        >
          <AnimatedEye open={visible} className="h-5 w-5" />
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
