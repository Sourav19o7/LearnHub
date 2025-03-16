import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../lib/auth';
import { toast } from 'react-hot-toast';
import Logo from '../common/Logo';
import ThemeToggle from '../common/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';

const navigation = [
  { name: 'Home', to: '/' },
  { name: 'Courses', to: '/courses' },
  { name: 'About', to: '/about' },
  { name: 'Contact', to: '/contact' },
];

const Navbar = () => {
  const { isAuthenticated, profile, isAdmin, isInstructor } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { success, message } = await signOut();
      
      if (success) {
        toast.success(message);
        navigate('/');
      } else {
        toast.error(message);
      }
    } catch (error) {
      toast.error('Error logging out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getDashboardLink = () => {
    if (isAdmin) return '/admin/dashboard';
    if (isInstructor) return '/instructor/dashboard';
    return '/dashboard';
  };

  return (
    <Disclosure as="nav" className="bg-white shadow-sm dark:bg-surface-900 dark:shadow-dark-sm">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link to="/">
                    <Logo className="h-8 w-auto" />
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.to}
                      className="border-transparent text-surface-500 hover:border-primary-500 hover:text-surface-700 dark:text-surface-300 dark:hover:text-white dark:hover:border-primary-400 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-150"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <ThemeToggle className="mr-2" />
                
                {isAuthenticated ? (
                  <Menu as="div" className="ml-3 relative">
                    <div>
                      <Menu.Button className="flex rounded-full bg-white dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-surface-900">
                        <span className="sr-only">Open user menu</span>
                        {profile?.avatar_url ? (
                          <img
                            className="h-8 w-8 rounded-full"
                            src={profile.avatar_url}
                            alt="User avatar"
                          />
                        ) : (
                          <UserCircleIcon
                            className="h-8 w-8 text-surface-400 dark:text-surface-500"
                            aria-hidden="true"
                          />
                        )}
                      </Menu.Button>
                    </div>
                    <Transition
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-surface-800 dark:shadow-dark-lg dark:ring-surface-700">
                        <Menu.Item>
                          {({ active }) => (
                            <div className="px-4 py-2 text-sm text-surface-700 border-b dark:text-surface-300 dark:border-surface-700">
                              <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
                              <p className="text-surface-500 dark:text-surface-400">{profile?.email}</p>
                            </div>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to={getDashboardLink()}
                              className={`${
                                active ? 'bg-surface-100 dark:bg-surface-700' : ''
                              } block px-4 py-2 text-sm text-surface-700 dark:text-surface-200`}
                            >
                              Dashboard
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              className={`${
                                active ? 'bg-surface-100 dark:bg-surface-700' : ''
                              } block w-full text-left px-4 py-2 text-sm text-surface-700 dark:text-surface-200`}
                              onClick={handleLogout}
                              disabled={isLoggingOut}
                            >
                              {isLoggingOut ? 'Logging out...' : 'Sign out'}
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex space-x-4">
                    <Link
                      to="/login"
                      className="btn-text"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="btn-filled"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                <ThemeToggle className="mr-2" />
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-surface-400 hover:text-surface-500 hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:text-surface-400 dark:hover:text-surface-300 dark:hover:bg-surface-800 dark:focus:ring-primary-400">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  to={item.to}
                  className="border-transparent text-surface-500 hover:bg-surface-50 hover:border-surface-300 hover:text-surface-700 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-surface-200 dark:border-surface-700">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center px-4">
                    <div className="flex-shrink-0">
                      {profile?.avatar_url ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={profile.avatar_url}
                          alt="User avatar"
                        />
                      ) : (
                        <UserCircleIcon
                          className="h-10 w-10 text-surface-400 dark:text-surface-500"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-surface-800 dark:text-surface-200">
                        {profile?.first_name} {profile?.last_name}
                      </div>
                      <div className="text-sm font-medium text-surface-500 dark:text-surface-400">
                        {profile?.email}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Disclosure.Button
                      as={Link}
                      to={getDashboardLink()}
                      className="block px-4 py-2 text-base font-medium text-surface-500 hover:text-surface-800 hover:bg-surface-100 dark:text-surface-300 dark:hover:text-white dark:hover:bg-surface-800"
                    >
                      Dashboard
                    </Disclosure.Button>
                    <Disclosure.Button
                      as="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="block w-full text-left px-4 py-2 text-base font-medium text-surface-500 hover:text-surface-800 hover:bg-surface-100 dark:text-surface-300 dark:hover:text-white dark:hover:bg-surface-800"
                    >
                      {isLoggingOut ? 'Logging out...' : 'Sign out'}
                    </Disclosure.Button>
                  </div>
                </>
              ) : (
                <div className="mt-3 space-y-1">
                  <Disclosure.Button
                    as={Link}
                    to="/login"
                    className="block px-4 py-2 text-base font-medium text-surface-500 hover:text-surface-800 hover:bg-surface-100 dark:text-surface-300 dark:hover:text-white dark:hover:bg-surface-800"
                  >
                    Login
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    to="/register"
                    className="block px-4 py-2 text-base font-medium text-surface-500 hover:text-surface-800 hover:bg-surface-100 dark:text-surface-300 dark:hover:text-white dark:hover:bg-surface-800"
                  >
                    Sign Up
                  </Disclosure.Button>
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar;