import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import enitLogo from '@/assets/img/ENIT.png';

interface StatusPageProps {
  code: string;
  title: string;
  body: string;
  actions: ReactNode;
}

/** Shared layout for 404 / 403 pages. */
export function StatusPage({ code, title, body, actions }: StatusPageProps) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="h-16 px-4 sm:px-8 flex items-center border-b border-line bg-surface">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <img src={enitLogo} alt="" className="h-8 w-8 object-contain" />
          <span className="font-semibold text-ink">ENIT Connect</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md">
          <span className="gold-rule" aria-hidden="true" />
          <p className="mt-5 text-sm font-medium text-muted-foreground tabular-nums">{code}</p>
          <h1 className="mt-1">{title}</h1>
          <p className="mt-3 text-body">{body}</p>
          <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
        </div>
      </main>
    </div>
  );
}

export const primaryLinkClass =
  'inline-flex h-10 items-center rounded-md border border-ink bg-ink px-4 text-sm font-medium text-white hover:bg-primary-800';
export const secondaryButtonClass =
  'inline-flex h-10 items-center rounded-md border border-neutral-300 bg-surface px-4 text-sm font-medium text-ink hover:bg-canvas';
