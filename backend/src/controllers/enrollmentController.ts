import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../middleware/errorHandler';
import { getSupabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { Enrollment } from '../types';

// @desc    Enroll in a course
// @route   POST /api/enrollments
// @access  Private
export const enrollInCourse = asyncHandler(async (req: Request, res: Response) => {
  const { course_id } = req.body;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  if (!course_id) {
    throw new ApiError(400, 'Course ID is required');
  }
  
  const supabase = getSupabase();
  
  // Check if course exists and is published
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, is_published, instructor_id')
    .eq('id', course_id)
    .single();
  
  if (courseError || !course) {
    throw new ApiError(404, 'Course not found');
  }
  
  if (!course.is_published && course.instructor_id !== userId) {
    throw new ApiError(400, 'This course is not available for enrollment');
  }
  
  // Check if already enrolled
  const { data: existingEnrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', course_id)
    .maybeSingle();
  
  if (existingEnrollment) {
    throw new ApiError(400, 'You are already enrolled in this course');
  }
  
  // Create enrollment
  const enrollment: Partial<Enrollment> = {
    user_id: userId,
    course_id,
    enrolled_at: new Date().toISOString(),
    progress_percentage: 0,
    last_accessed_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('enrollments')
    .insert(enrollment)
    .select()
    .single();
  
  if (error) {
    logger.error(`Enrollment error: ${error.message}`);
    throw new ApiError(500, 'Failed to enroll in course');
  }
  
  res.status(201).json({
    success: true,
    data
  });
});

// @desc    Get user enrollments
// @route   GET /api/enrollments
// @access  Private
export const getUserEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Get user enrollments with course details
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(id, title, description, cover_image_url, instructor_id, category, difficulty_level)
    `)
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false });
  
  if (error) {
    logger.error(`Enrollment fetch error: ${error.message}`);
    throw new ApiError(500, 'Failed to fetch enrollments');
  }
  
  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

// @desc    Get course enrollments (for instructors)
// @route   GET /api/enrollments/course/:courseId
// @access  Private (Instructor only)
export const getCourseEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Check if user is the course instructor
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();
  
  if (courseError || !course) {
    throw new ApiError(404, 'Course not found');
  }
  
  if (course.instructor_id !== userId) {
    throw new ApiError(403, 'You are not authorized to view these enrollments');
  }
  
  // Get course enrollments with user details
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      user:profiles(id, email, first_name, last_name, avatar_url)
    `)
    .eq('course_id', courseId)
    .order('enrolled_at', { ascending: false });
  
  if (error) {
    logger.error(`Enrollment fetch error: ${error.message}`);
    throw new ApiError(500, 'Failed to fetch enrollments');
  }
  
  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

// @desc    Update enrollment progress
// @route   PUT /api/enrollments/:id/progress
// @access  Private
export const updateEnrollmentProgress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { progress_percentage, last_lesson_id } = req.body;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  if (progress_percentage === undefined) {
    throw new ApiError(400, 'Progress percentage is required');
  }
  
  const supabase = getSupabase();
  
  // Check if enrollment exists and belongs to user
  const { data: enrollment, error: fetchError } = await supabase
    .from('enrollments')
    .select('id, user_id, course_id')
    .eq('id', id)
    .single();
  
  if (fetchError || !enrollment) {
    throw new ApiError(404, 'Enrollment not found');
  }
  
  if (enrollment.user_id !== userId) {
    throw new ApiError(403, 'You are not authorized to update this enrollment');
  }
  
  // Update enrollment progress
  const updateData: Partial<Enrollment> = {
    progress_percentage,
    last_accessed_at: new Date().toISOString()
  };
  
  // Also track last lesson if provided
  if (last_lesson_id) {
    // First verify lesson belongs to the enrolled course
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, section:sections(course_id)')
      .eq('id', last_lesson_id)
      .single();
    
    if (lessonError || !lesson || lesson.section[0].course_id !== enrollment.course_id) {
      throw new ApiError(400, 'Invalid lesson ID');
    }
    
    // Record lesson progress in a separate table
    await supabase
      .from('lesson_progress')
      .upsert({
        user_id: userId,
        lesson_id: last_lesson_id,
        completed: true,
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,lesson_id' });
  }
  
  // Update enrollment
  const { data, error } = await supabase
    .from('enrollments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    logger.error(`Enrollment update error: ${error.message}`);
    throw new ApiError(500, 'Failed to update enrollment progress');
  }
  
  res.status(200).json({
    success: true,
    data
  });
});

// @desc    Complete enrollment
// @route   PUT /api/enrollments/:id/complete
// @access  Private
export const completeEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Check if enrollment exists and belongs to user
  const { data: enrollment, error: fetchError } = await supabase
    .from('enrollments')
    .select('id, user_id')
    .eq('id', id)
    .single();
  
  if (fetchError || !enrollment) {
    throw new ApiError(404, 'Enrollment not found');
  }
  
  if (enrollment.user_id !== userId) {
    throw new ApiError(403, 'You are not authorized to update this enrollment');
  }
  
  // Mark enrollment as completed
  const { data, error } = await supabase
    .from('enrollments')
    .update({
      completed_at: new Date().toISOString(),
      progress_percentage: 100,
      last_accessed_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    logger.error(`Enrollment completion error: ${error.message}`);
    throw new ApiError(500, 'Failed to complete enrollment');
  }
  
  res.status(200).json({
    success: true,
    data
  });
});

// @desc    Unenroll from course
// @route   DELETE /api/enrollments/course/:courseId
// @access  Private
export const unenrollFromCourse = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Check if enrollment exists
  const { data: enrollment, error: fetchError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();
  
  if (fetchError || !enrollment) {
    throw new ApiError(404, 'Enrollment not found');
  }
  
  // Delete enrollment
  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('id', enrollment.id);
  
  if (error) {
    logger.error(`Unenrollment error: ${error.message}`);
    throw new ApiError(500, 'Failed to unenroll from course');
  }
  
  res.status(200).json({
    success: true,
    message: 'Successfully unenrolled from course'
  });
});

// @desc    Get progress for a specific course enrollment
// @route   GET /api/enrollments/progress/:courseId
// @access  Private
export const getCourseProgress = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // First, check if the user is enrolled in this course
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();
  
  if (enrollmentError) {
    if (enrollmentError.code === 'PGRST116') {
      throw new ApiError(404, 'You are not enrolled in this course');
    }
    
    logger.error(`Error fetching enrollment: ${enrollmentError.message}`);
    throw new ApiError(500, 'Failed to fetch enrollment information');
  }
  
  // Get lessons for this course to calculate detailed progress
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, title')
    .eq('course_id', courseId)
    .order('order', { ascending: true });
  
  if (lessonsError) {
    logger.error(`Error fetching lessons: ${lessonsError.message}`);
    throw new ApiError(500, 'Failed to fetch course lessons');
  }
  
  // Get lesson progress for this user - using user_id instead of enrollment_id
  const { data: lessonProgress, error: progressError } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId); // Changed from enrollment_id to user_id
  
  if (progressError) {
    logger.error(`Error fetching lesson progress: ${progressError.message}`);
    throw new ApiError(500, 'Failed to fetch lesson progress');
  }
  
  // Filter lesson progress to only include this course's lessons
  const lessonIds = lessons?.map(lesson => lesson.id) || [];
  const courseProgress = lessonProgress?.filter(progress => lessonIds.includes(progress.lesson_id)) || [];
  
  // Create a map of completed lessons
  const completedLessons = new Map();
  courseProgress.forEach(progress => {
    if (progress.completed) {
      completedLessons.set(progress.lesson_id, progress);
    }
  });
  
  // Calculate progress metrics
  const totalLessons = lessons?.length || 0;
  const completedCount = completedLessons.size;
  const progressPercentage = totalLessons > 0 
    ? Math.round((completedCount / totalLessons) * 100) 
    : 0;
  
  // Prepare detailed lesson progress data
  const detailedProgress = lessons?.map(lesson => ({
    lesson_id: lesson.id,
    title: lesson.title,
    completed: completedLessons.has(lesson.id),
    completed_at: completedLessons.get(lesson.id)?.completed_at || null
  })) || [];
  
  // Update enrollment progress percentage if it has changed
  if (progressPercentage !== enrollment.progress_percentage) {
    await supabase
      .from('enrollments')
      .update({
        progress_percentage: progressPercentage,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', enrollment.id);
  }
  
  res.status(200).json({
    success: true,
    data: {
      enrollment_id: enrollment.id,
      enrolled_at: enrollment.enrolled_at,
      last_accessed_at: enrollment.last_accessed_at,
      completed_at: enrollment.completed_at,
      progress_percentage: progressPercentage,
      completed_lessons: completedCount,
      total_lessons: totalLessons,
      detailed_progress: detailedProgress
    }
  });
});