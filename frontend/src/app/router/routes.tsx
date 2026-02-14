/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, Component, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Guards
import {
  RequireVisitor,
  RequireStudent,
  RequireCompany,
  RequireAdmin,
} from './guards';

// Layouts
import { VisitorLayout, StudentLayout, CompanyLayout, AdminLayout } from '@/app/layouts';

// Loading fallback with improved design
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background">
    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
    <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
  </div>
);

// Error fallback
const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
    <div className="text-center max-w-md">
      <h1 className="text-2xl font-bold text-red-600 mb-3">Error Loading Page</h1>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        Reload Page
      </button>
    </div>
  </div>
);

// Lazy load pages
const NewsPage = lazy(() => import('@/pages/visitor/NewsPage').then(m => ({ default: m.NewsPage })));
const StatisticsPage = lazy(() => import('@/pages/visitor/StatisticsPage').then(m => ({ default: m.StatisticsPage })));
const MembersPage = lazy(() => import('@/pages/visitor/MembersPage').then(m => ({ default: m.MembersPage })));
const AboutPage = lazy(() => import('@/pages/visitor/AboutPage').then(m => ({ default: m.AboutPage })));
const LoginPage = lazy(() => import('@/pages/visitor/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/visitor/RegisterPage').then(m => ({ default: m.RegisterPage })));
const VerifyPage = lazy(() => import('@/pages/visitor/VerifyPage').then(m => ({ default: m.VerifyPage })));

const StudentHomePage = lazy(() => import('@/pages/student/HomePage').then(m => ({ default: m.HomePage })));
const StudentProfilePage = lazy(() => import('@/pages/student/ProfilePage').then(m => ({ default: m.ProfilePage })));
const StudentSearchPage = lazy(() => import('@/pages/student/SearchPage').then(m => ({ default: m.SearchPage })));
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

const AdminHomePage = lazy(() => import('@/pages/admin/HomePage').then(m => ({ default: m.HomePage })));
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
      { path: 'statistics', element: withSuspense(StatisticsPage) },
      { path: 'how-it-works', element: withSuspense(MembersPage) },
      { path: 'members', element: <Navigate to="/visitor/how-it-works" replace /> },
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
