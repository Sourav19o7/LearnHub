import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import { signIn } from '../../lib/auth';

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

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      setIsSubmitting(true);
      const { success, message, data } = await signIn(values.email, values.password);
      
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

  return (
    <div className="animate-fade-in">
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

      <div className="mt-8">
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
                  className="btn-filled w-full flex justify-center py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
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