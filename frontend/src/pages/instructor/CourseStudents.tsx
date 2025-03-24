import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import LoadingScreen from '../../components/common/LoadingScreen';
import {
  ArrowLeftIcon,
  UserCircleIcon,
  EnvelopeIcon,
  ClockIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  enrollment_date: string;
  progress?: number;
  completed_lessons?: number;
  total_lessons?: number;
  last_active?: string;
}

const CourseStudents = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'enrollment_date' | 'progress'>('enrollment_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch course details
  const { data: courseData, isLoading: isLoadingCourse, error: courseError } = useQuery(
    ['course', courseId],
    async () => {
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    }
  );

  // Fetch course students
  const { data: studentsData, isLoading: isLoadingStudents, error: studentsError } = useQuery(
    ['course-students', courseId, sortBy, sortOrder],
    async () => {
      const response = await api.get(`/courses/${courseId}/students`, {
        params: {
          sortBy,
          sortOrder,
        },
      });
      return response.data;
    },
    {
      enabled: !!courseId
    }
  );

  const isLoading = isLoadingCourse || isLoadingStudents;
  const error = courseError || studentsError;
  
  const course = courseData?.data;
  const students: Student[] = studentsData?.data || [];

  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           student.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle sorting
  const handleSort = (field: 'name' | 'enrollment_date' | 'progress') => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to descending order
      setSortBy(field);
      setSortOrder('desc');
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

  if (isLoading) return <LoadingScreen />;

  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
            Course Not Found
          </h2>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            The course you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => navigate('/instructor/courses')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/instructor/courses')}
            className="text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            Students - {course.title}
          </h1>
        </div>
        <p className="mt-2 text-surface-600 dark:text-surface-400">
          Manage and track students enrolled in this course
        </p>
      </div>

      <div className="bg-white dark:bg-surface-800 shadow-sm dark:shadow-dark-sm rounded-lg overflow-hidden">
        {/* Stats */}
        <div className="p-6 border-b border-surface-200 dark:border-surface-700 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-50 dark:bg-surface-850 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-surface-900 dark:text-white">
              Total Students
            </h3>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">
              {students.length}
            </p>
          </div>
          <div className="bg-surface-50 dark:bg-surface-850 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-surface-900 dark:text-white">
              Average Progress
            </h3>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">
              {students.length > 0
                ? `${Math.round(
                    students.reduce((sum, student) => sum + (student.progress || 0), 0) / students.length
                  )}%`
                : '0%'}
            </p>
          </div>
          <div className="bg-surface-50 dark:bg-surface-850 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-surface-900 dark:text-white">
              Completion Rate
            </h3>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">
              {students.length > 0
                ? `${Math.round(
                    (students.filter(student => (student.progress || 0) >= 100).length / students.length) * 100
                  )}%`
                : '0%'}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-surface-200 dark:border-surface-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Students List */}
        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-700">
              <thead className="bg-surface-50 dark:bg-surface-850">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      <span>Student</span>
                      {sortBy === 'name' && (
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
                    onClick={() => handleSort('enrollment_date')}
                  >
                    <div className="flex items-center">
                      <span>Enrolled</span>
                      {sortBy === 'enrollment_date' && (
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
                    onClick={() => handleSort('progress')}
                  >
                    <div className="flex items-center">
                      <span>Progress</span>
                      {sortBy === 'progress' && (
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
                    Last Active
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
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-surface-50 dark:hover:bg-surface-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-surface-200 dark:bg-surface-700">
                          {student.avatar_url ? (
                            <img
                              src={student.avatar_url}
                              alt={`${student.first_name} ${student.last_name}`}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <UserCircleIcon className="h-10 w-10 text-surface-500 dark:text-surface-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-surface-900 dark:text-white">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-sm text-surface-500 dark:text-surface-400 flex items-center">
                            <EnvelopeIcon className="h-4 w-4 mr-1" />
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300">
                      {formatDate(student.enrollment_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center">
                          <span className="text-sm text-surface-700 dark:text-surface-300 mr-2">
                            {student.progress || 0}%
                          </span>
                          <div className="w-24 bg-surface-200 dark:bg-surface-700 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${
                                (student.progress || 0) >= 100
                                  ? 'bg-success-500 dark:bg-success-400'
                                  : 'bg-primary-500 dark:bg-primary-400'
                              }`}
                              style={{ width: `${student.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                          {student.completed_lessons || 0}/{student.total_lessons || 0} lessons
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300">
                      {student.last_active ? (
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1 text-surface-500 dark:text-surface-400" />
                          {formatDate(student.last_active)}
                        </div>
                      ) : (
                        <span className="text-surface-500 dark:text-surface-400">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          toast.success(`Email sent to ${student.first_name} ${student.last_name}`);
                        }}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-4"
                      >
                        Message
                      </button>
                      <button
                        onClick={() => {
                          toast.success(`Progress report for ${student.first_name} ${student.last_name} generated`);
                        }}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <UserCircleIcon className="h-12 w-12 mx-auto text-surface-400 dark:text-surface-500" />
            <h3 className="mt-4 text-lg font-medium text-surface-900 dark:text-white">
              No students found
            </h3>
            <p className="mt-2 text-surface-600 dark:text-surface-400">
              {searchTerm
                ? `No students match "${searchTerm}"`
                : "No students have enrolled in this course yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseStudents;