import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../../components/common/LoadingScreen';
import { Course } from '../../types';
import {
  BookOpenIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const InstructorDashboard = () => {
  const { profile } = useAuth();

  // Fetch instructor courses
  const { data: coursesData, isLoading: isLoadingCourses } = useQuery(
    ['instructor-courses'],
    async () => {
      const response = await api.get(`/users/${profile?.id}/courses`);
      return response.data;
    }
  );

  // Fetch instructor stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery(
    ['instructor-stats'],
    async () => {
      const response = await api.get(`/users/${profile?.id}/stats`);
      return response.data;
    }
  );

  const isLoading = isLoadingCourses || isLoadingStats;

  if (isLoading) return <LoadingScreen />;

  const courses: Course[] = coursesData?.data || [];
  const stats = statsData?.data || {};

  // Get recent courses
  const recentCourses = [...courses]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  return (
    <div>
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
          Instructor Dashboard
        </h1>
        <p className="text-surface-600 dark:text-surface-400">
          Welcome back, {profile?.first_name}! Here's an overview of your teaching activity.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-start">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg mr-4">
              <BookOpenIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Total Courses</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{courses.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start">
            <div className="p-2 bg-success-100 dark:bg-success-900/50 rounded-lg mr-4">
              <UserGroupIcon className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Total Students</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.total_students || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start">
            <div className="p-2 bg-warning-100 dark:bg-warning-900/50 rounded-lg mr-4">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-warning-600 dark:text-warning-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Assignments</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.total_assignments || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start">
            <div className="p-2 bg-secondary-100 dark:bg-secondary-900/50 rounded-lg mr-4">
              <CurrencyDollarIcon className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Revenue</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">${stats.total_revenue || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent courses section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="card h-full">
            <div className="p-6 border-b border-surface-200 dark:border-surface-700 flex justify-between items-center">
              <h2 className="text-lg font-medium text-surface-900 dark:text-white">Your Recent Courses</h2>
              <Link
                to="/instructor/courses"
                className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-surface-200 dark:divide-surface-700">
              {recentCourses.length > 0 ? (
                recentCourses.map((course) => (
                  <div key={course.id} className="p-6">
                    <div className="flex flex-col sm:flex-row items-start">
                      {course.cover_image_url && (
                        <img
                          src={course.cover_image_url}
                          alt={course.title}
                          className="w-full sm:w-24 h-16 object-cover rounded mb-4 sm:mb-0 sm:mr-4"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-surface-900 dark:text-white mb-1">
                          {course.title}
                        </h3>
                        <p className="text-sm text-surface-600 dark:text-surface-400 mb-3 line-clamp-1">
                          {course.description}
                        </p>
                        <div className="flex items-center space-x-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            course.is_published
                              ? 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300'
                              : 'bg-surface-100 text-surface-800 dark:bg-surface-800 dark:text-surface-300'
                          }`}>
                            {course.is_published ? 'Published' : 'Draft'}
                          </span>
                          <span className="text-xs text-surface-600 dark:text-surface-400">
                            Created: {new Date(course.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <Link
                            to={`/instructor/courses/${course.id}/edit`}
                            className="inline-flex items-center text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                          >
                            <PencilSquareIcon className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                          <Link
                            to={`/courses/${course.id}`}
                            className="inline-flex items-center text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Preview
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <p className="text-surface-600 dark:text-surface-400 mb-4">
                    You haven't created any courses yet.
                  </p>
                  <Link
                    to="/instructor/courses/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Your First Course
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card h-full">
            <div className="p-6 border-b border-surface-200 dark:border-surface-700">
              <h2 className="text-lg font-medium text-surface-900 dark:text-white">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-4">
              <Link
                to="/instructor/courses/create"
                className="block w-full text-left px-4 py-3 border border-surface-300 dark:border-surface-700 rounded-md hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg mr-3">
                    <PlusIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-surface-900 dark:text-white">Create Course</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">Start building a new course</p>
                  </div>
                </div>
              </Link>
              <Link
                to="/instructor/assignments"
                className="block w-full text-left px-4 py-3 border border-surface-300 dark:border-surface-700 rounded-md hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-warning-100 dark:bg-warning-900/50 rounded-lg mr-3">
                    <ClipboardDocumentCheckIcon className="h-5 w-5 text-warning-600 dark:text-warning-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-surface-900 dark:text-white">Manage Assignments</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">Review and grade student work</p>
                  </div>
                </div>
              </Link>
              <Link
                to="/instructor/students"
                className="block w-full text-left px-4 py-3 border border-surface-300 dark:border-surface-700 rounded-md hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-success-100 dark:bg-success-900/50 rounded-lg mr-3">
                    <UserGroupIcon className="h-5 w-5 text-success-600 dark:text-success-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-surface-900 dark:text-white">View Students</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">Manage your enrolled students</p>
                  </div>
                </div>
              </Link>
              <Link
                to="/instructor/analytics"
                className="block w-full text-left px-4 py-3 border border-surface-300 dark:border-surface-700 rounded-md hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-secondary-100 dark:bg-secondary-900/50 rounded-lg mr-3">
                    <ChartBarIcon className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-surface-900 dark:text-white">Analytics</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">Track course performance</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Performance overview */}
      <div className="card mb-8">
        <div className="p-6 border-b border-surface-200 dark:border-surface-700">
          <h2 className="text-lg font-medium text-surface-900 dark:text-white">Performance Overview</h2>
        </div>
        <div className="p-6">
          <div className="relative h-64 bg-surface-50 dark:bg-surface-800 flex items-center justify-center rounded-lg">
            <p className="text-surface-600 dark:text-surface-400">
              Analytics visualization will appear here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;