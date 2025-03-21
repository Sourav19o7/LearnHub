import supabase from './supabase';
import { Session, User } from '@supabase/supabase-js';
import { UserRole } from '../types';

// Get current session
export const getSession = async (): Promise<Session | null> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error.message);
    return null;
  }
  return session;
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error.message);
    return null;
  }
  return user;
};

// Sign up user
export const signUp = async (
  email: string,
  password: string,
  first_name: string,
  last_name: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
        },
      },
    });

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: 'Signup successful! Please check your email for confirmation.',
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An error occurred during signup',
    };
  }
};

// Sign in user
export const signIn = async (
  email: string,
  password: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: 'Login successful!',
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An error occurred during login',
    };
  }
};

// Sign out user
export const signOut = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: 'Logout successful!',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An error occurred during logout',
    };
  }
};

// Reset password
export const resetPassword = async (
  email: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: 'Password reset email sent. Please check your inbox.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An error occurred',
    };
  }
};

// Update password
export const updatePassword = async (
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: 'Password updated successfully!',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An error occurred',
    };
  }
};

// Get user profile with automatic profile creation
export const getUserProfile = async () => {
  const user = await getCurrentUser();
  console.log('Current User:', user);
  if (!user) {
    console.error('No authenticated user found');
    return null;
  } else {
    console.log('User found:', user);
  }

  // First, try to fetch existing profile
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If profile exists, return it
  if (existingProfile) {
    return existingProfile;
  }

  // If no profile, create one
  try {
    // Extract first and last name from user metadata or email
    const first_name = user.user_metadata?.first_name || 
      (user.email?.split('@')[0] || 'User');
    const last_name = user.user_metadata?.last_name || '';

    const newProfile = {
      id: user.id,
      email: user.email || '',
      first_name,
      last_name,
      role: UserRole.STUDENT, // Default role
      avatar_url: user.user_metadata?.avatar_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: createdProfile, error: createError } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (createError) {
      console.error('Error creating profile:', createError);
      return null;
    }

    return createdProfile;
  } catch (error) {
    console.error('Unexpected error creating profile:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (profile: any) => {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: 'Not authenticated' };

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...profile,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    message: 'Profile updated successfully!',
    data,
  };
};