import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-surface-950 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="max-w-max mx-auto">
        <main className="sm:flex">
          <p className="text-4xl font-extrabold text-primary-600 dark:text-primary-400 sm:text-5xl">404</p>
          <div className="sm:ml-6">
            <div className="sm:border-l sm:border-surface-200 dark:sm:border-surface-700 sm:pl-6">
              <h1 className="text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight sm:text-5xl">
                Page not found
              </h1>
              <p className="mt-4 text-base text-surface-600 dark:text-surface-400">
                Sorry, we couldn't find the page you're looking for.
              </p>
            </div>
            <div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-surface-900"
              >
                Go back home
              </Link>
              <Link
                to="/courses"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800 dark:focus:ring-offset-surface-900"
              >
                Browse courses
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotFound;