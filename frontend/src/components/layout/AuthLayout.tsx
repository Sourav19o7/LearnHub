import { Outlet, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Logo from '../common/Logo';

const AuthLayout = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 bg-texture-grain dark:bg-texture-grain-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/">
            <Logo className="h-12 w-auto" />
          </Link>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-surface-900 py-8 px-4 shadow-premium-card dark:shadow-dark-md sm:rounded-lg sm:px-10 bg-texture-grain dark:bg-texture-grain-dark">
          <Outlet />
        </div>
        <div className="mt-6 text-center text-sm text-surface-600 dark:text-surface-400">
          <Link to="/" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;