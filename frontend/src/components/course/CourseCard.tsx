import { Link } from 'react-router-dom';
import { Course } from '../../types';
import {
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => {
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
    <div className="flex flex-col rounded-lg shadow-md dark:shadow-dark-md overflow-hidden bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 transition-all duration-200 hover:shadow-lg dark:hover:shadow-dark-lg transform hover:-translate-y-1">
      <div className="flex-shrink-0 aspect-video">
        <img
          className="h-48 w-full object-cover"
          src={
            course.cover_image_url ||
            'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&h=400&q=80'
          }
          alt={course.title}
        />
      </div>
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
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
              <span className="ml-1 text-sm text-surface-500 dark:text-surface-400">4.5</span>
            </div>
          </div>
          <Link to={`/courses/${course.id}`} className="block mt-2 group">
            <p className="text-xl font-semibold text-surface-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-150">
              {course.title}
            </p>
            <p className="mt-3 text-base text-surface-500 dark:text-surface-400 line-clamp-3">
              {course.description}
            </p>
          </Link>
          <div className="mt-4 flex items-center text-sm text-surface-500 dark:text-surface-400">
            <UserIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-surface-400 dark:text-surface-500" />
            <p>
              {course.instructor
                ? `${course.instructor.first_name} ${course.instructor.last_name}`
                : 'Instructor'}
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center">
            <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-surface-400 dark:text-surface-500" />
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {course.duration_weeks
                ? `${course.duration_weeks} weeks`
                : 'Self-paced'}
            </p>
          </div>
          <div>
            {course.price ? (
              <span className="text-lg font-medium text-surface-900 dark:text-white">
                ${course.price}
              </span>
            ) : (
              <span className="text-lg font-medium text-success-600 dark:text-success-400">Free</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;