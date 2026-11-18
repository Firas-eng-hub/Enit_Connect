import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { StatusPage, primaryLinkClass, secondaryButtonClass } from './StatusPage';

export function ForbiddenPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  return (
    <StatusPage
      code="403"
      title={t('errors.forbiddenTitle')}
      body={t('errors.forbiddenBody')}
      actions={
        <>
          {isAuthenticated ? (
            <Link to="/" className={primaryLinkClass}>{t('errors.home')}</Link>
          ) : (
            <Link to="/login" className={primaryLinkClass}>{t('auth.signIn')}</Link>
          )}
          <button type="button" onClick={() => window.history.back()} className={secondaryButtonClass}>
            {t('errors.goBack')}
          </button>
        </>
      }
    />
  );
}
