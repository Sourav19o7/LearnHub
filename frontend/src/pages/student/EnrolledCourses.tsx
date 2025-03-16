import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import LoadingScreen from '../../components/common/LoadingScreen';
import { Enrollment } from '../../types';
import {
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  CalendarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const EnrolledCourses = () => {
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'progress'>('recent');

  // Fetch enrollments
  const { data: enrollmentsData, isLoading } = useQuery(
    ['enrollments'],
    async () => {
      const response = await api.get('/enrollments');
      return response.data;
    }
  );

  if (isLoading) return <LoadingScreen />;

  const enrollments: Enrollment[] = enrollmentsData?.data || [];

  // Apply filters
  let filteredEnrollments = [...enrollments];
  if (filter === 'in-progress') {
    filteredEnrollments = enrollments.filter(enrollment => !enrollment.completed_at);
  } else if (filter === 'completed') {
    filteredEnrollments = enrollments.filter(enrollment => enrollment.completed_at);
  }

  // Apply sorting
  if (sortBy === 'recent') {
    filteredEnrollments.sort((a, b) => new Date(b.last_accessed_at || b.enrolled_at).getTime() - new Date(a.last_accessed_at || a.enrolled_at).getTime());
  } else if (sortBy === 'title') {
    filteredEnrollments.sort((a, b) => a.course?.title.localeCompare(b.course?.title || '') || 0);
  } else if (sortBy === 'progress') {
    filteredEnrollments.sort((a, b) => b.progress_percentage - a.progress_percentage);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-4 sm:mb-0">
          My Courses
        </h1>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div className="relative">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-surface-300 dark:border-surface-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-surface-800 dark:text-white"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">All Courses</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-surface-500 dark:text-surface-400">
              <FunnelIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="relative">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-surface-300 dark:border-surface-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-surface-800 dark:text-white"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="recent">Recently Accessed</option>
              <option value="title">Course Title</option>
              <option value="progress">Progress</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-surface-500 dark:text-surface-400">
              <FunnelIcon className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {filteredEnrollments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnrollments.map((enrollment) => (
            <div key={enrollment.id} className="card overflow-hidden flex flex-col">
              {enrollment.course?.cover_image_url ? (
                <img
                  src={enrollment.course.cover_image_url}
                  alt={enrollment.course.title}
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="h-40 w-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                  <span className="text-surface-400 dark:text-surface-500">No image</span>
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col">
                {enrollment.completed_at && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Completed
                    </span>
                  </div>
                )}
                <h2 className="text-lg font-medium text-surface-900 dark:text-white mb-2">
                  {enrollment.course?.title}
                </h2>
                <p className="text-sm text-surface-600 dark:text-surface-400 mb-4 line-clamp-2">
                  {enrollment.course?.description}
                </p>
                <div className="mt-auto space-y-3">
                  <div className="flex items-center text-sm text-surface-600 dark:text-surface-400">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm text-surface-600 dark:text-surface-400">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>
                      Last accessed: {enrollment.last_accessed_at
                        ? new Date(enrollment.last_accessed_at).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between items-center text-sm text-surface-600 dark:text-surface-400 mb-1">
                    <span>Progress</span>
                    <span>{enrollment.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full"
                      style={{ width: `${enrollment.progress_percentage}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="border-t border-surface-200 dark:border-surface-700 px-5 py-3 bg-surface-50 dark:bg-surface-800">
                <Link
                  to={`/dashboard/courses/${enrollment.course_id}`}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center"
                >
                  {enrollment.completed_at ? 'Review Course' : 'Continue Learning'}
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 card">
          <h3 className="text-lg font-medium text-surface-900 dark:text-white mb-2">
            No courses found
          </h3>
          <p className="text-surface-600 dark:text-surface-400 mb-4">
            {filter === 'all'
              ? "You haven't enrolled in any courses yet."
              : filter === 'in-progress'
              ? "You don't have any courses in progress."
              : "You haven't completed any courses yet."}
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            Browse Courses
          </Link>
        </div>
      )}
    </div>
  );
};

export default EnrolledCourses;