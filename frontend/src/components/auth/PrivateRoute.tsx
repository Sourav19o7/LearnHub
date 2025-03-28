import { Navigate } from 'react-router-dom';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface PrivateRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

const PrivateRoute = ({ children, redirectTo = '/login' }: PrivateRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Add debug logging
  useEffect(() => {
    console.log('PrivateRoute - Auth State:', { isAuthenticated, isLoading });

  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    console.log('PrivateRoute - Rendering LoadingScreen due to isLoading=true');
    // return <LoadingScreen />;
  }

  console.log('PrivateRoute - Auth check complete. Authenticated:', isAuthenticated);
  
  return isAuthenticated ? <>{children}</> : <Navigate to={redirectTo} />;
};

export default PrivateRoute;