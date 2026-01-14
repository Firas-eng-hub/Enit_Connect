import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface RequireCompanyProps {
  children: React.ReactNode;
}

// Company guard - only allows company users
export function RequireCompany({ children }: RequireCompanyProps) {
  const { isAuthenticated, userType, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Not authenticated - redirect to visitor
  if (!isAuthenticated) {
    return <Navigate to="/visitor/news" replace />;
  }

  // Wrong user type - redirect to their dashboard
  if (userType === 'student') {
    return <Navigate to="/user/home" replace />;
  }
  if (userType === 'admin') {
    return <Navigate to="/admin/home" replace />;
  }

  // Must be company
  if (userType !== 'company') {
    return <Navigate to="/visitor/news" replace />;
  }

  return <>{children}</>;
}
