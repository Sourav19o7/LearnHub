import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../middleware/errorHandler';
import { getSupabase, getServiceSupabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { UserRole } from '../types';

// @desc    Get all users (with pagination and filtering)
// @route   GET /api/users
// @access  Private (Admin only)
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const role = req.query.role as string;
  
  const supabase = getSupabase();
  
  // Start building the query
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' });
  
  // Apply filters
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  
  if (role && Object.values(UserRole).includes(role as UserRole)) {
    query = query.eq('role', role);
  }
  
  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  // Execute query with pagination
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);
  
  if (error) {
    logger.error(`Error fetching users: ${error.message}`);
    throw new ApiError(500, `Failed to fetch users: ${error.message}`);
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

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin only)
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiError(404, 'User not found');
    }
    
    logger.error(`Error fetching user: ${error.message}`);
    throw new ApiError(500, `Failed to fetch user: ${error.message}`);
  }
  
  res.status(200).json({
    success: true,
    data
  });
});

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private (Admin only)
export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  
  // Validate role
  if (!role || !Object.values(UserRole).includes(role as UserRole)) {
    throw new ApiError(400, 'Invalid role. Must be one of: student, instructor, admin');
  }
  
  const supabase = getSupabase();
  
  // Check if user exists
  const { data: user, error: fetchError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', id)
    .single();
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new ApiError(404, 'User not found');
    }
    
    logger.error(`Error fetching user: ${fetchError.message}`);
    throw new ApiError(500, `Failed to fetch user: ${fetchError.message}`);
  }
  
  // Update user role
  const { data, error } = await supabase
    .from('profiles')
    .update({
      role,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    logger.error(`Error updating user role: ${error.message}`);
    throw new ApiError(500, `Failed to update user role: ${error.message}`);
  }
  
  res.status(200).json({
    success: true,
    message: `User role updated to ${role}`,
    data
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = req.user?.id;
  
  // Prevent self-deletion
  if (id === adminId) {
    throw new ApiError(400, 'You cannot delete your own account');
  }
  
  const serviceSupabase = getServiceSupabase();
  
  // Check if user exists
  const { data: user, error: fetchError } = await serviceSupabase
    .from('profiles')
    .select('id')
    .eq('id', id)
    .single();
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new ApiError(404, 'User not found');
    }
    
    logger.error(`Error fetching user: ${fetchError.message}`);
    throw new ApiError(500, `Failed to fetch user: ${fetchError.message}`);
  }
  
  // Delete user from Auth (will cascade to profiles via trigger)
  const { error } = await serviceSupabase.auth.admin.deleteUser(id);
  
  if (error) {
    logger.error(`Error deleting user: ${error.message}`);
    throw new ApiError(500, `Failed to delete user: ${error.message}`);
  }
  
  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Get user's assignments (submissions)
// @route   GET /api/users/:id/assignments or /api/users/me/assignments
// @access  Private (Self or Admin)
export const getUserAssignments = asyncHandler(async (req: Request, res: Response) => {
  // Check if we're on a /me route or if the ID is "me"
  const isMeRoute = req.originalUrl.includes('/me/');
  const isIdMe = req.params.id === 'me';
  
  // Get the actual user ID we want to work with
  let targetId: string;
  
  if (isMeRoute || isIdMe) {
    // Use the authenticated user
    if (!req.user?.id) {
      throw new ApiError(401, 'User not authenticated');
    }
    targetId = req.user.id;
  } else {
    // Use the ID from the URL params
    targetId = req.params.id;
    
    // Check authorization - only allow access to own data or admin access
    const userId = req.user?.id;
    
    if (targetId !== userId && req.user?.role !== UserRole.ADMIN) {
      throw new ApiError(403, 'Not authorized to access this data');
    }
  }
  
  const supabase = getSupabase();
  
  // Get user's assignment submissions with assignment and course details
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select(`
      *,
      assignment:assignments(
        id,
        title,
        description,
        due_date,
        points,
        course:courses(id, title)
      )
    `)
    .eq('user_id', targetId)
    .order('submitted_at', { ascending: false });
  
  if (error) {
    logger.error(`Error fetching user assignments: ${error.message}`);
    throw new ApiError(500, `Failed to fetch user assignments: ${error.message}`);
  }
  
  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});


// @desc    Get user's courses (created if instructor, enrolled if student)
// @route   GET /api/users/:id/courses or /api/users/me/courses
// @access  Private (Self or Admin)
export const getUserCourses = asyncHandler(async (req: Request, res: Response) => {
  // Check if we're on a /me route or if the ID is "me"
  const isMeRoute = req.originalUrl.includes('/me/');
  const isIdMe = req.params.id === 'me';
  
  // Get the actual user ID we want to work with
  let targetId: string;
  
  if (isMeRoute || isIdMe) {
    // Use the authenticated user
    if (!req.user?.id) {
      throw new ApiError(401, 'User not authenticated');
    }
    targetId = req.user.id;
  } else {
    // Use the ID from the URL params
    targetId = req.params.id;
    
    // Check authorization - only allow access to own data or admin access
    const userId = req.user?.id;
    
    if (targetId !== userId && req.user?.role !== UserRole.ADMIN) {
      throw new ApiError(403, 'Not authorized to access this data');
    }
  }
  
  const supabase = getSupabase();
  
  // Get user profile to determine role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', targetId)
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
      .eq('instructor_id', targetId)
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
      .eq('user_id', targetId)
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

// @desc    Get user's enrollments
// @route   GET /api/users/:id/enrollments or /api/users/me/enrollments
// @access  Private (Self or Admin)
export const getUserEnrollments = asyncHandler(async (req: Request, res: Response) => {
  // Check if we're on a /me route or if the ID is "me"
  const isMeRoute = req.originalUrl.includes('/me/');
  const isIdMe = req.params.id === 'me';
  
  // Get the actual user ID we want to work with
  let targetId: string;
  
  if (isMeRoute || isIdMe) {
    // Use the authenticated user
    if (!req.user?.id) {
      throw new ApiError(401, 'User not authenticated');
    }
    targetId = req.user.id;
  } else {
    // Use the ID from the URL params
    targetId = req.params.id;
    
    // Check authorization - only allow access to own data or admin access
    const userId = req.user?.id;
    
    if (targetId !== userId && req.user?.role !== UserRole.ADMIN) {
      throw new ApiError(403, 'Not authorized to access this data');
    }
  }
  
  const supabase = getSupabase();
  
  // Get user's enrollments with course details
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(
        id,
        title,
        description,
        cover_image_url,
        instructor_id,
        instructor:profiles(id, first_name, last_name)
      )
    `)
    .eq('user_id', targetId)
    .order('enrolled_at', { ascending: false });
  
  if (error) {
    logger.error(`Error fetching user enrollments: ${error.message}`);
    throw new ApiError(500, `Failed to fetch user enrollments: ${error.message}`);
  }
  
  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

// @desc    Get user's stats (enrollments, completions, assignments, etc.)
// @route   GET /api/users/:id/stats or /api/users/me/stats
// @access  Private (Self or Admin)
export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  // Check if we're on a /me route or if the ID is "me"
  const isMeRoute = req.originalUrl.includes('/me/');
  const isIdMe = req.params.id === 'me';
  
  // Get the actual user ID we want to work with
  let targetId: string;
  
  if (isMeRoute || isIdMe) {
    // Use the authenticated user
    if (!req.user?.id) {
      throw new ApiError(401, 'User not authenticated');
    }
    targetId = req.user.id;
  } else {
    // Use the ID from the URL params
    targetId = req.params.id;
    
    // Check authorization - only allow access to own data or admin access
    const userId = req.user?.id;
    
    if (targetId !== userId && req.user?.role !== UserRole.ADMIN) {
      throw new ApiError(403, 'Not authorized to access this data');
    }
  }
  
  const supabase = getSupabase();

  console.log(targetId)
  
  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', targetId)
    .single();
  
  if (profileError) {
    if (profileError.code === 'PGRST116') {
      throw new ApiError(404, 'User not found');
    }
    
    logger.error(`Error fetching user profile: ${profileError.message}`);
    throw new ApiError(500, `Failed to fetch user profile: ${profileError.message}`);
  }
  
  // Initialize stats object
  const stats: Record<string, any> = {
    role: profile.role
  };
  
  // Get student stats
  if (profile.role === UserRole.STUDENT || profile.role === UserRole.ADMIN) {
    // Get enrollment counts
    const { data: enrollmentsData, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('id, completed_at', { count: 'exact' })
      .eq('user_id', targetId);
    
    if (enrollmentsError) {
      logger.error(`Error fetching enrollment stats: ${enrollmentsError.message}`);
    } else {
      stats.total_enrollments = enrollmentsData.length;
      stats.completed_courses = enrollmentsData.filter(e => e.completed_at).length;
    }
    
    // Get assignment stats
    const { data: submissionsData, error: submissionsError } = await supabase
      .from('assignment_submissions')
      .select('id, status, grade', { count: 'exact' })
      .eq('user_id', targetId);
    
    if (submissionsError) {
      logger.error(`Error fetching submission stats: ${submissionsError.message}`);
    } else {
      stats.total_submissions = submissionsData.length;
      stats.graded_submissions = submissionsData.filter(s => s.status === 'graded').length;
      
      // Calculate average grade if there are graded submissions
      const gradedSubmissions = submissionsData.filter(s => s.grade !== null);
      if (gradedSubmissions.length > 0) {
        const totalGrade = gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
        stats.average_grade = totalGrade / gradedSubmissions.length;
      }
    }
  }
  
  // Get instructor stats
  if (profile.role === UserRole.INSTRUCTOR || profile.role === UserRole.ADMIN) {
    // Get course counts
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('id, is_published', { count: 'exact' })
      .eq('instructor_id', targetId);
    
    if (coursesError) {
      logger.error(`Error fetching course stats: ${coursesError.message}`);
    } else {
      stats.total_courses = coursesData.length;
      stats.published_courses = coursesData.filter(c => c.is_published).length;
    }
    
    // Get student counts
    const { data: studentsData, error: studentsError } = await supabase
      .from('enrollments')
      .select('user_id')
      .in('course_id', coursesData?.map(c => c.id) || []);
    
    if (studentsError) {
      logger.error(`Error fetching student stats: ${studentsError.message}`);
    } else {
      // Count unique students
      const uniqueStudents = new Set(studentsData.map(s => s.user_id));
      stats.total_students = uniqueStudents.size;
    }
    
    // Get assignment counts
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id', { count: 'exact' })
      .in('course_id', coursesData?.map(c => c.id) || []);
    
    if (assignmentsError) {
      logger.error(`Error fetching assignment stats: ${assignmentsError.message}`);
    } else {
      stats.total_assignments = assignmentsData.length;
    }
  }
  
  res.status(200).json({
    success: true,
    data: stats
  });
});