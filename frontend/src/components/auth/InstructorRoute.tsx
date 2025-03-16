import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../common/LoadingScreen';

interface InstructorRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

const InstructorRoute = ({ children, redirectTo = '/login' }: InstructorRouteProps) => {
  const { isAuthenticated, isInstructor, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Allow both instructors and admins to access instructor routes
  if (isAuthenticated && (isInstructor || isAdmin)) {
    return <>{children}</>;
  }

  // If authenticated but not instructor/admin, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  // Not authenticated, redirect to login
  return <Navigate to={redirectTo} />;
};

export default InstructorRoute;