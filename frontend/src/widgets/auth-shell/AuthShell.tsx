import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';
import enitLogo from '@/assets/img/ENIT.png';
import campusImage from '@/assets/img/Acceuil.BG.jpg';

interface AuthShellProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Wider form column for multi-field forms such as registration. */
  wide?: boolean;
}

/**
 * Shared frame for sign-in, registration and verification.
 * Campus photo panel on large screens, form on a plain white column.
 */
export function AuthShell({ title, description, children, wide = false }: AuthShellProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] bg-surface">
      <aside className="relative hidden lg:block">
        <img src={campusImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ink/85" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-12 text-white">
          <Link to="/visitor/news" className="inline-flex items-center gap-3">
            <img src={enitLogo} alt="" className="h-10 w-10 rounded-sm bg-white object-contain p-0.5" />
            <span className="text-lg font-semibold">ENIT Connect</span>
          </Link>
          <div className="max-w-sm">
            <span className="gold-rule" aria-hidden="true" />
            <p className="mt-5 text-2xl font-semibold leading-snug text-white">{t('visitor.hero.title')}</p>
          </div>
          <p className="text-sm text-white/70">{t('visitor.school')}</p>
        </div>
      </aside>

      <main className="flex flex-col">
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Link to="/visitor/news" className="inline-flex items-center gap-2.5 lg:invisible">
            <img src={enitLogo} alt="" className="h-8 w-8 object-contain" />
            <span className="font-semibold text-ink">ENIT Connect</span>
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="flex flex-1 items-start justify-center px-4 pb-12 pt-6 sm:px-8 lg:items-center lg:pt-0">
          <div className={wide ? 'w-full max-w-xl' : 'w-full max-w-sm'}>
            <h1 className="text-2xl">{title}</h1>
            {description && <div className="mt-2 text-muted-foreground">{description}</div>}
            <div className="mt-8">{children}</div>
            <p className="mt-10 text-sm">
              <Link to="/visitor/news" className="text-muted-foreground hover:text-ink underline-offset-2 hover:underline">
                {t('auth.backToHome')}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
