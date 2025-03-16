import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import LoadingScreen from '../../components/common/LoadingScreen';
import {
  UsersIcon,
  BookOpenIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  BellAlertIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  // Fetch platform stats
  const { data: statsData, isLoading } = useQuery(
    ['platform-stats'],
    async () => {
      const response = await api.get('/admin/stats');
      return response.data;
    },
    {
      // Provide fallback data in case the API is not yet implemented
      placeholderData: {
        data: {
          total_users: 1250,
          total_courses: 120,
          total_enrollments: 3800,
          revenue: 45600,
          new_users_today: 24,
          new_courses_today: 3,
          new_enrollments_today: 76,
          revenue_today: 1200,
        }
      }
    }
  );

  if (isLoading) return <LoadingScreen />;

  const stats = statsData?.data || {};

  // Recent activities - would come from API in a real app
  const recentActivities = [
    { id: 1, type: 'user_signup', user: 'John Smith', time: '10 minutes ago' },
    { id: 2, type: 'course_published', course: 'Advanced Python Programming', instructor: 'Emily Johnson', time: '1 hour ago' },
    { id: 3, type: 'enrollment', user: 'Michael Chen', course: 'Web Development Bootcamp', time: '2 hours ago' },
    { id: 4, type: 'review', user: 'Sarah Davis', course: 'Data Science Fundamentals', rating: 5, time: '3 hours ago' },
    { id: 5, type: 'course_completed', user: 'Alex Rodriguez', course: 'UI/UX Design Principles', time: '5 hours ago' },
  ];

  return (
    <div>
      {/* Header section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-surface-600 dark:text-surface-400">
          Platform overview and management
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-start">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg mr-4">
              <UsersIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Total Users</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {stats.total_users?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-success-600 dark:text-success-400">
                +{stats.new_users_today || 0} today
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start">
            <div className="p-2 bg-secondary-100 dark:bg-secondary-900/50 rounded-lg mr-4">
              <BookOpenIcon className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Total Courses</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {stats.total_courses?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-success-600 dark:text-success-400">
                +{stats.new_courses_today || 0} today
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start">
            <div className="p-2 bg-success-100 dark:bg-success-900/50 rounded-lg mr-4">
              <AcademicCapIcon className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Enrollments</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {stats.total_enrollments?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-success-600 dark:text-success-400">
                +{stats.new_enrollments_today || 0} today
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start">
            <div className="p-2 bg-warning-100 dark:bg-warning-900/50 rounded-lg mr-4">
              <CurrencyDollarIcon className="h-6 w-6 text-warning-600 dark:text-warning-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Total Revenue</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                ${stats.revenue?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-success-600 dark:text-success-400">
                +${stats.revenue_today?.toLocaleString() || 0} today
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent activity */}
        <div className="lg:col-span-2">
          <div className="card h-full">
            <div className="p-6 border-b border-surface-200 dark:border-surface-700">
              <h2 className="text-lg font-medium text-surface-900 dark:text-white">Recent Activity</h2>
            </div>
            <div className="divide-y divide-surface-200 dark:divide-surface-700">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="p-4">
                  <div className="flex">
                    <div className="mr-4">
                      {activity.type === 'user_signup' && (
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-full">
                          <UserPlusIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </div>
                      )}
                      {activity.type === 'course_published' && (
                        <div className="p-2 bg-secondary-100 dark:bg-secondary-900/50 rounded-full">
                          <BookOpenIcon className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                        </div>
                      )}
                      {activity.type === 'enrollment' && (
                        <div className="p-2 bg-success-100 dark:bg-success-900/50 rounded-full">
                          <AcademicCapIcon className="h-5 w-5 text-success-600 dark:text-success-400" />
                        </div>
                      )}
                      {activity.type === 'review' && (
                        <div className="p-2 bg-warning-100 dark:bg-warning-900/50 rounded-full">
                          <div className="flex items-center text-warning-600 dark:text-warning-400">
                            <span className="text-xs font-bold">{activity.rating}</span>
                            <span className="ml-0.5">★</span>
                          </div>
                        </div>
                      )}
                      {activity.type === 'course_completed' && (
                        <div className="p-2 bg-success-100 dark:bg-success-900/50 rounded-full">
                          <AcademicCapIcon className="h-5 w-5 text-success-600 dark:text-success-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      {activity.type === 'user_signup' && (
                        <p className="text-sm text-surface-700 dark:text-surface-300">
                          <span className="font-medium">{activity.user}</span> joined the platform
                        </p>
                      )}
                      {activity.type === 'course_published' && (
                        <p className="text-sm text-surface-700 dark:text-surface-300">
                          <span className="font-medium">{activity.instructor}</span> published a new course: <span className="font-medium">{activity.course}</span>
                        </p>
                      )}
                      {activity.type === 'enrollment' && (
                        <p className="text-sm text-surface-700 dark:text-surface-300">
                          <span className="font-medium">{activity.user}</span> enrolled in <span className="font-medium">{activity.course}</span>
                        </p>
                      )}
                      {activity.type === 'review' && (
                        <p className="text-sm text-surface-700 dark:text-surface-300">
                          <span className="font-medium">{activity.user}</span> gave <span className="font-medium">{activity.rating} stars</span> to <span className="font-medium">{activity.course}</span>
                        </p>
                      )}
                      {activity.type === 'course_completed' && (
                        <p className="text-sm text-surface-700 dark:text-surface-300">
                          <span className="font-medium">{activity.user}</span> completed <span className="font-medium">{activity.course}</span>
                        </p>
                      )}
                      <p className="text-xs text-surface-500 dark:text-surface-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <div className="p-6 border-b border-surface-200 dark:border-surface-700">
              <h2 className="text-lg font-medium text-surface-900 dark:text-white">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-4">
              <Link
                to="/admin/users"
                className="block w-full text-left px-4 py-3 border border-surface-300 dark:border-surface-700 rounded-md hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg mr-3">
                    <UsersIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-surface-900 dark:text-white">Manage Users</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">View and manage user accounts</p>
                  </div>
                </div>
              </Link>
              <Link
                to="/admin/courses"
                className="block w-full text-left px-4 py-3 border border-surface-300 dark:border-surface-700 rounded-md hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-secondary-100 dark:bg-secondary-900/50 rounded-lg mr-3">
                    <BookOpenIcon className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-surface-900 dark:text-white">Manage Courses</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">Review and edit platform courses</p>
                  </div>
                </div>
              </Link>
              <Link
                to="/admin/reports"
                className="block w-full text-left px-4 py-3 border border-surface-300 dark:border-surface-700 rounded-md hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-warning-100 dark:bg-warning-900/50 rounded-lg mr-3">
                    <ChartBarIcon className="h-5 w-5 text-warning-600 dark:text-warning-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-surface-900 dark:text-white">Analytics & Reports</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">View detailed platform analytics</p>
                  </div>
                </div>
              </Link>
              <Link
                to="/admin/settings"
                className="block w-full text-left px-4 py-3 border border-surface-300 dark:border-surface-700 rounded-md hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-surface-100 dark:bg-surface-800 rounded-lg mr-3">
                    <Cog6ToothIcon className="h-5 w-5 text-surface-600 dark:text-surface-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-surface-900 dark:text-white">Platform Settings</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">Configure platform settings</p>
                  </div>
                </div>
              </Link>
              <Link
                to="/admin/notifications"
                className="block w-full text-left px-4 py-3 border border-surface-300 dark:border-surface-700 rounded-md hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-error-100 dark:bg-error-900/50 rounded-lg mr-3">
                    <BellAlertIcon className="h-5 w-5 text-error-600 dark:text-error-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-surface-900 dark:text-white">Send Notifications</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">Manage system notifications</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue & Enrollments Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="p-6 border-b border-surface-200 dark:border-surface-700">
            <h2 className="text-lg font-medium text-surface-900 dark:text-white">Revenue Trend</h2>
          </div>
          <div className="p-6">
            <div className="relative h-64 bg-surface-50 dark:bg-surface-800 flex items-center justify-center rounded-lg">
              <p className="text-surface-600 dark:text-surface-400">
                Revenue chart will appear here
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="p-6 border-b border-surface-200 dark:border-surface-700">
            <h2 className="text-lg font-medium text-surface-900 dark:text-white">Enrollment Trend</h2>
          </div>
          <div className="p-6">
            <div className="relative h-64 bg-surface-50 dark:bg-surface-800 flex items-center justify-center rounded-lg">
              <p className="text-surface-600 dark:text-surface-400">
                Enrollment chart will appear here
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;