import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { UserRole } from '../types';
import { ApiError } from './errorHandler';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    
    if (!token) {
      logger.warn('No token provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }
    
    // Verify token with Supabase
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      logger.error(`Token verification failed: ${error?.message}`);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token validation failed'
      });
    }
    
    // Get user profile with role information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, first_name, last_name')
      .eq('id', data.user.id)
      .single();
      
    if (profileError) {
      logger.error(`Error fetching user profile: ${profileError.message}`);
      // Still proceed if only the profile lookup fails, using just the auth data
      req.user = {
        id: data.user.id,
        email: data.user.email,
        role: 'student' // Default role
      };
    } else {
      // Add user to request object with full profile info
      req.user = {
        id: data.user.id,
        email: data.user.email,
        role: profile.role,
        first_name: profile.first_name,
        last_name: profile.last_name
      };
    }
    
    logger.info(`User authenticated: ${req.user.id}`);
    next();
  } catch (error: any) {
    logger.error(`Auth middleware error: ${error.message}`);
    res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
};

// Middleware to check if user is admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === UserRole.ADMIN) {
    next();
  } else {
    logger.warn(`Admin access denied for user: ${req.user?.id}`);
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
};

// Middleware to check if user is instructor
export const isInstructor = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === UserRole.INSTRUCTOR || req.user.role === UserRole.ADMIN)) {
    next();
  } else {
    logger.warn(`Instructor access denied for user: ${req.user?.id}`);
    return res.status(403).json({
      success: false,
      message: 'Instructor access required'
    });
  }
};

// Add types to extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
        first_name?: string;
        last_name?: string;
      };
    }
  }
}