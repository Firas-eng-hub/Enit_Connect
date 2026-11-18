import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StatusPage, primaryLinkClass, secondaryButtonClass } from './StatusPage';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <StatusPage
      code="404"
      title={t('errors.notFoundTitle')}
      body={t('errors.notFoundBody')}
      actions={
        <>
          <Link to="/" className={primaryLinkClass}>{t('errors.home')}</Link>
          <button type="button" onClick={() => window.history.back()} className={secondaryButtonClass}>
            {t('errors.goBack')}
          </button>
        </>
      }
    />
  );
}
