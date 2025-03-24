import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import LoadingScreen from '../../components/common/LoadingScreen';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Course, Section, Lesson } from '../../types';
import { toast } from 'react-hot-toast';

interface DetailedProgressItem {
  lesson_id: string;
  title?: string;
  completed: boolean;
  completed_at: string | null;
}
const CourseContent = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isLoadingCompletion, setIsLoadingCompletion] = useState(false);
  const [sectionLessons, setSectionLessons] = useState<Record<string, Lesson[]>>({});

  // Fetch course details
  const { data: courseData, isLoading: isLoadingCourse } = useQuery(
    ['course', courseId],
    async () => {
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    }
  );

  // Fetch course sections
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

  // Fetch user's progress for this course
  const { data: progressData, isLoading: isLoadingProgress } = useQuery(
    ['course-progress', courseId],
    async () => {
      const response = await api.get(`/enrollments/progress/${courseId}`);
      return response.data;
    },
    {
      enabled: !!courseId,
      // It's okay if this fails for non-enrolled users
      onError: () => {
        console.log('Not enrolled or progress API not available');
      }
    }
  );

  // Fetch lessons for a specific section when it's opened
  const fetchSectionLessons = async (sectionId: string) => {
    try {
      // Only fetch if we don't already have this section's lessons
      if (!sectionLessons[sectionId]) {
        const response = await api.get(`/courses/${courseId}/sections/${sectionId}/lessons`);
        setSectionLessons(prev => ({
          ...prev,
          [sectionId]: response.data.data
        }));
        return response.data.data;
      }
      return sectionLessons[sectionId];
    } catch (error) {
      console.error(`Error fetching lessons for section ${sectionId}:`, error);
      toast.error('Failed to load lessons for this section');
      return [];
    }
  };

  const isLoading = isLoadingCourse || isLoadingSections || isLoadingProgress;
  const course: Course = courseData?.data;
  const sections: Section[] = sectionsData?.data || [];

  // When a section is toggled, fetch its lessons if needed
  useEffect(() => {
    if (activeSection) {
      fetchSectionLessons(activeSection);
    }
  }, [activeSection]);

  // Find current lesson based on URL param
  useEffect(() => {
    const loadCurrentLesson = async () => {
      if (!sections || sections.length === 0) return;
      
      // If we have a lessonId, we need to find which section it belongs to
      if (lessonId) {
        for (const section of sections) {
          // If we haven't fetched this section's lessons yet, do it now
          const lessons = sectionLessons[section.id] || await fetchSectionLessons(section.id);
          
          const lesson = lessons.find(l => l.id === lessonId);
          if (lesson) {
            setCurrentLesson(lesson);
            setActiveSection(section.id);
            return;
          }
        }
        
        // If we get here, the lesson wasn't found in any section
        navigate(`/dashboard/courses/${courseId}`);
      } else {
        // No lessonId specified, so find the first lesson
        for (const section of sections) {
          const lessons = sectionLessons[section.id] || await fetchSectionLessons(section.id);
          
          if (lessons && lessons.length > 0) {
            setCurrentLesson(lessons[0]);
            setActiveSection(section.id);
            // navigate(`/dashboard/courses/${courseId}/lessons/${lessons[0].id}`, { replace: true });
            return;
          }
        }
      }
    };
    
    loadCurrentLesson();
  }, [sections, lessonId, courseId, navigate, sectionLessons]);

  // Update progress when progressData changes
  useEffect(() => {
    if (progressData?.data) {
      const { detailed_progress, progress_percentage } = progressData.data;
      
      // Extract completed lesson IDs from detailed progress
      const completedLessonIds = detailed_progress
        ? detailed_progress
            .filter((item: DetailedProgressItem) => item.completed)
            .map((item: DetailedProgressItem) => item.lesson_id)
        : [];
        
      setCompletedLessons(completedLessonIds);
      setProgressPercent(progress_percentage || 0);
    }
  }, [progressData]);
  // Update progress by marking current lesson as completed
  const markLessonAsCompleted = async () => {
    if (!currentLesson) return;

    try {
      setIsLoadingCompletion(true);
      
      // Adjust this endpoint to match your API
      const response = await api.post(`/enrollments/progress/${courseId}/lessons/${currentLesson.id}`);
      
      if (response.data.success) {
        toast.success('Progress saved!');
        
        // Update local state
        setCompletedLessons(prev => {
          if (prev.includes(currentLesson.id)) return prev;
          return [...prev, currentLesson.id];
        });
        
        // Calculate new progress percentage based on all lessons across all sections
        let totalLessonsCount = 0;
        for (const sectionId in sectionLessons) {
          totalLessonsCount += sectionLessons[sectionId].length;
        }
        
        const newCompletedCount = completedLessons.length + 
          (completedLessons.includes(currentLesson.id) ? 0 : 1);
          
        const newPercentage = totalLessonsCount > 0 
          ? Math.round((newCompletedCount / totalLessonsCount) * 100)
          : 0;
          
        setProgressPercent(newPercentage);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    } finally {
      setIsLoadingCompletion(false);
    }
  };

  // Go to next lesson
  const goToNextLesson = () => {
    if (!currentLesson) return;
    
    // Find all lessons across all sections in the correct order
    const allLessons: { sectionId: string, lesson: Lesson }[] = [];
    
    sections.forEach(section => {
      const lessons = sectionLessons[section.id] || [];
      lessons.forEach(lesson => {
        allLessons.push({ sectionId: section.id, lesson });
      });
    });
    
    // Find the current lesson's index
    const currentIndex = allLessons.findIndex(item => item.lesson.id === currentLesson.id);
    
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      const nextItem = allLessons[currentIndex + 1];
      
      // If the next lesson is in a different section, expand that section
      if (nextItem.sectionId !== activeSection) {
        setActiveSection(nextItem.sectionId);
      }
      
      // Navigate to the next lesson
      navigate(`/dashboard/courses/${courseId}/lessons/${nextItem.lesson.id}`);
    } else {
      // If no next lesson, we've reached the end of the course
      toast.success('Congratulations! You\'ve reached the end of this course.');
    }
  };

  // Toggle section collapse
  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  if (isLoading) return <LoadingScreen />;

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
          Course Not Found
        </h2>
        <p className="text-surface-600 dark:text-surface-400 mb-6">
          The course you're looking for doesn't exist or you don't have access to it.
        </p>
        <Link
          to="/dashboard/courses"
          className="inline-flex items-center btn-filled"
        >
          Back to My Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-900">
      <div className="relative h-16 bg-primary-700 dark:bg-primary-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <Link
            to="/dashboard/courses"
            className="mr-4 text-primary-100 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
            </svg>
          </Link>
          <h1 className="text-lg font-medium text-white truncate">
            {course.title}
          </h1>
          <div className="ml-auto flex items-center">
            <div className="w-48 bg-primary-800 dark:bg-primary-950 rounded-full h-2.5 mr-2">
              <div 
                className="bg-primary-300 h-2.5 rounded-full" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-primary-100 text-sm">{progressPercent}% complete</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
        {/* Sidebar - Course Curriculum */}
        <div className="w-full md:w-80 border-r border-surface-200 dark:border-surface-700 flex-shrink-0 bg-surface-50 dark:bg-surface-800 overflow-y-auto">
          <nav className="sticky top-0 p-4">
            <h2 className="text-lg font-medium text-surface-900 dark:text-white mb-4">
              Course Content
            </h2>
            
            <div className="space-y-2">
              {sections.map((section) => (
                <div key={section.id} className="border border-surface-200 dark:border-surface-700 rounded-md overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full p-3 flex justify-between items-center bg-white dark:bg-surface-850 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-left"
                  >
                    <span className="font-medium text-surface-900 dark:text-white">
                      {section.title}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 text-surface-500 dark:text-surface-400 transform transition-transform ${
                        activeSection === section.id ? 'rotate-180' : ''
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {activeSection === section.id && (
                    <ul className="border-t border-surface-200 dark:border-surface-700 divide-y divide-surface-200 dark:divide-surface-700">
                      {/* Show loading indicator while fetching section lessons */}
                      {!sectionLessons[section.id] ? (
                        <li className="p-3 text-center text-sm text-surface-500 dark:text-surface-400">
                          Loading lessons...
                        </li>
                      ) : sectionLessons[section.id].length === 0 ? (
                        <li className="p-3 text-center text-sm text-surface-500 dark:text-surface-400">
                          No lessons in this section
                        </li>
                      ) : (
                        sectionLessons[section.id].map((lesson) => (
                          <li key={lesson.id}>
                            <Link
                              to={`/dashboard/courses/${courseId}/lessons/${lesson.id}`}
                              className={`block p-3 flex items-center ${
                                currentLesson?.id === lesson.id
                                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                  : 'hover:bg-surface-50 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300'
                              }`}
                            >
                              {completedLessons.includes(lesson.id) ? (
                                <CheckCircleIcon className="h-5 w-5 text-success-500 dark:text-success-400 mr-2 flex-shrink-0" />
                              ) : (
                                <div className="h-5 w-5 border-2 border-surface-300 dark:border-surface-600 rounded-full mr-2 flex-shrink-0" />
                              )}
                              <span className="text-sm">{lesson.title}</span>
                            </Link>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </nav>
        </div>

        {/* Main content - Lesson */}
        <div className="flex-1 overflow-y-auto">
          {currentLesson ? (
            <div className="p-6 max-w-3xl mx-auto">
              <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
                {currentLesson.title}
              </h1>
              
              {/* Lesson content */}
              <div className="prose dark:prose-invert mb-8">
                {/* This would be the lesson content, potentially HTML from a rich text editor */}
                <div dangerouslySetInnerHTML={{ __html: currentLesson.content || '' }} />
              </div>
              
              {/* Lesson video (if available) */}
              {currentLesson.video_url && (
                <div className="aspect-w-16 aspect-h-9 bg-surface-900 rounded-lg overflow-hidden mb-8">
                  <iframe
                    src={currentLesson.video_url}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              )}
              
              {/* Navigation buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                <div>
                  {/* If needed, add a previous lesson button here */}
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={markLessonAsCompleted}
                    disabled={isLoadingCompletion || completedLessons.includes(currentLesson.id)}
                    className={`${
                      completedLessons.includes(currentLesson.id)
                        ? 'bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300'
                        : 'bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700'
                    } px-4 py-2 rounded-md font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  >
                    {completedLessons.includes(currentLesson.id) ? (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Completed
                      </>
                    ) : isLoadingCompletion ? (
                      'Saving...'
                    ) : (
                      'Mark as Complete'
                    )}
                  </button>
                  <button
                    onClick={goToNextLesson}
                    className="btn-filled"
                  >
                    Next Lesson
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-surface-600 dark:text-surface-400">
                Select a lesson from the sidebar to begin learning
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseContent;