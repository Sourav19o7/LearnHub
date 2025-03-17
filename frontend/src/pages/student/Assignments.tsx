import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../../components/common/LoadingScreen';
import {
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface Assignment {
  id: string;
  title: string;
  description: string;
  course_id: string;
  course: {
    title: string;
  };
  due_date: string;
  max_score: number;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
}

const Assignments = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const { user, isAuthenticated } = useAuth();

  // Fetch assignments using 'me' endpoint
  const { data, isLoading, error } = useQuery(
    ['assignments', filter, user?.id],
    async () => {
      const params = filter !== 'all' ? { status: filter } : undefined;
      // Use the users/me/assignments endpoint instead
      const response = await api.get('/users/me/assignments', { params });
      return response.data;
    },
    {
      // Only run query if we're authenticated
      enabled: isAuthenticated,
      // Retry fewer times for auth issues
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false; // Don't retry auth errors
        }
        return failureCount < 3;
      }
    }
  );

  const assignments: Assignment[] = data?.data || [];

  if (isLoading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
            Error Loading Assignments
          </h2>
          <p className="text-surface-600 dark:text-surface-400">
            An error occurred while loading your assignments. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Function to get status badge styles
  const getStatusBadgeStyles = (status: Assignment['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300';
      case 'submitted':
        return 'bg-info-100 text-info-800 dark:bg-info-900/50 dark:text-info-300';
      case 'graded':
        return 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300';
      default:
        return 'bg-surface-100 text-surface-800 dark:bg-surface-800 dark:text-surface-300';
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to check if an assignment is overdue
  const isOverdue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    return now > due;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          Assignments
        </h1>
        <div className="mt-4 sm:mt-0">
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
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 text-sm font-medium ${
                filter === 'pending'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700'
              } border-t border-b border-r border-surface-300 dark:border-surface-700`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('submitted')}
              className={`px-4 py-2 text-sm font-medium ${
                filter === 'submitted'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700'
              } border-t border-b border-r border-surface-300 dark:border-surface-700`}
            >
              Submitted
            </button>
            <button
              onClick={() => setFilter('graded')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                filter === 'graded'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700'
              } border-t border-b border-r border-surface-300 dark:border-surface-700`}
            >
              Graded
            </button>
          </div>
        </div>
      </div>

      {assignments.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <Link
              key={assignment.id}
              to={`/dashboard/assignments/${assignment.id}`}
              className="block card hover:shadow-md dark:hover:shadow-dark-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-surface-900 dark:text-white">
                      {assignment.title}
                    </h3>
                    <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                      {assignment.course.title}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyles(
                      assignment.status
                    )}`}
                  >
                    {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-surface-600 dark:text-surface-400 mt-4">
                  <ClockIcon className="h-5 w-5 mr-1.5 text-surface-500 dark:text-surface-400" />
                  <span className={isOverdue(assignment.due_date) && assignment.status === 'pending' ? 'text-error-600 dark:text-error-400' : ''}>
                    Due: {formatDate(assignment.due_date)}
                    {isOverdue(assignment.due_date) && assignment.status === 'pending' && (
                      <span className="inline-flex items-center ml-2">
                        <ExclamationCircleIcon className="h-4 w-4 mr-0.5 text-error-600 dark:text-error-400" />
                        Overdue
                      </span>
                    )}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-surface-600 dark:text-surface-400 mt-2">
                  <DocumentTextIcon className="h-5 w-5 mr-1.5 text-surface-500 dark:text-surface-400" />
                  <span>Max Score: {assignment.max_score} points</span>
                </div>
                
                {assignment.status === 'graded' && (
                  <div className="flex items-center text-sm text-success-600 dark:text-success-400 mt-2">
                    <CheckCircleIcon className="h-5 w-5 mr-1.5" />
                    <span>Score: {assignment.score} / {assignment.max_score}</span>
                  </div>
                )}
                
                <div className="mt-6">
                  <span
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                      assignment.status === 'pending'
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : assignment.status === 'submitted'
                        ? 'bg-info-600 hover:bg-info-700 text-white'
                        : 'bg-success-600 hover:bg-success-700 text-white'
                    }`}
                  >
                    {assignment.status === 'pending'
                      ? 'Start Assignment'
                      : assignment.status === 'submitted'
                      ? 'View Submission'
                      : 'View Feedback'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-surface-800 rounded-lg shadow-sm dark:shadow-dark-sm">
          <DocumentTextIcon className="h-12 w-12 mx-auto text-surface-400 dark:text-surface-500" />
          <h3 className="mt-4 text-lg font-medium text-surface-900 dark:text-white">
            No assignments {filter !== 'all' ? `${filter}` : ''}
          </h3>
          <p className="mt-2 text-surface-600 dark:text-surface-400">
            {filter === 'all'
              ? "You don't have any assignments yet."
              : filter === 'pending'
              ? "You don't have any pending assignments."
              : filter === 'submitted'
              ? "You don't have any submitted assignments waiting for grading."
              : "You don't have any graded assignments."}
          </p>
        </div>
      )}
    </div>
  );
};

export default Assignments;