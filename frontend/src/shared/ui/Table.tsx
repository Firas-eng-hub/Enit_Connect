import { type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

export interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-border', className)}>
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <thead className={cn('bg-neutral-50', className)}>
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
    <tr className={cn('hover:bg-neutral-50/50 transition-colors', className)}>
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
        'px-4 py-3 font-semibold text-foreground',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
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
        align === 'right' && 'text-right',
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

export function TableEmpty({ colSpan, icon, title = 'No data', description, action }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center">
          {icon && <div className="mb-4 text-neutral-300">{icon}</div>}
          <p className="font-medium text-foreground">{title}</p>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </td>
    </tr>
  );
}
