import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import LoadingScreen from '../../components/common/LoadingScreen';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  BookOpenIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  UserIcon,
  ChartBarIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
} from '@heroicons/react/24/outline';

interface Course {
  id: string;
  title: string;
  instructor: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  category: string;
  difficulty_level: string;
  price: number;
  enrollment_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  cover_image_url?: string;
}

const AllCourses = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'instructor' | 'price' | 'enrollment_count' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch all courses
  const { data, isLoading, error } = useQuery(
    ['admin-courses', searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder],
    async () => {
      const params: any = {
        sortBy,
        sortOrder,
      };
      
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedStatus !== 'all') params.status = selectedStatus === 'published';
      
      const response = await api.get('/admin/courses', { params });
      return response.data;
    }
  );

  // Toggle course publish status mutation
  const toggleCourseStatus = useMutation(
    async ({ courseId, status }: { courseId: string; status: boolean }) => {
      return await api.put(`/admin/courses/${courseId}/publish`, { is_published: status });
    },
    {
      onSuccess: () => {
        toast.success('Course status updated successfully');
        queryClient.invalidateQueries(['admin-courses']);
      },
      onError: () => {
        toast.error('Failed to update course status');
      },
    }
  );

  // Handle sorting
  const handleSort = (field: 'title' | 'instructor' | 'price' | 'enrollment_count' | 'created_at') => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending order
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format price
  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
  };

  // Get difficulty level badge color
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300';
      case 'intermediate':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300';
      case 'advanced':
        return 'bg-error-100 text-error-800 dark:bg-error-900/50 dark:text-error-300';
      default:
        return 'bg-surface-100 text-surface-800 dark:bg-surface-800 dark:text-surface-300';
    }
  };

  // Categories for filter
  const categories = [
    { value: 'programming', label: 'Programming' },
    { value: 'design', label: 'Design' },
    { value: 'business', label: 'Business' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'photography', label: 'Photography' },
    { value: 'music', label: 'Music' },
    { value: 'health', label: 'Health & Fitness' },
    { value: 'language', label: 'Language' },
    { value: 'science', label: 'Science & Math' },
    { value: 'personal-development', label: 'Personal Development' },
  ];

  if (isLoading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
            Error Loading Courses
          </h2>
          <p className="text-surface-600 dark:text-surface-400">
            An error occurred while loading courses. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const courses: Course[] = data?.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          All Courses
        </h1>
        <p className="text-surface-600 dark:text-surface-400 mt-1">
          Manage platform courses and their visibility
        </p>
      </div>

      {/* Filters and search */}
      <div className="bg-white dark:bg-surface-800 shadow-sm dark:shadow-dark-sm rounded-lg overflow-hidden mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-surface-400 dark:text-surface-500" />
              </div>
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center">
                <span className="mr-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                  <FunnelIcon className="h-5 w-5 inline-block mr-1" />
                  Category:
                </span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <span className="mr-2 text-sm font-medium text-surface-700 dark:text-surface-300">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="bg-white dark:bg-surface-800 shadow-sm dark:shadow-dark-sm rounded-lg overflow-hidden">
        {courses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-700">
              <thead className="bg-surface-50 dark:bg-surface-850">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center">
                      <span>Course</span>
                      {sortBy === 'title' && (
                        sortOrder === 'asc' ? (
                          <ArrowUpCircleIcon className="h-4 w-4 ml-1" />
                        ) : (
                          <ArrowDownCircleIcon className="h-4 w-4 ml-1" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('instructor')}
                  >
                    <div className="flex items-center">
                      <span>Instructor</span>
                      {sortBy === 'instructor' && (
                        sortOrder === 'asc' ? (
                          <ArrowUpCircleIcon className="h-4 w-4 ml-1" />
                        ) : (
                          <ArrowDownCircleIcon className="h-4 w-4 ml-1" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center">
                      <span>Price</span>
                      {sortBy === 'price' && (
                        sortOrder === 'asc' ? (
                          <ArrowUpCircleIcon className="h-4 w-4 ml-1" />
                        ) : (
                          <ArrowDownCircleIcon className="h-4 w-4 ml-1" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('enrollment_count')}
                  >
                    <div className="flex items-center">
                      <span>Enrollments</span>
                      {sortBy === 'enrollment_count' && (
                        sortOrder === 'asc' ? (
                          <ArrowUpCircleIcon className="h-4 w-4 ml-1" />
                        ) : (
                          <ArrowDownCircleIcon className="h-4 w-4 ml-1" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center">
                      <span>Created</span>
                      {sortBy === 'created_at' && (
                        sortOrder === 'asc' ? (
                          <ArrowUpCircleIcon className="h-4 w-4 ml-1" />
                        ) : (
                          <ArrowDownCircleIcon className="h-4 w-4 ml-1" />
                        )
                      )}
                    </div>
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
                            <BookOpenIcon className="h-10 w-10 p-1 text-surface-500 dark:text-surface-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-surface-900 dark:text-white">
                            {course.title}
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(
                              course.difficulty_level
                            )}`}
                          >
                            {course.difficulty_level}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-surface-700 dark:text-surface-300">
                          {course.instructor.first_name} {course.instructor.last_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300">
                      {course.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900 dark:text-white">
                      {formatPrice(course.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300">
                      {course.enrollment_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          course.is_published
                            ? 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300'
                            : 'bg-surface-100 text-surface-800 dark:bg-surface-800 dark:text-surface-300'
                        }`}
                      >
                        {course.is_published ? (
                          <>
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <XMarkIcon className="h-3 w-3 mr-1" />
                            Draft
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300">
                      {formatDate(course.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <Link
                          to={`/courses/${course.id}`}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                          title="View Course"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/admin/analytics/courses/${course.id}`}
                          className="text-info-600 dark:text-info-400 hover:text-info-900 dark:hover:text-info-300"
                          title="Course Analytics"
                        >
                          <ChartBarIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/admin/courses/${course.id}/students`}
                          className="text-success-600 dark:text-success-400 hover:text-success-900 dark:hover:text-success-300"
                          title="View Students"
                        >
                          <UserIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => {
                            const newStatus = !course.is_published;
                            if (window.confirm(`${newStatus ? 'Publish' : 'Unpublish'} this course?`)) {
                              toggleCourseStatus.mutate({ courseId: course.id, status: newStatus });
                            }
                          }}
                          className={`${
                            course.is_published
                              ? 'text-error-600 dark:text-error-400 hover:text-error-900 dark:hover:text-error-300'
                              : 'text-success-600 dark:text-success-400 hover:text-success-900 dark:hover:text-success-300'
                          }`}
                          title={course.is_published ? 'Unpublish Course' : 'Publish Course'}
                        >
                          {course.is_published ? (
                            <XMarkIcon className="h-5 w-5" />
                          ) : (
                            <CheckIcon className="h-5 w-5" />
                          )}
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
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'No courses match your filters. Try adjusting your search or filters.'
                : 'There are no courses available in the system yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllCourses;