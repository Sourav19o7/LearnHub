import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { Bars3Icon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../lib/auth';
import { toast } from 'react-hot-toast';
import ThemeToggle from '../common/ThemeToggle';

interface DashboardNavbarProps {
  openSidebar: () => void;
}

const DashboardNavbar = ({ openSidebar }: DashboardNavbarProps) => {
  const { profile } = useAuth();

  const handleLogout = async () => {
    try {
      const { success, message } = await signOut();
      
      if (success) {
        toast.success(message);
      } else {
        toast.error(message);
      }
    } catch (error) {
      toast.error('Error logging out. Please try again.');
    }
  };

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-surface-900 shadow-sm dark:shadow-dark-sm">
      <button
        type="button"
        className="px-4 border-r border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:focus:ring-primary-400 md:hidden"
        onClick={openSidebar}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <div className="text-xl font-semibold text-surface-800 dark:text-surface-100">
            Dashboard
          </div>
        </div>
        <div className="ml-4 flex items-center md:ml-6">
          <ThemeToggle className="mr-2" />
          
          <button
            type="button"
            className="p-1 rounded-full text-surface-400 hover:text-surface-500 dark:text-surface-400 dark:hover:text-surface-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-surface-900 dark:focus:ring-primary-400"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Profile dropdown */}
          <Menu as="div" className="ml-3 relative">
            <div>
              <Menu.Button className="max-w-xs bg-white dark:bg-surface-900 flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-surface-900 dark:focus:ring-primary-400">
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
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg dark:shadow-dark-lg py-1 bg-white dark:bg-surface-800 ring-1 ring-black ring-opacity-5 focus:outline-none dark:ring-surface-700">
                <div className="px-4 py-2 text-sm text-surface-700 dark:text-surface-300 border-b dark:border-surface-700">
                  <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
                  <p className="text-surface-500 dark:text-surface-400">{profile?.email}</p>
                </div>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/dashboard/profile"
                      className={`${
                        active ? 'bg-surface-100 dark:bg-surface-700' : ''
                      } block px-4 py-2 text-sm text-surface-700 dark:text-surface-200`}
                    >
                      Your Profile
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-surface-100 dark:bg-surface-700' : ''
                      } block w-full text-left px-4 py-2 text-sm text-surface-700 dark:text-surface-200`}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default DashboardNavbar;