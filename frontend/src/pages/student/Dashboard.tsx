import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../../components/common/LoadingScreen';
import { Course, Enrollment, Assignment } from '../../types';
import {
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const StudentDashboard = () => {
  const { profile, isAuthenticated, user } = useAuth();

  // Fetch user's enrollments using the 'me' endpoint
  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useQuery(
    ['enrollments', user?.id],
    async () => {
      const response = await api.get('/users/me/enrollments');
      return response.data;
    },
    {
      enabled: isAuthenticated // Only run if we're authenticated
    }
  );

  // Fetch user's assignments using the 'me' endpoint
  const { data: assignmentsData, isLoading: isLoadingAssignments } = useQuery(
    ['assignments', user?.id],
    async () => {
      const response = await api.get('/users/me/assignments');
      return response.data;
    },
    {
      enabled: isAuthenticated // Only run if we're authenticated
    }
  );

  // Fetch user's stats using the 'me' endpoint
  const { data: statsData, isLoading: isLoadingStats } = useQuery(
    ['user-stats', user?.id],
    async () => {
      const response = await api.get('/users/me/stats');
      return response.data;
    },
    {
      enabled: isAuthenticated // Only run if we're authenticated
    }
  );

  const isLoading = isLoadingEnrollments || isLoadingAssignments || isLoadingStats;

  if (isLoading) return <LoadingScreen />;

  const enrollments: Enrollment[] = enrollmentsData?.data || [];
  const assignments: Assignment[] = assignmentsData?.data || [];
  const stats = statsData?.data || {};

  // Get in-progress courses (not completed)
  const inProgressCourses = enrollments
    .filter(enrollment => !enrollment.completed_at)
    .slice(0, 3);

  // Get recently completed assignments
  const recentAssignments = assignments
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 5);

  // Calculate overall progress percentage across all courses
  const overallProgress = enrollments.length > 0
    ? enrollments.reduce((sum, enrollment) => sum + enrollment.progress_percentage, 0) / enrollments.length
    : 0;

  return (
    <div>
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
          Welcome back, {profile?.first_name}!
        </h1>
        <p className="text-surface-600 dark:text-surface-400">
          Here's an overview of your learning progress.
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
              <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Enrolled Courses</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{enrollments.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start">
            <div className="p-2 bg-success-100 dark:bg-success-900/50 rounded-lg mr-4">
              <AcademicCapIcon className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Completed Courses</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {enrollments.filter(e => e.completed_at).length}
              </p>
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
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{assignments.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start">
            <div className="p-2 bg-secondary-100 dark:bg-secondary-900/50 rounded-lg mr-4">
              <ChartBarIcon className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Overall Progress</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{Math.round(overallProgress)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Continue learning section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-surface-900 dark:text-white">Continue Learning</h2>
                <Link
                  to="/dashboard/courses"
                  className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                >
                  View all courses
                </Link>
              </div>
            </div>
            <div className="divide-y divide-surface-200 dark:divide-surface-700">
              {inProgressCourses.length > 0 ? (
                inProgressCourses.map((enrollment) => (
                  <div key={enrollment.id} className="p-6">
                    <div className="flex flex-col sm:flex-row items-start">
                      {enrollment.course?.cover_image_url && (
                        <img
                          src={enrollment.course.cover_image_url}
                          alt={enrollment.course.title}
                          className="w-full sm:w-24 h-16 object-cover rounded mb-4 sm:mb-0 sm:mr-4"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-surface-900 dark:text-white mb-1">
                          {enrollment.course?.title}
                        </h3>
                        <div className="flex items-center text-sm text-surface-600 dark:text-surface-400 mb-3">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span>Last accessed: {new Date(enrollment.last_accessed_at || '').toLocaleDateString()}</span>
                        </div>
                        <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 mb-2">
                          <div
                            className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full"
                            style={{ width: `${enrollment.progress_percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-surface-600 dark:text-surface-400">
                          <span>{enrollment.progress_percentage}% complete</span>
                          <Link
                            to={`/dashboard/courses/${enrollment.course_id}`}
                            className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                          >
                            Continue
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <p className="text-surface-600 dark:text-surface-400 mb-4">
                    You're not enrolled in any courses yet.
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
          </div>
        </div>

        {/* Recent assignments */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <div className="p-6 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-surface-900 dark:text-white">Recent Assignments</h2>
                <Link
                  to="/dashboard/assignments"
                  className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="divide-y divide-surface-200 dark:divide-surface-700">
              {recentAssignments.length > 0 ? (
                recentAssignments.map((assignment) => (
                  <div key={assignment.id} className="p-4">
                    <h3 className="text-sm font-medium text-surface-900 dark:text-white">
                      {assignment?.title}
                    </h3>
                    <p className="text-xs text-surface-600 dark:text-surface-400 mt-1">
                      {assignment?.course?.title}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        assignment.status === 'graded'
                          ? 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300'
                          : 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300'
                      }`}>
                        {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </span>
                      <Link
                        to={`/dashboard/assignments/${assignment.id}`}
                        className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <p className="text-surface-600 dark:text-surface-400">
                    You don't have any assignments yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended courses */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-surface-900 dark:text-white">Recommended Courses</h2>
          <Link
            to="/courses"
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
          >
            Browse all courses
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Placeholder for recommended courses - would be populated from API */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="card overflow-hidden flex flex-col">
              <img
                src={`https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1172&q=80`}
                alt="Placeholder"
                className="h-32 w-full object-cover"
              />
              <div className="p-4 flex-1">
                <h3 className="text-base font-medium text-surface-900 dark:text-white mb-1">
                  {i === 1 ? 'Advanced JavaScript Concepts' : i === 2 ? 'React Fundamentals' : 'Data Science Basics'}
                </h3>
                <p className="text-sm text-surface-600 dark:text-surface-400 mb-2">
                  {i === 1 ? 'Master advanced JS concepts' : i === 2 ? 'Build modern React apps' : 'Learn data analysis fundamentals'}
                </p>
                <div className="mt-auto">
                  <div className="flex items-center text-sm text-surface-600 dark:text-surface-400">
                    <AcademicCapIcon className="h-4 w-4 mr-1" />
                    <span>
                      {i === 1 ? 'Advanced' : i === 2 ? 'Intermediate' : 'Beginner'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-surface-50 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700">
                <Link
                  to={`/courses/${i}`}
                  className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                >
                  View Course
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;