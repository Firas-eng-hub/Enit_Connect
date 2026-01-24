/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export type ToastVariant = 'default' | 'success' | 'danger' | 'warning' | 'info';

export interface Toast {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Helper hooks for common toast patterns
export function useToastHelpers() {
  const { addToast } = useToast();

  return {
    success: (message: string, title?: string) =>
      addToast({ message, title, variant: 'success' }),
    error: (message: string, title?: string) =>
      addToast({ message, title, variant: 'danger' }),
    warning: (message: string, title?: string) =>
      addToast({ message, title, variant: 'warning' }),
    info: (message: string, title?: string) =>
      addToast({ message, title, variant: 'info' }),
  };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 11);
    const newToast: Toast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const variantConfig = {
  default: {
    icon: null,
    containerClass: 'bg-surface border-border text-foreground',
    iconClass: '',
  },
  success: {
    icon: CheckCircle2,
    containerClass: 'bg-success-50 border-success-200 text-success-800',
    iconClass: 'text-success-500',
  },
  danger: {
    icon: AlertCircle,
    containerClass: 'bg-danger-50 border-danger-200 text-danger-800',
    iconClass: 'text-danger-500',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'bg-warning-50 border-warning-200 text-warning-800',
    iconClass: 'text-warning-500',
  },
  info: {
    icon: Info,
    containerClass: 'bg-info-50 border-info-200 text-info-800',
    iconClass: 'text-info-500',
  },
};

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const config = variantConfig[toast.variant || 'default'];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-elevated',
        'animate-slide-up',
        config.containerClass
      )}
    >
      {Icon && <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconClass)} />}
      <div className="flex-1 min-w-0">
        {toast.title && <p className="font-semibold">{toast.title}</p>}
        <p className="text-sm">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
