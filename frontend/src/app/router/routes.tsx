/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, Component, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Guards
import {
  RequireVisitor,
  RequireStudent,
  RequireCompany,
  RequireAdmin,
} from './guards';

// Layouts
import { VisitorLayout, StudentLayout, CompanyLayout, AdminLayout } from '@/app/layouts';

// Loading fallback
const LoadingFallback = () => {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" aria-hidden="true" />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
};

// Error fallback: never show raw error text to users.
const ErrorFallback = ({ error }: { error: Error }) => {
  const { t } = useTranslation();
  if (import.meta.env.DEV) console.error(error);
  return (
    <div role="alert" className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <h1 className="text-xl font-semibold text-ink">{t('errors.pageTitle')}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t('errors.pageBody')}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-5 h-9 px-4 rounded-md border border-ink bg-ink text-sm font-medium text-white hover:bg-primary-800"
      >
        {t('errors.reload')}
      </button>
    </div>
  );
};

// Lazy load pages
const NewsPage = lazy(() => import('@/pages/visitor/NewsPage').then(m => ({ default: m.NewsPage })));
const AboutPage = lazy(() => import('@/pages/visitor/AboutPage').then(m => ({ default: m.AboutPage })));
const LoginPage = lazy(() => import('@/pages/visitor/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/visitor/RegisterPage').then(m => ({ default: m.RegisterPage })));
const VerifyPage = lazy(() => import('@/pages/visitor/VerifyPage').then(m => ({ default: m.VerifyPage })));

const StudentHomePage = lazy(() => import('@/pages/student/HomePage').then(m => ({ default: m.HomePage })));
const StudentProfilePage = lazy(() => import('@/pages/student/ProfilePage').then(m => ({ default: m.ProfilePage })));
const StudentSearchPage = lazy(() => import('@/pages/student/SearchPage').then(m => ({ default: m.SearchPage })));
const BrowseCompaniesPage = lazy(() => import('@/pages/student/BrowseCompaniesPage').then(m => ({ default: m.BrowseCompaniesPage })));
const StudentDocumentsPage = lazy(() => import('@/pages/student/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const StudentNotificationsPage = lazy(() => import('@/pages/student/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const StudentSettingsPage = lazy(() => import('@/pages/student/SettingsPage').then(m => ({ default: m.SettingsPage })));
const BrowseOffersPage = lazy(() => import('@/pages/student/BrowseOffersPage').then(m => ({ default: m.BrowseOffersPage })));
const StudentPublicProfilePage = lazy(() => import('@/pages/student/StudentPublicProfilePage').then(m => ({ default: m.StudentPublicProfilePage })));
const StudentMailboxPage = lazy(() => import('@/pages/student/MailboxPage').then(m => ({ default: m.MailboxPage })));

const CompanyHomePage = lazy(() => import('@/pages/company/HomePage').then(m => ({ default: m.HomePage })));
const CandidaciesPage = lazy(() => import('@/pages/company/CandidaciesPage').then(m => ({ default: m.CandidaciesPage })));
const CandidaciesListPage = lazy(() => import('@/pages/company/CandidaciesListPage').then(m => ({ default: m.CandidaciesListPage })));
const CompanyProfilePage = lazy(() => import('@/pages/company/ProfilePage').then(m => ({ default: m.ProfilePage })));
const CompanySearchPage = lazy(() => import('@/pages/company/SearchPage').then(m => ({ default: m.SearchPage })));
const CompanyNotificationsPage = lazy(() => import('@/pages/company/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const CompanySettingsPage = lazy(() => import('@/pages/company/SettingsPage').then(m => ({ default: m.SettingsPage })));
const CompanyMailboxPage = lazy(() => import('@/pages/company/MailboxPage').then(m => ({ default: m.MailboxPage })));
const CompanyDashboardPage = lazy(() => import('@/pages/company/DashboardPage').then(m => ({ default: m.CompanyDashboardPage })));

const AdminHomePage = lazy(() => import('@/pages/admin/HomePage').then(m => ({ default: m.HomePage })));
const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AdminMailboxPage = lazy(() => import('@/pages/admin/MailboxPage').then(m => ({ default: m.MailboxPage })));
const AdminSearchPage = lazy(() => import('@/pages/admin/SearchPage').then(m => ({ default: m.SearchPage })));
const AddUsersPage = lazy(() => import('@/pages/admin/AddUsersPage').then(m => ({ default: m.AddUsersPage })));
const AdminDocumentsPage = lazy(() => import('@/pages/admin/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const PartnersPage = lazy(() => import('@/pages/admin/PartnersPage').then(m => ({ default: m.PartnersPage })));
const MessagesPage = lazy(() => import('@/pages/admin/MessagesPage').then(m => ({ default: m.MessagesPage })));
const AdminNotificationsPage = lazy(() => import('@/pages/admin/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const AdminSettingsPage = lazy(() => import('@/pages/admin/SettingsPage').then(m => ({ default: m.SettingsPage })));

// Error pages
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const ForbiddenPage = lazy(() => import('@/pages/ForbiddenPage').then(m => ({ default: m.ForbiddenPage })));

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback: ComponentType<{ error: Error }> }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback;
      return <Fallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Wrap with Suspense and Error Boundary
const withSuspense = (Component: LazyExoticComponent<ComponentType>) => (
  <ErrorBoundary fallback={ErrorFallback}>
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

export const router = createBrowserRouter([
  // Root redirect
  {
    path: '/',
    element: <Navigate to="/visitor/news" replace />,
  },

  // Visitor routes (public)
  {
    path: '/visitor',
    element: (
      <RequireVisitor>
        <VisitorLayout />
      </RequireVisitor>
    ),
    children: [
      { index: true, element: <Navigate to="/visitor/news" replace /> },
      { path: 'news', element: withSuspense(NewsPage) },
      // Removed pages redirect to the news home.
      { path: 'statistics', element: <Navigate to="/visitor/news" replace /> },
      { path: 'how-it-works', element: <Navigate to="/visitor/news" replace /> },
      { path: 'members', element: <Navigate to="/visitor/news" replace /> },
      { path: 'about', element: withSuspense(AboutPage) },
    ],
  },

  // Auth pages (outside layout, with visitor guard)
  {
    path: '/login',
    element: (
      <RequireVisitor>
        {withSuspense(LoginPage)}
      </RequireVisitor>
    ),
  },
  {
    path: '/register',
    element: (
      <RequireVisitor>
        {withSuspense(RegisterPage)}
      </RequireVisitor>
    ),
  },
  {
    path: '/verify',
    element: (
      <RequireVisitor>
        {withSuspense(VerifyPage)}
      </RequireVisitor>
    ),
  },

  // Student routes (protected)
  {
    path: '/user',
    element: (
      <RequireStudent>
        <StudentLayout />
      </RequireStudent>
    ),
    children: [
      { index: true, element: <Navigate to="/user/home" replace /> },
      { path: 'home', element: withSuspense(StudentHomePage) },
      { path: 'offers', element: withSuspense(BrowseOffersPage) },
      { path: 'companies', element: withSuspense(BrowseCompaniesPage) },
      { path: 'profile', element: withSuspense(StudentProfilePage) },
      { path: 'student/:id', element: withSuspense(StudentPublicProfilePage) },
      { path: 'search', element: withSuspense(StudentSearchPage) },
      { path: 'documents', element: withSuspense(StudentDocumentsPage) },
      { path: 'mail', element: withSuspense(StudentMailboxPage) },
      { path: 'notifications', element: withSuspense(StudentNotificationsPage) },
      { path: 'settings', element: withSuspense(StudentSettingsPage) },
    ],
  },

  // Company routes (protected)
  {
    path: '/company',
    element: (
      <RequireCompany>
        <CompanyLayout />
      </RequireCompany>
    ),
    children: [
      { index: true, element: <Navigate to="/company/home" replace /> },
      { path: 'home', element: withSuspense(CompanyHomePage) },
      { path: 'dashboard', element: withSuspense(CompanyDashboardPage) },
      { path: 'candidacies', element: withSuspense(CandidaciesListPage) },
      { path: 'candidacies/:id', element: withSuspense(CandidaciesPage) },
      { path: 'profile', element: withSuspense(CompanyProfilePage) },
      { path: 'search', element: withSuspense(CompanySearchPage) },
      { path: 'mail', element: withSuspense(CompanyMailboxPage) },
      { path: 'notifications', element: withSuspense(CompanyNotificationsPage) },
      { path: 'settings', element: withSuspense(CompanySettingsPage) },
    ],
  },

  // Admin routes (protected)
  {
    path: '/admin',
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/home" replace /> },
      { path: 'home', element: withSuspense(AdminHomePage) },
      { path: 'dashboard', element: withSuspense(AdminDashboardPage) },
      { path: 'mail', element: withSuspense(AdminMailboxPage) },
      { path: 'send', element: <Navigate to="/admin/mail" replace /> },
      { path: 'search', element: withSuspense(AdminSearchPage) },
      { path: 'add', element: withSuspense(AddUsersPage) },
      { path: 'add-users', element: <Navigate to="/admin/add" replace /> },
      { path: 'documents', element: withSuspense(AdminDocumentsPage) },
      { path: 'partners', element: withSuspense(PartnersPage) },
      { path: 'messages', element: withSuspense(MessagesPage) },
      { path: 'notifications', element: withSuspense(AdminNotificationsPage) },
      { path: 'settings', element: withSuspense(AdminSettingsPage) },
    ],
  },

  // Admin login (separate route with visitor guard)
  {
    path: '/admin/login',
    element: (
      <RequireVisitor>
        {withSuspense(LoginPage)}
      </RequireVisitor>
    ),
  },

  // 403 Forbidden page
  {
    path: '/forbidden',
    element: withSuspense(ForbiddenPage),
  },

  // 404 Catch-all
  {
    path: '*',
    element: withSuspense(NotFoundPage),
  },
]);
