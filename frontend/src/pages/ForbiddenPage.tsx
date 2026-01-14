import { Link } from 'react-router-dom';
import { ShieldX, Home, ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function ForbiddenPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 403 Illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-danger-100 mb-4">
            <ShieldX className="w-12 h-12 text-danger-600" />
          </div>
          <div className="text-8xl font-bold text-danger-600 mb-2">403</div>
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Access Denied
        </h1>
        <p className="text-muted-foreground mb-8">
          You don't have permission to access this page. Please make sure you're logged in with the correct account type.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back
          </Button>
          {isAuthenticated ? (
            <Link to="/">
              <Button leftIcon={<Home className="w-4 h-4" />}>
                Back to Home
              </Button>
            </Link>
          ) : (
            <Link to="/visitor/login">
              <Button leftIcon={<LogIn className="w-4 h-4" />}>
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
