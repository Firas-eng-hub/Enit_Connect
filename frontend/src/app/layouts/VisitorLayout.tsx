import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';
import enitLogo from '@/assets/img/ENIT.png';

const CONTACT_EMAIL = 'contact@enit.utm.tn';
const CONTACT_PHONE = '+216 71 874 700';

export function VisitorLayout() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: '/visitor/news', label: t('visitor.nav.news') },
    { path: '/visitor/about', label: t('visitor.nav.about') },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        {t('visitor.nav.skip')}
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="max-w-[1200px] mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-8">
          <Link to="/visitor/news" className="flex items-center gap-2.5 shrink-0">
            <img src={enitLogo} alt="" className="h-9 w-9 object-contain" />
            <span className="font-semibold text-ink">ENIT Connect</span>
          </Link>

          <nav aria-label={t('visitor.nav.main')} className="hidden md:block h-full">
            <ul className="flex h-full items-stretch gap-6">
              {navItems.map((item) => (
                <li key={item.path} className="flex">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center border-b-2 pt-0.5 text-sm font-medium',
                        isActive
                          ? 'border-gold text-ink'
                          : 'border-transparent text-body hover:text-ink'
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ms-auto hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              to="/login"
              className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-ink hover:bg-canvas"
            >
              {t('visitor.nav.signIn')}
            </Link>
            <Link
              to="/register"
              className="inline-flex h-9 items-center rounded-md border border-ink bg-ink px-4 text-sm font-medium text-white hover:bg-primary-800"
            >
              {t('visitor.nav.createAccount')}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="ms-auto md:hidden -me-2 p-2 rounded-md text-ink hover:bg-canvas"
            aria-expanded={menuOpen}
            aria-controls="visitor-mobile-menu"
            aria-label={menuOpen ? t('visitor.nav.closeMenu') : t('visitor.nav.openMenu')}
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>

        {menuOpen && (
          <div
            id="visitor-mobile-menu"
            className="md:hidden border-t border-line bg-surface"
            onClick={(event) => {
              // Close after following any link inside the menu.
              if ((event.target as HTMLElement).closest('a')) setMenuOpen(false);
            }}
          >
            <nav aria-label={t('visitor.nav.main')} className="px-4 py-3">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'block rounded-md border-s-[3px] px-3 py-2.5 text-base font-medium',
                          isActive ? 'border-gold bg-canvas text-ink' : 'border-transparent text-body'
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
                <Link
                  to="/login"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 text-sm font-medium text-ink"
                >
                  {t('visitor.nav.signIn')}
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-ink bg-ink text-sm font-medium text-white"
                >
                  {t('visitor.nav.createAccount')}
                </Link>
              </div>
              <div className="mt-3">
                <LanguageSwitcher className="w-full h-10" />
              </div>
            </nav>
          </div>
        )}
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-ink text-white/75">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <img src={enitLogo} alt="" className="h-8 w-8 rounded-sm bg-white object-contain p-0.5" />
              <span className="font-semibold text-white">ENIT Connect</span>
            </div>
            <p className="mt-3 text-sm max-w-xs">{t('visitor.footer.about')}</p>
          </div>

          <nav aria-label={t('visitor.footer.links')}>
            <h2 className="text-sm font-medium text-white">{t('visitor.footer.links')}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link to={item.path} className="hover:text-white hover:underline underline-offset-2">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/login" className="hover:text-white hover:underline underline-offset-2">
                  {t('visitor.nav.signIn')}
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white hover:underline underline-offset-2">
                  {t('visitor.nav.createAccount')}
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-medium text-white">{t('visitor.footer.contact')}</h2>
            <address className="mt-3 not-italic text-sm space-y-2">
              <p>
                {t('visitor.school')}
                <br />
                BP 37, Le Belvédère, 1002 Tunis
              </p>
              <p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white hover:underline underline-offset-2">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p>
                <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`} dir="ltr" className="hover:text-white hover:underline underline-offset-2">
                  {CONTACT_PHONE}
                </a>
              </p>
            </address>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 text-xs text-white/60">
            {t('visitor.footer.rights', { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  );
}
