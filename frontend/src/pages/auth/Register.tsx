import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import { signUp } from '../../lib/auth';

const RegisterSchema = Yup.object().shape({
  first_name: Yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters'),
  last_name: Yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
});

interface RegisterFormValues {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: RegisterFormValues) => {
    try {
      setIsSubmitting(true);
      const { success, message } = await signUp(
        values.email,
        values.password,
        values.first_name,
        values.last_name
      );
      
      if (success) {
        toast.success(message);
        navigate('/login');
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
    <div className="animate-fade-in bg-texture-grain dark:bg-texture-grain-dark">
      <h2 className="mt-2 text-center text-3xl font-bold text-surface-900 dark:text-white">
        Create a new account
      </h2>
      <p className="mt-2 text-center text-sm text-surface-600 dark:text-surface-400">
        Or{' '}
        <Link
          to="/login"
          className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
        >
          sign in to your existing account
        </Link>
      </p>

      <div className="mt-8">
        <Formik
          initialValues={{
            first_name: '',
            last_name: '',
            email: '',
            password: '',
            confirmPassword: '',
          }}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                  >
                    First name
                  </label>
                  <div className="mt-1">
                    <Field
                      id="first_name"
                      name="first_name"
                      type="text"
                      autoComplete="given-name"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.first_name && touched.first_name
                          ? 'border-error-300 dark:border-error-700 focus:ring-error-500 dark:focus:ring-error-400'
                          : 'border-surface-300 dark:border-surface-700 focus:ring-primary-500 dark:focus:ring-primary-400'
                      } rounded-md shadow-sm placeholder-surface-400 dark:placeholder-surface-500 
                      focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 
                      dark:bg-surface-800 dark:text-white transition-colors duration-200`}
                    />
                    <ErrorMessage
                      name="first_name"
                      component="p"
                      className="mt-2 text-sm text-error-600 dark:text-error-400"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                  >
                    Last name
                  </label>
                  <div className="mt-1">
                    <Field
                      id="last_name"
                      name="last_name"
                      type="text"
                      autoComplete="family-name"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.last_name && touched.last_name
                          ? 'border-error-300 dark:border-error-700 focus:ring-error-500 dark:focus:ring-error-400'
                          : 'border-surface-300 dark:border-surface-700 focus:ring-primary-500 dark:focus:ring-primary-400'
                      } rounded-md shadow-sm placeholder-surface-400 dark:placeholder-surface-500 
                      focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 
                      dark:bg-surface-800 dark:text-white transition-colors duration-200`}
                    />
                    <ErrorMessage
                      name="last_name"
                      component="p"
                      className="mt-2 text-sm text-error-600 dark:text-error-400"
                    />
                  </div>
                </div>
              </div>

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
                    autoComplete="new-password"
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

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                >
                  Confirm Password
                </label>
                <div className="mt-1">
                  <Field
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.confirmPassword && touched.confirmPassword
                        ? 'border-error-300 dark:border-error-700 focus:ring-error-500 dark:focus:ring-error-400'
                        : 'border-surface-300 dark:border-surface-700 focus:ring-primary-500 dark:focus:ring-primary-400'
                    } rounded-md shadow-sm placeholder-surface-400 dark:placeholder-surface-500 
                    focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 
                    dark:bg-surface-800 dark:text-white transition-colors duration-200`}
                  />
                  <ErrorMessage
                    name="confirmPassword"
                    component="p"
                    className="mt-2 text-sm text-error-600 dark:text-error-400"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-surface-300 dark:border-surface-700 rounded dark:bg-surface-800 dark:checked:bg-primary-600 dark:focus:ring-primary-400 transition-colors duration-200"
                  required
                />
                <label
                  htmlFor="terms"
                  className="ml-2 block text-sm text-surface-700 dark:text-surface-300"
                >
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy"
                    className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 rounded-md shadow-premium-card bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating account...' : 'Sign up'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Register;