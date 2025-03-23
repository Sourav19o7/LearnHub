import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import { signIn, signInWithGoogle } from '../../lib/auth';

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      setIsSubmitting(true);
      const { success, message } = await signIn(values.email, values.password);
      
      if (success) {
        toast.success(message);
        navigate('/dashboard');
      } else {
        toast.error(message);
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const { success, message } = await signInWithGoogle();
      
      if (success) {
        toast.success(message || 'Signed in with Google successfully');
        navigate('/dashboard');
      } else {
        toast.error(message || 'Failed to sign in with Google');
      }
    } catch (error) {
      toast.error('An error occurred with Google sign-in. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mt-2 text-center text-3xl font-bold text-surface-900 dark:text-white">
        Sign in to your account
      </h2>
      <p className="mt-2 text-center text-sm text-surface-600 dark:text-surface-400">
        Or{' '}
        <Link
          to="/register"
          className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
        >
          create a new account
        </Link>
      </p>

      <div className="mt-8 space-y-6">
        {/* Google Sign-in Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full flex justify-center items-center py-3 px-4 rounded-md shadow-premium-card bg-white hover:bg-gray-50 text-gray-800 font-medium border border-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              'Signing in...'
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Sign in with Google
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-300 dark:border-surface-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-surface-900 text-surface-500 dark:text-surface-400">
              Or continue with email
            </span>
          </div>
        </div>

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.email && touched.email
                        ? 'border-error-300 dark:border-error-700 focus:ring-error-500 dark:focus:ring-error-400'
                        : 'border-surface-300 dark:border-surface-700 focus:ring-primary-500 dark:focus:ring-primary-400'
                    } rounded-md shadow-sm placeholder-surface-400 dark:placeholder-surface-500 
                    focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 
                    dark:bg-surface-800 dark:text-white transition-colors duration-200`}
                  />
                  <ErrorMessage
                    name="email"
                    component="p"
                    className="mt-2 text-sm text-error-600 dark:text-error-400"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                >
                  Password
                </label>
                <div className="mt-1">
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.password && touched.password
                        ? 'border-error-300 dark:border-error-700 focus:ring-error-500 dark:focus:ring-error-400'
                        : 'border-surface-300 dark:border-surface-700 focus:ring-primary-500 dark:focus:ring-primary-400'
                    } rounded-md shadow-sm placeholder-surface-400 dark:placeholder-surface-500 
                    focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 
                    dark:bg-surface-800 dark:text-white transition-colors duration-200`}
                  />
                  <ErrorMessage
                    name="password"
                    component="p"
                    className="mt-2 text-sm text-error-600 dark:text-error-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-surface-300 dark:border-surface-700 rounded dark:bg-surface-800 dark:checked:bg-primary-600 dark:focus:ring-primary-400 transition-colors duration-200"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-surface-700 dark:text-surface-300"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 rounded-md shadow-premium-card bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Login;