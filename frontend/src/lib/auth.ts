import supabase from './supabase';
import { Session, User } from '@supabase/supabase-js';
import { UserRole } from '../types';

const API_TIMEOUT_MS = 1000; // Increased from 1000 to 5000 for better reliability

// Helper function to add timeout to promises with proper types
const withTimeout = <T>(
  asyncOperation: Promise<T> | { then(onfulfilled: (value: T) => any): any },
  timeoutMs: number = API_TIMEOUT_MS,
  errorMessage: string = 'Request timed out'
): Promise<T> => {
  // Convert Supabase query builder to a proper promise
  const promise = Promise.resolve().then(() => asyncOperation);
  
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(errorMessage));
      }, timeoutMs);
    })
  ]);
};

// Get current session
export const getSession = async (): Promise<Session | null> => {
  try {
    const { data: { session }, error } = await withTimeout(
      supabase.auth.getSession(),
      API_TIMEOUT_MS,
      'Session fetch timed out'
    );
    
    if (error) {
      console.error('Error getting session:', error.message);
      return null;
    }
    return session;
  } catch (error: any) {
    console.error('Session error:', error.message);
    return null;
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user }, error } = await withTimeout(
      supabase.auth.getUser(),
      API_TIMEOUT_MS,
      'User fetch timed out'
    );
    
    if (error) {
      console.error('Error getting user:', error.message);
      return null;
    }
    return user;
  } catch (error: any) {
    console.error('Get user error:', error.message);
    return null;
  }
};

// Sign up user
export const signUp = async (
  email: string,
  password: string,
  first_name: string,
  last_name: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            last_name,
          },
        },
      }),
      API_TIMEOUT_MS,
      'Signup request timed out'
    );

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

// Sign in with Google
export const signInWithGoogle = async (): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`, // Changed to use a dedicated callback route
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      }),
      API_TIMEOUT_MS,
      'Google sign-in request timed out'
    );

    if (error) {
      console.error('Google sign-in error:', error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: 'Redirecting to Google...',
      data,
    };
  } catch (error: any) {
    console.error('Unexpected error during Google sign-in:', error);
    return {
      success: false,
      message: error.message || 'An error occurred during Google sign-in',
    };
  }
};

// Handle OAuth callback
export const handleOAuthCallback = async (): Promise<{ success: boolean; message: string; user?: any; session?: Session }> => {
  try {
    // Get session after OAuth redirect
    const { data, error } = await withTimeout(
      supabase.auth.getSession(),
      API_TIMEOUT_MS,
      'Session fetch timed out after OAuth'
    );
    
    if (error) {
      console.error('OAuth callback error:', error);
      return {
        success: false,
        message: `OAuth error: ${error.message}`,
      };
    }
    
    if (!data?.session) {
      console.error('No session found in OAuth callback');
      return {
        success: false,
        message: 'Authentication failed - no session found',
      };
    }

    const session = data.session;
    const user = session.user;
    
    // Ensure profile exists for this user
    const profile = await ensureUserProfile(user);
    
    if (!profile) {
      console.error('Failed to create or retrieve profile for OAuth user');
      return {
        success: false,
        message: 'Failed to initialize user profile',
      };
    }
    
    return {
      success: true,
      message: 'Authentication successful',
      user: {
        ...user,
        profile
      },
      session
    };
  } catch (error: any) {
    console.error('Unexpected error in OAuth callback:', error);
    return {
      success: false,
      message: error.message || 'An error occurred during authentication',
    };
  }
};

// Ensure a user profile exists (create if missing)
export const ensureUserProfile = async (user: User) => {
  if (!user) {
    console.error('No user provided to ensureUserProfile');
    return null;
  }
  
  try {
    // First check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking profile existence:', checkError);
      return null;
    }
    
    // If profile exists, return it
    if (existingProfile) {
      return existingProfile;
    }
    
    // Create new profile
    const newProfile = {
      id: user.id,
      email: user.email || '',
      first_name: user.user_metadata?.first_name || 
        user.user_metadata?.name?.split(' ')[0] ||  
        (user.email?.split('@')[0] || 'User'),
      last_name: user.user_metadata?.last_name || 
        (user.user_metadata?.name?.split(' ').slice(1).join(' ') || ''),
      role: UserRole.STUDENT,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: createdProfile, error: createError } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating profile in ensureUserProfile:', createError);
      return null;
    }
    
    return createdProfile;
  } catch (error) {
    console.error('Unexpected error in ensureUserProfile:', error);
    return null;
  }
};

// Handle redirect from OAuth providers (for Google sign-in)
export const handleAuthRedirect = async (): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const { data, error } = await withTimeout(
      supabase.auth.getSession(),
      API_TIMEOUT_MS,
      'Auth redirect session fetch timed out'
    );
    
    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }
    
    if (data?.session) {
      // Ensure profile exists for this user
      const profile = await ensureUserProfile(data.session.user);
      
      return {
        success: true,
        message: 'Successfully signed in!',
        data: {
          ...data.session,
          profile
        },
      };
    }
    
    return {
      success: false,
      message: 'No session found after redirect',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An error occurred processing the authentication',
    };
  }
};

// Sign in user
export const signIn = async (
  email: string,
  password: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({
        email,
        password,
      }),
      API_TIMEOUT_MS,
      'Sign in request timed out'
    );

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    // Ensure profile exists
    const profile = await ensureUserProfile(data.user);

    return {
      success: true,
      message: 'Login successful!',
      data: {
        ...data,
        profile
      },
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
    const { error } = await withTimeout(
      supabase.auth.signOut(),
      API_TIMEOUT_MS,
      'Sign out request timed out'
    );

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
    const { error } = await withTimeout(
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      }),
      API_TIMEOUT_MS,
      'Password reset request timed out'
    );

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
    const { error } = await withTimeout(
      supabase.auth.updateUser({
        password: newPassword,
      }),
      API_TIMEOUT_MS,
      'Password update request timed out'
    );

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
  try {
    const user = await getCurrentUser();
    console.log('Current User:', user);
    if (!user) {
      console.error('No authenticated user found');
      return null;
    }
    
    // Use the ensureUserProfile helper function
    return await ensureUserProfile(user);
  } catch (error: any) {
    console.error('Error in getUserProfile:', error.message);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (profile: any) => {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Not authenticated' };

    // First ensure the profile exists
    const existingProfile = await ensureUserProfile(user);
    if (!existingProfile) {
      return {
        success: false,
        message: 'Failed to retrieve or create user profile',
      };
    }

    const updatePromise = supabase
      .from('profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();
      
    const updateResponse = await withTimeout(updatePromise, API_TIMEOUT_MS, 'Profile update timed out');
    const data = updateResponse.data;
    const error = updateResponse.error;

    if (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        message: `Error updating profile: ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'Profile updated successfully!',
      data,
    };
  } catch (error: any) {
    console.error('Unexpected error in updateUserProfile:', error);
    return {
      success: false,
      message: error.message || 'An error occurred during profile update',
    };
  }
};