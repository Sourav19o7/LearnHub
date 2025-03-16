import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Course, Section } from '../types';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/common/LoadingScreen';
import {
  AcademicCapIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  BookOpenIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

const CourseDetails = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { isAuthenticated, profile } = useAuth();
  const navigate = useNavigate();
  const [enrolling, setEnrolling] = useState(false);

  // Fetch course details
  const { data: courseData, isLoading: isLoadingCourse, error: courseError } = useQuery(
    ['course', courseId],
    async () => {
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    }
  );

  // Fetch course sections and lessons
  const { data: sectionsData, isLoading: isLoadingSections } = useQuery(
    ['course-sections', courseId],
    async () => {
      const response = await api.get(`/courses/${courseId}/sections`);
      return response.data;
    },
    {
      enabled: !!courseId
    }
  );

  // Check if user is enrolled
  const { data: enrollmentData, isLoading: isLoadingEnrollment } = useQuery(
    ['enrollment', courseId],
    async () => {
      if (!isAuthenticated) return { enrolled: false };
      
      try {
        const response = await api.get('/enrollments');
        const enrollments = response.data.data;
        const isEnrolled = enrollments.some((e: any) => e.course_id === courseId);
        return { enrolled: isEnrolled };
      } catch (error) {
        console.error('Error checking enrollment:', error);
        return { enrolled: false };
      }
    },
    {
      enabled: isAuthenticated
    }
  );

  const isLoading = isLoadingCourse || isLoadingSections || isLoadingEnrollment;
  const course: Course = courseData?.data;
  const sections: Section[] = sectionsData?.data || [];
  const isEnrolled = enrollmentData?.enrolled;
  const isInstructor = course?.instructor_id === profile?.id;

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${courseId}` } });
      return;
    }

    setEnrolling(true);
    try {
      await api.post('/enrollments', { course_id: courseId });
      toast.success('Successfully enrolled in course!');
      // Refetch enrollment data
      navigate(`/dashboard/courses/${courseId}`);
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('Failed to enroll in course. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  if (isLoading) return <LoadingScreen />;

  if (courseError || !course) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
            Course Not Found
          </h2>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            The course you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center btn-filled"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course main content */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-4">
            {course.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(
                course.difficulty_level
              )}`}
            >
              {course.difficulty_level.charAt(0).toUpperCase() +
                course.difficulty_level.slice(1)}
            </span>
            
            <div className="flex items-center">
              <StarIcon className="h-5 w-5 text-yellow-400" />
              <span className="ml-1 text-sm text-surface-700 dark:text-surface-300">4.5 (120 reviews)</span>
            </div>
            
            <div className="flex items-center">
              <UserIcon className="h-5 w-5 text-surface-500 dark:text-surface-400 mr-1" />
              <span className="text-sm text-surface-700 dark:text-surface-300">
                {course.instructor ? 
                 `${course.instructor.first_name} ${course.instructor.last_name}` : 
                 'Instructor'}
              </span>
            </div>
            
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-surface-500 dark:text-surface-400 mr-1" />
              <span className="text-sm text-surface-700 dark:text-surface-300">
                Updated {new Date(course.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          {course.cover_image_url && (
            <div className="mb-6 rounded-lg overflow-hidden shadow-md dark:shadow-dark-md">
              <img
                src={course.cover_image_url}
                alt={course.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
          
          <div className="mb-8">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-4">
              About This Course
            </h2>
            <p className="text-surface-700 dark:text-surface-300 whitespace-pre-line">
              {course.description}
            </p>
          </div>
          
          {/* Curriculum */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-4">
              Course Curriculum
            </h2>
            
            {sections.length > 0 ? (
              <div className="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden divide-y divide-surface-200 dark:divide-surface-700">
                {sections.map((section) => (
                  <div key={section.id} className="bg-white dark:bg-surface-800">
                    <div className="p-4 bg-surface-50 dark:bg-surface-850 font-medium text-surface-900 dark:text-white">
                      {section.title}
                    </div>
                    <div className="divide-y divide-surface-200 dark:divide-surface-700">
                      {/* Lessons would go here - simplified for now */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          {isEnrolled ? (
                            <CheckCircleIcon className="h-5 w-5 text-success-500 dark:text-success-400 mr-2" />
                          ) : (
                            <LockClosedIcon className="h-5 w-5 text-surface-400 dark:text-surface-500 mr-2" />
                          )}
                          <span className="text-surface-700 dark:text-surface-300">Introduction to the Course</span>
                        </div>
                        <span className="text-sm text-surface-500 dark:text-surface-400">10 min</span>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <BookOpenIcon className="h-5 w-5 text-primary-500 dark:text-primary-400 mr-2" />
                          <span className="text-surface-700 dark:text-surface-300">Getting Started (Preview)</span>
                        </div>
                        <span className="text-sm text-surface-500 dark:text-surface-400">15 min</span>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          {isEnrolled ? (
                            <CheckCircleIcon className="h-5 w-5 text-success-500 dark:text-success-400 mr-2" />
                          ) : (
                            <LockClosedIcon className="h-5 w-5 text-surface-400 dark:text-surface-500 mr-2" />
                          )}
                          <span className="text-surface-700 dark:text-surface-300">Core Concepts</span>
                        </div>
                        <span className="text-sm text-surface-500 dark:text-surface-400">25 min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-surface-600 dark:text-surface-400">
                This course doesn't have any sections yet.
              </p>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 card">
            <div className="mb-4">
              {course.price ? (
                <div className="text-3xl font-bold text-surface-900 dark:text-white">
                  ${course.price}
                </div>
              ) : (
                <div className="text-3xl font-bold text-success-600 dark:text-success-400">
                  Free
                </div>
              )}
            </div>
            
            {isEnrolled ? (
              <Link
                to={`/dashboard/courses/${course.id}`}
                className="w-full mb-4 btn-filled"
              >
                Continue Learning
              </Link>
            ) : isInstructor ? (
              <Link
                to={`/instructor/courses/${course.id}/edit`}
                className="w-full mb-4 btn-filled"
              >
                Edit Course
              </Link>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full mb-4 btn-filled disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enrolling ? 'Enrolling...' : 'Enroll Now'}
              </button>
            )}
            
            <ul className="space-y-4 text-surface-700 dark:text-surface-300">
              <li className="flex items-start">
                <AcademicCapIcon className="h-6 w-6 text-primary-500 dark:text-primary-400 mr-2 flex-shrink-0" />
                <span>
                  <strong className="font-medium">Instructor:</strong> {' '}
                  {course.instructor ? 
                   `${course.instructor.first_name} ${course.instructor.last_name}` : 
                   'Instructor'}
                </span>
              </li>
              <li className="flex items-start">
                <ClockIcon className="h-6 w-6 text-primary-500 dark:text-primary-400 mr-2 flex-shrink-0" />
                <span>
                  <strong className="font-medium">Duration:</strong> {' '}
                  {course.duration_weeks 
                    ? `${course.duration_weeks} weeks` 
                    : 'Self-paced'}
                </span>
              </li>
              <li className="flex items-start">
                <BookOpenIcon className="h-6 w-6 text-primary-500 dark:text-primary-400 mr-2 flex-shrink-0" />
                <span>
                  <strong className="font-medium">Lessons:</strong> {' '}
                  12 lessons
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-primary-500 dark:text-primary-400 mr-2 flex-shrink-0" />
                <span>
                  <strong className="font-medium">Level:</strong> {' '}
                  {course.difficulty_level.charAt(0).toUpperCase() + course.difficulty_level.slice(1)}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;