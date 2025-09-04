import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
  user_metadata?: {
    userType?: string;
    fullName?: string;
    [key: string]: unknown;
  };
  app_metadata?: {
    userType?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireVerification?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
}

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireVerification = false,
  allowedRoles = [],
  redirectTo = '/auth'
}) => {
  const { user, loading, isAuthenticated, checkPermission, isEmailVerified } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner message="Verifying authentication..." />;
  }

  // If authentication is not required, render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Store the attempted location for redirect after login
    const from = location.pathname + location.search;
    const redirectPath = `${redirectTo}?redirect=${encodeURIComponent(from)}`;
    
    return <Navigate to={redirectPath} replace />;
  }

  // Check email verification if required
  if (requireVerification && !isEmailVerified()) {
    toast.error('Please verify your email address to access this page.');
    return <Navigate to="/email-verification" state={{ from: location.pathname }} replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0) {
    const hasPermission = allowedRoles.some(role => checkPermission(role));
    if (!hasPermission) {
      toast.error('You do not have permission to access this page.');
      return <Navigate to="/dashboard" state={{ from: location.pathname }} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

// Convenience components for common use cases
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true}>
    {children}
  </ProtectedRoute>
);

export const RequireVerification: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true} requireVerification={true}>
    {children}
  </ProtectedRoute>
);

export const RequireRole: React.FC<{ 
  children: React.ReactNode; 
  roles: string[];
}> = ({ children, roles }) => (
  <ProtectedRoute requireAuth={true} allowedRoles={roles}>
    {children}
  </ProtectedRoute>
);

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={false}>
    {children}
  </ProtectedRoute>
);