import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
  Cog6ToothIcon,
  UserIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Logo from '../common/Logo';
import { UserRole } from '../../types';

interface SidebarProps {
  role: UserRole;
  isMobile: boolean;
  isOpen: boolean;
  onClose?: () => void;
}

const Sidebar = ({ role, isMobile, isOpen, onClose }: SidebarProps) => {
  const location = useLocation();

  // Define navigation items based on user role
  const getNavigation = () => {
    const items = [];

    // Student navigation
    if (role === UserRole.STUDENT || role === UserRole.ADMIN) {
      items.push(
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: HomeIcon,
          current: location.pathname === '/dashboard'
        },
        {
          name: 'My Courses',
          href: '/dashboard/courses',
          icon: AcademicCapIcon,
          current: location.pathname.startsWith('/dashboard/courses')
        },
        {
          name: 'Assignments',
          href: '/dashboard/assignments',
          icon: ClipboardDocumentCheckIcon,
          current: location.pathname.startsWith('/dashboard/assignments')
        },
        {
          name: 'Profile',
          href: '/dashboard/profile',
          icon: UserIcon,
          current: location.pathname === '/dashboard/profile'
        }
      );
    }

    // Instructor navigation
    if (role === UserRole.INSTRUCTOR || role === UserRole.ADMIN) {
      items.push(
        {
          name: 'Instructor Dashboard',
          href: '/instructor/dashboard',
          icon: HomeIcon,
          current: location.pathname === '/instructor/dashboard'
        },
        {
          name: 'Courses',
          href: '/instructor/courses',
          icon: BookOpenIcon,
          current: location.pathname.startsWith('/instructor/courses')
        },
        {
          name: 'Assignments',
          href: '/instructor/assignments',
          icon: ClipboardDocumentCheckIcon,
          current: location.pathname.startsWith('/instructor/assignments')
        },
        {
          name: 'Profile',
          href: '/instructor/profile',
          icon: UserIcon,
          current: location.pathname === '/instructor/profile'
        }
      );
    }

    // Admin navigation
    if (role === UserRole.ADMIN) {
      items.push(
        {
          name: 'Admin Dashboard',
          href: '/admin/dashboard',
          icon: ChartBarIcon,
          current: location.pathname === '/admin/dashboard'
        },
        {
          name: 'Users',
          href: '/admin/users',
          icon: UsersIcon,
          current: location.pathname.startsWith('/admin/users')
        },
        {
          name: 'All Courses',
          href: '/admin/courses',
          icon: AcademicCapIcon,
          current: location.pathname.startsWith('/admin/courses')
        },
        {
          name: 'Settings',
          href: '/admin/settings',
          icon: Cog6ToothIcon,
          current: location.pathname.startsWith('/admin/settings')
        }
      );
    }

    return items;
  };

  const navigation = getNavigation();

  // Mobile sidebar
  if (isMobile) {
    return (
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 md:hidden" onClose={onClose || (() => {})}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-surface-600 bg-opacity-75 dark:bg-surface-900 dark:bg-opacity-80" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white dark:bg-surface-900">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white dark:focus:ring-surface-500"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex-shrink-0 flex items-center px-4">
                  <Logo />
                </div>
                <div className="mt-5 flex-1 h-0 overflow-y-auto">
                  <nav className="px-2 space-y-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`${
                          item.current
                            ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/30 dark:text-primary-100'
                            : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-white'
                        } group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors duration-150`}
                        onClick={onClose}
                      >
                        <item.icon
                          className={`${
                            item.current ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 group-hover:text-surface-500 dark:text-surface-500 dark:group-hover:text-surface-400'
                          } mr-4 flex-shrink-0 h-6 w-6 transition-colors duration-150`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="flex-shrink-0 w-14" aria-hidden="true">
              {/* Dummy element to force sidebar to shrink to fit close icon */}
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    );
  }

  // Desktop sidebar
  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow border-r border-surface-200 dark:border-surface-800 pt-5 bg-white dark:bg-surface-900 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <Logo />
        </div>
        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  item.current
                    ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/30 dark:text-primary-100'
                    : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-white'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 relative`}
              >
                {item.current && <span className="nav-indicator" aria-hidden="true" />}
                <item.icon
                  className={`${
                    item.current ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 group-hover:text-surface-500 dark:text-surface-500 dark:group-hover:text-surface-400'
                  } mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-150`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;