import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface RequireAuthProps {
  children: React.ReactNode;
}

// Generic auth guard - requires any authenticated user
export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, but save the attempted url
    return <Navigate to="/visitor/news" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
