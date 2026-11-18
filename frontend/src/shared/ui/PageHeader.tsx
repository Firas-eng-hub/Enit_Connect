import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';

export interface PageHeaderProps {
  title: string;
  description?: string;
  backButton?: boolean;
  backTo?: string;
  actions?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  backButton,
  backTo,
  actions,
  badge,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={cn('mb-6 pb-5 border-b border-line', className)}>
      {backButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-3 -ms-2 text-muted-foreground hover:text-ink"
          leftIcon={<ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />}
        >
          {t('common.back')}
        </Button>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-ink">{title}</h1>
            {badge}
          </div>
          {description && (
            <p className="mt-1 text-muted-foreground max-w-prose">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>
    </header>
  );
}
