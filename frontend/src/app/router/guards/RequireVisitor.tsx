import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface RequireVisitorProps {
  children: React.ReactNode;
}

// Visitor guard - redirects logged-in users to their dashboard
export function RequireVisitor({ children }: RequireVisitorProps) {
  const { isAuthenticated, userType, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  // If authenticated, redirect to appropriate dashboard
  if (isAuthenticated && userType) {
    const redirects = {
      student: '/user/home',
      company: '/company/home',
      admin: '/admin/home',
    };
    return <Navigate to={redirects[userType]} replace />;
  }

  return <>{children}</>;
}
