import { useTranslation } from 'react-i18next';
import { type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

export interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={cn('overflow-x-auto rounded-lg border border-line bg-surface', className)}>
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <thead className={cn('bg-canvas', className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: TableProps) {
  return (
    <tbody className={cn('divide-y divide-border', className)}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className }: TableProps) {
  return (
    <tr className={cn('hover:bg-canvas', className)}>
      {children}
    </tr>
  );
}

export interface TableHeadProps {
  children?: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function TableHead({ children, className, align = 'left' }: TableHeadProps) {
  return (
    <th
      className={cn(
        'px-4 py-2.5 text-start text-xs font-medium text-muted-foreground',
        align === 'center' && 'text-center',
        align === 'right' && 'text-end',
        className
      )}
    >
      {children}
    </th>
  );
}

export interface TableCellProps {
  children?: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function TableCell({ children, className, align = 'left' }: TableCellProps) {
  return (
    <td
      className={cn(
        'px-4 py-3 text-foreground',
        align === 'center' && 'text-center',
        align === 'right' && 'text-end',
        className
      )}
    >
      {children}
    </td>
  );
}

export interface TableEmptyProps {
  colSpan: number;
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function TableEmpty({ colSpan, icon, title, description, action }: TableEmptyProps) {
  const { t } = useTranslation();
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center">
          {icon && <div className="mb-3 text-neutral-400" aria-hidden="true">{icon}</div>}
          <p className="font-medium text-ink">{title ?? t('common.noData')}</p>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </td>
    </tr>
  );
}
