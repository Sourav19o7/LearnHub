import { Request, Response, NextFunction } from 'express';
import { ApiError, asyncHandler } from './errorHandler';
import { getSupabase } from '../config/supabase';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      supabaseClient?: any;
    }
  }
}

// Protect routes - verify JWT and attach user to request
export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Get token from authorization header
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError(401, 'Not authorized, no token'));
  }

  try {
    const supabase = getSupabase();
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      logger.error(`Auth error: ${error.message}`);
      return next(new ApiError(401, 'Not authorized, token failed'));
    }

    if (!user) {
      return next(new ApiError(401, 'User not found'));
    }

    // Add user to request
    req.user = user;
    
    // Add supabase client with user context to request
    req.supabaseClient = supabase;

    next();
  } catch (error: any) {
    logger.error(`Auth middleware error: ${error.message}`);
    return next(new ApiError(401, 'Not authorized, token failed'));
  }
});

// Check if user has admin role
export const isAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new ApiError(401, 'Not authorized, no user'));
  }

  // Fetch user profile with role information
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .single();

  if (error || !data) {
    logger.error(`Admin check error: ${error?.message || 'No profile found'}`);
    return next(new ApiError(500, 'Error checking user role'));
  }

  if (data.role !== 'admin') {
    return next(new ApiError(403, 'Not authorized as admin'));
  }

  next();
});

// Check if user is instructor of the course
export const isInstructor = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new ApiError(401, 'Not authorized, no user'));
  }

  const courseId = req.params.id || req.body.courseId;

  if (!courseId) {
    return next(new ApiError(400, 'Course ID is required'));
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();

  if (error || !data) {
    logger.error(`Instructor check error: ${error?.message || 'No course found'}`);
    return next(new ApiError(500, 'Error checking course instructor'));
  }

  if (data.instructor_id !== req.user.id) {
    return next(new ApiError(403, 'Not authorized as course instructor'));
  }

  next();
});