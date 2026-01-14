import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface RequireAdminProps {
  children: React.ReactNode;
}

// Admin guard - only allows admin users
export function RequireAdmin({ children }: RequireAdminProps) {
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
  if (userType === 'company') {
    return <Navigate to="/company/home" replace />;
  }

  // Must be admin
  if (userType !== 'admin') {
    return <Navigate to="/visitor/news" replace />;
  }

  return <>{children}</>;
}
