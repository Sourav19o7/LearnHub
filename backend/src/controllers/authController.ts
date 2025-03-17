import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../middleware/errorHandler';
import { getSupabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { UserRole } from '../types';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, first_name, last_name } = req.body;
  
  if (!email || !password || !first_name || !last_name) {
    throw new ApiError(400, 'Please provide all required fields');
  }
  
  const supabase = getSupabase();
  
  // Register the user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name,
        last_name
      }
    }
  });
  
  if (authError) {
    logger.error(`Registration error: ${authError.message}`);
    throw new ApiError(400, authError.message);
  }
  
  if (!authData.user) {
    throw new ApiError(500, 'Failed to create user');
  }
  
  // Create user profile in the database
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email,
      first_name,
      last_name,
      role: UserRole.STUDENT // Default role is student
    });
  
  if (profileError) {
    logger.error(`Profile creation error: ${profileError.message}`);
    
    // Attempt to clean up the auth user if profile creation fails
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
    if (deleteError) {
      logger.error(`Failed to clean up auth user: ${deleteError.message}`);
    }
    
    throw new ApiError(500, 'Failed to create user profile');
  }
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email for verification.'
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    throw new ApiError(400, 'Please provide email and password');
  }
  
  const supabase = getSupabase();
  
  // Sign in with email and password
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    logger.error(`Login error: ${error.message}`);
    throw new ApiError(401, 'Invalid credentials');
  }
  
  // Get user profile data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
  
  if (profileError) {
    logger.error(`Profile fetch error: ${profileError.message}`);
    throw new ApiError(500, 'Failed to fetch user profile');
  }
  
  res.status(200).json({
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
      avatar_url: profile.avatar_url
    },
    token: data.session.access_token,
    refreshToken: data.session.refresh_token
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  
  if (!email) {
    throw new ApiError(400, 'Please provide an email address');
  }
  
  const supabase = getSupabase();
  
  // Send password reset email
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`
  });
  
  if (error) {
    logger.error(`Password reset error: ${error.message}`);
    throw new ApiError(500, 'Failed to send password reset email');
  }
  
  res.status(200).json({
    success: true,
    message: 'Password reset email sent'
  });
});

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body;
  
  if (!password) {
    throw new ApiError(400, 'Please provide a new password');
  }
  
  const supabase = getSupabase();
  
  // Update password
  const { error } = await supabase.auth.updateUser({
    password
  });
  
  if (error) {
    logger.error(`Password update error: ${error.message}`);
    throw new ApiError(400, 'Failed to update password');
  }
  
  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

// @desc    Update password (when logged in)
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  const { current_password, new_password } = req.body;
  
  if (!current_password || !new_password) {
    throw new ApiError(400, 'Please provide current and new password');
  }
  
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // First verify current password by trying to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: req.user && req.user.email ? req.user.email : '',
    password: current_password
  });
  
  if (signInError) {
    throw new ApiError(401, 'Current password is incorrect');
  }
  
  // Update to new password
  const { error } = await supabase.auth.updateUser({
    password: new_password
  });
  
  if (error) {
    logger.error(`Password update error: ${error.message}`);
    throw new ApiError(400, 'Failed to update password');
  }
  
  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Get user profile
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    logger.error(`Profile fetch error: ${error.message}`);
    throw new ApiError(500, 'Failed to fetch profile');
  }
  
  res.status(200).json({
    success: true,
    data
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Prevent updating critical fields
  const { id, email, role, created_at, ...updateData } = req.body;
  
  // Update profile
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    logger.error(`Profile update error: ${error.message}`);
    throw new ApiError(500, 'Failed to update profile');
  }
  
  res.status(200).json({
    success: true,
    data
  });
});

// @desc    Validate user session
// @route   GET /api/auth/validate
// @access  Private
export const validateSession = asyncHandler(async (req: Request, res: Response) => {
  // If middleware passed, session is valid
  res.status(200).json({
    success: true,
    user: req.user
  });
});