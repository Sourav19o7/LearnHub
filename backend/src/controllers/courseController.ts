import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../middleware/errorHandler';
import { getSupabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { UserRole, Course, PaginationParams, FilterParams } from '../types';

// @desc    Get user's own courses (created if instructor, enrolled if student)
// @route   GET /api/courses/me
// @access  Private
export const getMyCourses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Get user profile to determine role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (profileError) {
    if (profileError.code === 'PGRST116') {
      throw new ApiError(404, 'User not found');
    }
    
    logger.error(`Error fetching user profile: ${profileError.message}`);
    throw new ApiError(500, `Failed to fetch user profile: ${profileError.message}`);
  }
  
  let data;
  
  // If instructor, get created courses
  if (profile.role === UserRole.INSTRUCTOR || profile.role === UserRole.ADMIN) {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('instructor_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error(`Error fetching instructor courses: ${error.message}`);
      throw new ApiError(500, `Failed to fetch instructor courses: ${error.message}`);
    }
    
    data = courses;
  } else {
    // If student, get enrolled courses
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(*)
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });
    
    if (error) {
      logger.error(`Error fetching enrollments: ${error.message}`);
      throw new ApiError(500, `Failed to fetch enrollments: ${error.message}`);
    }
    
    // Extract course data from enrollments
    data = enrollments.map(enrollment => ({
      ...enrollment.course,
      enrollment_id: enrollment.id,
      enrolled_at: enrollment.enrolled_at,
      completed_at: enrollment.completed_at,
      progress_percentage: enrollment.progress_percentage
    }));
  }
  
  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

// @desc    Get instructor's courses
// @route   GET /api/courses/instructor
// @access  Private (Instructor only)
export const getInstructorCourses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  // Extract pagination parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'created_at';
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
  
  const supabase = getSupabase();
  
  // Start building the query
  let query = supabase
    .from('courses')
    .select('*', { count: 'exact' })
    .eq('instructor_id', userId);
  
  // Apply filters from query parameters
  const category = req.query.category as string;
  const isPublished = req.query.is_published === 'true';
  
  if (category) {
    query = query.eq('category', category);
  }
  
  if (isPublished !== undefined) {
    query = query.eq('is_published', isPublished);
  }
  
  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  
  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  // Execute query with pagination
  const { data, error, count } = await query.range(from, to);
  
  if (error) {
    logger.error(`Error fetching instructor courses: ${error.message}`);
    throw new ApiError(500, `Failed to fetch instructor courses: ${error.message}`);
  }
  
  const total = count || 0;
  const totalPages = Math.ceil(total / limit);
  
  res.status(200).json({
    success: true,
    count: data.length,
    total,
    totalPages,
    currentPage: page,
    data
  });
});

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private
export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Validate input data
  if (!req.body) {
    throw new ApiError(400, 'Course data is required');
  }
  
  const courseData: Partial<Course> = {
    ...req.body,
    instructor_id: userId,
    is_published: false,
    created_at: new Date().toISOString()
  };
  
  // Validate required fields
  if (!courseData.title) {
    throw new ApiError(400, 'Course title is required');
  }
  
  // Insert course
  const { data, error } = await supabase
    .from('courses')
    .insert(courseData)
    .select()
    .single();
  
  if (error) {
    logger.error(`Error creating course: ${error.message}`);
    throw new ApiError(500, 'Failed to create course');
  }
  
  res.status(201).json({
    success: true,
    data
  });
});

// @desc    Get all courses with pagination and filtering
// @route   GET /api/courses
// @access  Public
export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  const supabase = getSupabase();
  
  // Extract pagination parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'created_at';
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
  
  // Start building the query
  let query = supabase
    .from('courses')
    .select('*', { count: 'exact' })
    .eq('is_published', true);
  
  // Apply filters
  const category = req.query.category as string;
  const difficultyLevel = req.query.difficulty_level as string;
  const instructorId = req.query.instructor_id as string;
  const search = req.query.search as string;
  const priceMin = req.query.price_min ? parseFloat(req.query.price_min as string) : undefined;
  const priceMax = req.query.price_max ? parseFloat(req.query.price_max as string) : undefined;
  
  if (category) {
    query = query.eq('category', category);
  }
  
  if (difficultyLevel) {
    query = query.eq('difficulty_level', difficultyLevel);
  }
  
  if (instructorId) {
    query = query.eq('instructor_id', instructorId);
  }
  
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%`
    );
  }
  
  if (priceMin !== undefined) {
    query = query.gte('price', priceMin);
  }
  
  if (priceMax !== undefined) {
    query = query.lte('price', priceMax);
  }
  
  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  
  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  // Execute query with pagination
  const { data, error, count } = await query.range(from, to);
  
  if (error) {
    logger.error(`Error fetching courses: ${error.message}`);
    throw new ApiError(500, 'Failed to fetch courses');
  }
  
  const total = count || 0;
  const totalPages = Math.ceil(total / limit);
  
  res.status(200).json({
    success: true,
    count: data.length,
    total,
    totalPages,
    currentPage: page,
    data
  });
});

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Public
export const getCourseById = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      instructor:profiles(id, first_name, last_name, email)
    `)
    .eq('id', courseId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${error.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Optional: Check if course is published, unless user is the instructor or an admin
  const userId = req.user?.id;
  const userRole = req.user?.role;
  
  if (!data.is_published && 
      data.instructor_id !== userId && 
      userRole !== UserRole.ADMIN) {
    throw new ApiError(403, 'Course is not published');
  }
  
  res.status(200).json({
    success: true,
    data
  });
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Instructor only)
export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const userId = req.user?.id;
  
  const supabase = getSupabase();
  
  // Validate inputs
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  // Validate request body
  if (!req.body) {
    throw new ApiError(400, 'Update data is required');
  }
  
  // First, check if the course exists and belongs to the instructor
  const { data: existingCourse, error: fetchError } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${fetchError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check instructor ownership
  if (existingCourse.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to update this course');
  }
  
  // Prepare update data
  const updateData = {
    ...req.body,
    updated_at: new Date().toISOString()
  };
  
  // Remove any fields that shouldn't be updated
  delete updateData.id;
  delete updateData.instructor_id;
  delete updateData.created_at;
  
  // Update the course
  const { data, error } = await supabase
    .from('courses')
    .update(updateData)
    .eq('id', courseId)
    .select()
    .single();
  
  if (error) {
    logger.error(`Error updating course: ${error.message}`);
    throw new ApiError(500, 'Failed to update course');
  }
  
  res.status(200).json({
    success: true,
    data
  });
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor only)
export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const userId = req.user?.id;
  
  const supabase = getSupabase();
  
  // Validate inputs
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  // First, check if the course exists and belongs to the instructor
  const { data: existingCourse, error: fetchError } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${fetchError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check instructor ownership
  if (existingCourse.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to delete this course');
  }
  
  // Delete the course
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);
  
  if (error) {
    logger.error(`Error deleting course: ${error.message}`);
    throw new ApiError(500, 'Failed to delete course');
  }
  
  res.status(200).json({
    success: true,
    message: 'Course deleted successfully'
  });
});

// @desc    Publish course
// @route   PUT /api/courses/:id/publish
// @access  Private (Instructor only)
export const publishCourse = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const userId = req.user?.id;
  
  const supabase = getSupabase();
  
  // Validate inputs
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  // First, check if the course exists and belongs to the instructor
  const { data: existingCourse, error: fetchError } = await supabase
    .from('courses')
    .select('instructor_id, is_published')
    .eq('id', courseId)
    .single();
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${fetchError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check instructor ownership
  if (existingCourse.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to publish this course');
  }
  
  // Check if course is already published
  if (existingCourse.is_published) {
    throw new ApiError(400, 'Course is already published');
  }
  
  // Update course to published
  const { data, error } = await supabase
    .from('courses')
    .update({ 
      is_published: true,
      published_at: new Date().toISOString() 
    })
    .eq('id', courseId)
    .select()
    .single();
  
  if (error) {
    logger.error(`Error publishing course: ${error.message}`);
    throw new ApiError(500, 'Failed to publish course');
  }
  
  res.status(200).json({
    success: true,
    message: 'Course published successfully',
    data
  });
});

// @desc    Unpublish course
// @route   PUT /api/courses/:id/unpublish
// @access  Private (Instructor only)
export const unpublishCourse = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const userId = req.user?.id;
  
  const supabase = getSupabase();
  
  // Validate inputs
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  // First, check if the course exists and belongs to the instructor
  const { data: existingCourse, error: fetchError } = await supabase
    .from('courses')
    .select('instructor_id, is_published')
    .eq('id', courseId)
    .single();
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${fetchError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check instructor ownership
  if (existingCourse.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to unpublish this course');
  }
  
  // Check if course is already unpublished
  if (!existingCourse.is_published) {
    throw new ApiError(400, 'Course is already unpublished');
  }
  
  // Update course to unpublished
  const { data, error } = await supabase
    .from('courses')
    .update({ 
      is_published: false,
      published_at: null 
    })
    .eq('id', courseId)
    .select()
    .single();
  
  if (error) {
    logger.error(`Error unpublishing course: ${error.message}`);
    throw new ApiError(500, 'Failed to unpublish course');
  }
  
  res.status(200).json({
    success: true,
    message: 'Course unpublished successfully',
    data
  });
});

// @desc    Get course sections
// @route   GET /api/courses/:id/sections
// @access  Public/Private (depends on course visibility)
export const getCourseSections = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const supabase = getSupabase();
  
  // First, check course visibility
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('is_published, instructor_id')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check course visibility
  const userId = req.user?.id;
  const userRole = req.user?.role;
  
  if (!course.is_published && 
      course.instructor_id !== userId && 
      userRole !== UserRole.ADMIN) {
    throw new ApiError(403, 'Course is not accessible');
  }
  
  // Fetch sections
  const { data: sections, error } = await supabase
    .from('course_sections')
    .select('*')
    .eq('course_id', courseId)
    .order('order', { ascending: true });
  
  if (error) {
    logger.error(`Error fetching course sections: ${error.message}`);
    throw new ApiError(500, 'Failed to fetch course sections');
  }
  
  res.status(200).json({
    success: true,
    count: sections.length,
    data: sections
  });
});

// @desc    Create course section
// @route   POST /api/courses/:id/sections
// @access  Private (Instructor only)
export const createSection = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const userId = req.user?.id;
  
  const supabase = getSupabase();
  
  // Validate inputs
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  // Check course ownership
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check instructor ownership
  if (course.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to add sections to this course');
  }
  
  // Prepare section data
  const sectionData = {
    ...req.body,
    course_id: courseId,
    created_at: new Date().toISOString()
  };
  
  // Validate required fields
  if (!sectionData.title) {
    throw new ApiError(400, 'Section title is required');
  }
  
  // Insert section
  const { data, error } = await supabase
    .from('course_sections')
    .insert(sectionData)
    .select()
    .single();
  
  if (error) {
    logger.error(`Error creating section: ${error.message}`);
    throw new ApiError(500, 'Failed to create section');
  }
  
  res.status(201).json({
    success: true,
    data
  });
});

// @desc    Update course section
// @route   PUT /api/courses/:courseId/sections/:sectionId
// @access  Private (Instructor only)
export const updateSection = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.courseId;
  const sectionId = req.params.sectionId;
  const userId = req.user?.id;
  
  const supabase = getSupabase();
  
  // Validate inputs
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  // Check course and section ownership
  const { data: section, error: sectionError } = await supabase
    .from('course_sections')
    .select('course_id')
    .eq('id', sectionId)
    .eq('course_id', courseId)
    .single();
  
  if (sectionError) {
    if (sectionError.code === 'PGRST116') {
      throw new ApiError(404, 'Section not found');
    }
    
    logger.error(`Error fetching section: ${sectionError.message}`);
    throw new ApiError(500, 'Failed to fetch section');
  }
  
  // Verify course ownership
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check instructor ownership
  if (course.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to update sections in this course');
  }
  
  // Prepare update data
  const updateData = {
    ...req.body,
    updated_at: new Date().toISOString()
  };
  
  // Remove any fields that shouldn't be updated
  delete updateData.id;
  delete updateData.course_id;
  delete updateData.created_at;
  
  // Update section
  const { data, error } = await supabase
    .from('course_sections')
    .update(updateData)
    .eq('id', sectionId)
    .select()
    .single();
  
  if (error) {
    logger.error(`Error updating section: ${error.message}`);
    throw new ApiError(500, 'Failed to update section');
  }
  
  res.status(200).json({
    success: true,
    data
  });
});

// @desc    Delete course section
// @route   DELETE /api/courses/:courseId/sections/:sectionId
// @access  Private (Instructor only)
export const deleteSection = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.courseId;
  const sectionId = req.params.sectionId;
  const userId = req.user?.id;
  
  const supabase = getSupabase();
  
  // Validate inputs
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  // Check course and section ownership
  const { data: section, error: sectionError } = await supabase
    .from('course_sections')
    .select('course_id')
    .eq('id', sectionId)
    .eq('course_id', courseId)
    .single();
  
  if (sectionError) {
    if (sectionError.code === 'PGRST116') {
      throw new ApiError(404, 'Section not found');
    }
    
    logger.error(`Error fetching section: ${sectionError.message}`);
    throw new ApiError(500, 'Failed to fetch section');
  }
  
  // Verify course ownership
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check instructor ownership
  if (course.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to delete sections in this course');
  }
  
  // Delete section
  const { error } = await supabase
    .from('course_sections')
    .delete()
    .eq('id', sectionId);
  
  if (error) {
    logger.error(`Error deleting section: ${error.message}`);
    throw new ApiError(500, 'Failed to delete section');
  }
  
  res.status(200).json({
    success: true,
    message: 'Section deleted successfully'
  });
});

// @desc    Get course lessons
// @route   GET /api/courses/:id/lessons
// @access  Public/Private (depends on lesson visibility)
export const getCourseLessons = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const supabase = getSupabase();
  
  // First, check course visibility
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('is_published, instructor_id')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check course visibility
  const userId = req.user?.id;
  const userRole = req.user?.role;
  
  // Check if user is enrolled, is the instructor, is an admin, or course is published
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .single();
  
  const isAccessible = course.is_published || 
    course.instructor_id === userId || 
    userRole === UserRole.ADMIN ||
    !!enrollment;
  
  if (!isAccessible) {
    throw new ApiError(403, 'Course is not accessible');
  }
  
  // Fetch lessons with their associated content
  const { data: lessons, error } = await supabase
    .from('course_lessons')
    .select(`
      *,
      section:course_sections(id, title),
      content:lesson_contents(*)
    `)
    .eq('course_id', courseId)
    .order('order', { ascending: true });
  
  if (error) {
    logger.error(`Error fetching course lessons: ${error.message}`);
    throw new ApiError(500, 'Failed to fetch course lessons');
  }
  
  res.status(200).json({
    success: true,
    count: lessons.length,
    data: lessons
  });
});

// @desc    Get course assignments
// @route   GET /api/courses/:id/assignments
// @access  Private (Enrolled students and instructor)
export const getCourseAssignments = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // First, check course and user access
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('instructor_id, is_published')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check user access
  const userRole = req.user?.role;
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .single();
  
  const isAccessible = course.instructor_id === userId || 
    userRole === UserRole.ADMIN ||
    (course.is_published && !!enrollment);
  
  if (!isAccessible) {
    throw new ApiError(403, 'Not authorized to access course assignments');
  }
  
  // Fetch assignments based on user role
  let query = supabase
    .from('assignments')
    .select(`
      *,
      submissions:assignment_submissions(
        id, 
        status, 
        grade, 
        submitted_at
      )
    `)
    .eq('course_id', courseId);
  
  // If not instructor or admin, only show submissions for the current user
  if (course.instructor_id !== userId && userRole !== UserRole.ADMIN) {
    query = query.eq('submissions.user_id', userId);
  }
  
  const { data: assignments, error } = await query;
  
  if (error) {
    logger.error(`Error fetching course assignments: ${error.message}`);
    throw new ApiError(500, 'Failed to fetch course assignments');
  }
  
  res.status(200).json({
    success: true,
    count: assignments.length,
    data: assignments
  });
});

// @desc    Get course reviews
// @route   GET /api/courses/:id/reviews
// @access  Public
export const getCourseReviews = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const supabase = getSupabase();
  
  // First, check if course exists and is published
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('is_published')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Fetch reviews with user details
  const { data: reviews, error } = await supabase
    .from('course_reviews')
    .select(`
      *,
      user:profiles(id, first_name, last_name, profile_image_url)
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  
  if (error) {
    logger.error(`Error fetching course reviews: ${error.message}`);
    throw new ApiError(500, 'Failed to fetch course reviews');
  }
  
  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Get course study materials
// @route   GET /api/courses/:id/materials
// @access  Private (Enrolled students and instructor)
export const getCourseStudyMaterials = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // First, check course and user access
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('instructor_id, is_published')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check user access
  const userRole = req.user?.role;
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .single();
  
  const isAccessible = course.instructor_id === userId || 
    userRole === UserRole.ADMIN ||
    (course.is_published && !!enrollment);
  
  if (!isAccessible) {
    throw new ApiError(403, 'Not authorized to access course materials');
  }
  
  // Fetch study materials
  const { data: materials, error } = await supabase
    .from('course_materials')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  
  if (error) {
    logger.error(`Error fetching course materials: ${error.message}`);
    throw new ApiError(500, 'Failed to fetch course materials');
  }
  
  res.status(200).json({
    success: true,
    count: materials.length,
    data: materials
  });
});

// @desc    Add study material to course
// @route   POST /api/courses/:id/materials
// @access  Private (Instructor only)
export const addStudyMaterial = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Check course ownership
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check instructor ownership
  if (course.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to add materials to this course');
  }
  
  // Prepare material data
  const materialData = {
    ...req.body,
    course_id: courseId,
    created_at: new Date().toISOString(),
    created_by: userId
  };
  
  // Validate required fields
  if (!materialData.title || !materialData.file_url) {
    throw new ApiError(400, 'Title and file URL are required');
  }
  
  // Insert material
  const { data, error } = await supabase
    .from('course_materials')
    .insert(materialData)
    .select()
    .single();
  
  if (error) {
    logger.error(`Error adding study material: ${error.message}`);
    throw new ApiError(500, 'Failed to add study material');
  }
  
  res.status(201).json({
    success: true,
    data
  });
});

// @desc    Remove study material from course
// @route   DELETE /api/courses/:courseId/materials/:materialId
// @access  Private (Instructor only)
export const removeStudyMaterial = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.courseId;
  const materialId = req.params.materialId;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Check material existence and course ownership
  const { data: material, error: materialError } = await supabase
    .from('course_materials')
    .select('course_id')
    .eq('id', materialId)
    .eq('course_id', courseId)
    .single();
  
  if (materialError) {
    if (materialError.code === 'PGRST116') {
      throw new ApiError(404, 'Study material not found');
    }
    
    logger.error(`Error fetching material: ${materialError.message}`);
    throw new ApiError(500, 'Failed to fetch study material');
  }
  
  // Verify course ownership
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check instructor ownership
  if (course.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to remove materials from this course');
  }
  
  // Delete material
  const { error } = await supabase
    .from('course_materials')
    .delete()
    .eq('id', materialId);
  
  if (error) {
    logger.error(`Error removing study material: ${error.message}`);
    throw new ApiError(500, 'Failed to remove study material');
  }
  
  res.status(200).json({
    success: true,
    message: 'Study material removed successfully'
  });
});