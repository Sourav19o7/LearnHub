import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import LoadingScreen from '../../components/common/LoadingScreen';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  EyeIcon,
  ChartBarIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { Course, PaginationParams } from '../../types';
import { toast } from 'react-hot-toast';

const CourseManagement = () => {
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Fetch instructor courses
  const { data, isLoading, error, refetch } = useQuery(
    ['instructorCourses', filter, searchTerm, pagination],
    async () => {
      const params = {
        ...pagination,
        search: searchTerm || undefined,
        status: filter !== 'all' ? filter : undefined,
      };
      
      const response = await api.get('/instructor/courses', { params });
      return response.data;
    }
  );

  const courses: Course[] = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/courses/${courseId}`);
      toast.success('Course deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  // Function to get course status badge style
  const getStatusBadgeStyle = (isPublished: boolean) => {
    return isPublished
      ? 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300'
      : 'bg-surface-100 text-surface-800 dark:bg-surface-800 dark:text-surface-300';
  };

  if (isLoading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
            Error Loading Courses
          </h2>
          <p className="text-surface-600 dark:text-surface-400">
            An error occurred while loading your courses. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Ensure pagination values are defined with fallbacks
  const currentPage = pagination.page || 1;
  const limit = pagination.limit || 10;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          Course Management
        </h1>
        <Link
          to="/instructor/courses/create"
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create New Course
        </Link>
      </div>

      <div className="bg-white dark:bg-surface-800 shadow-sm dark:shadow-dark-sm rounded-lg overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-850">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
              />
            </div>
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                  filter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700'
                } border border-surface-300 dark:border-surface-700`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('published')}
                className={`px-4 py-2 text-sm font-medium ${
                  filter === 'published'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700'
                } border-t border-b border-r border-surface-300 dark:border-surface-700`}
              >
                Published
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  filter === 'draft'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700'
                } border-t border-b border-r border-surface-300 dark:border-surface-700`}
              >
                Drafts
              </button>
            </div>
          </div>
        </div>

        {courses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-700">
              <thead className="bg-surface-50 dark:bg-surface-850">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                  >
                    Course
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                  >
                    Students
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                  >
                    Created
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-surface-800 divide-y divide-surface-200 dark:divide-surface-700">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-surface-50 dark:hover:bg-surface-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded bg-surface-200 dark:bg-surface-700 overflow-hidden">
                          {course.cover_image_url ? (
                            <img
                              src={course.cover_image_url}
                              alt={course.title}
                              className="h-10 w-10 object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center">
                              <BookOpenIcon className="h-6 w-6 text-surface-500 dark:text-surface-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-surface-900 dark:text-white">
                            {course.title}
                          </div>
                          <div className="text-sm text-surface-500 dark:text-surface-400">
                            {course.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(
                          course.is_published || false
                        )}`}
                      >
                        {course.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300">
                      {course.enrollment_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300">
                      {new Date(course.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/courses/${course.id}`}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                          title="View Course"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/instructor/courses/${course.id}/students`}
                          className="text-info-600 dark:text-info-400 hover:text-info-900 dark:hover:text-info-300"
                          title="Students"
                        >
                          <UsersIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/instructor/courses/${course.id}/analytics`}
                          className="text-warning-600 dark:text-warning-400 hover:text-warning-900 dark:hover:text-warning-300"
                          title="Analytics"
                        >
                          <ChartBarIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/instructor/courses/${course.id}/edit`}
                          className="text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200"
                          title="Edit Course"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="text-error-600 dark:text-error-400 hover:text-error-900 dark:hover:text-error-300"
                          title="Delete Course"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpenIcon className="h-12 w-12 mx-auto text-surface-400 dark:text-surface-500" />
            <h3 className="mt-4 text-lg font-medium text-surface-900 dark:text-white">
              No courses found
            </h3>
            <p className="mt-2 text-surface-600 dark:text-surface-400">
              {filter === 'all'
                ? "You haven't created any courses yet."
                : filter === 'published'
                ? "You don't have any published courses."
                : "You don't have any draft courses."}
            </p>
            <div className="mt-6">
              <Link
                to="/instructor/courses/create"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Your First Course
              </Link>
            </div>
          </div>
        )}

        {/* Pagination */}
        {courses.length > 0 && totalPages > 1 && (
          <div className="bg-white dark:bg-surface-800 px-4 py-3 flex items-center justify-between border-t border-surface-200 dark:border-surface-700 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-surface-700 dark:text-surface-300">
                  Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * limit, data?.total || 0)}
                  </span>{' '}
                  of <span className="font-medium">{data?.total || 0}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === i + 1
                          ? 'z-10 bg-primary-50 dark:bg-primary-900 border-primary-500 dark:border-primary-500 text-primary-600 dark:text-primary-200'
                          : 'bg-white dark:bg-surface-800 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement;