import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../common/LoadingScreen';

interface AdminRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

const AdminRoute = ({ children, redirectTo = '/login' }: AdminRouteProps) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Only allow admins to access admin routes
  if (isAuthenticated && isAdmin) {
    return <>{children}</>;
  }

  // If authenticated but not admin, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  // Not authenticated, redirect to login
  return <Navigate to={redirectTo} />;
};

export default AdminRoute;