import supabase from './supabase';
import { Session, User } from '@supabase/supabase-js';

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

// Get user profile
export const getUserProfile = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error.message);
    return null;
  }

  return data;
};

// Update user profile
export const updateUserProfile = async (profile: any) => {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: 'Not authenticated' };

  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
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