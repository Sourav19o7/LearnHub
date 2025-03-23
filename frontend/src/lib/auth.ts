import supabase from './supabase';
import { Session, User } from '@supabase/supabase-js';
import { UserRole } from '../types';

// Helper function to add timeout to promises with proper types
const withTimeout = <T>(
  asyncOperation: Promise<T> | { then(onfulfilled: (value: T) => any): any },
  timeoutMs: number = 10000,
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
      10000,
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
      10000,
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
      10000,
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
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      }),
      10000,
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

// Handle redirect from OAuth providers (for Google sign-in)
export const handleAuthRedirect = async (): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const { data, error } = await withTimeout(
      supabase.auth.getSession(),
      10000,
      'Auth redirect session fetch timed out'
    );
    
    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }
    
    if (data?.session) {
      return {
        success: true,
        message: 'Successfully signed in!',
        data: data.session,
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
      10000,
      'Sign in request timed out'
    );

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
    const { error } = await withTimeout(
      supabase.auth.signOut(),
      10000,
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
      10000,
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
      10000,
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
// This is a focused update to the getUserProfile function
export const getUserProfile = async () => {
  try {
    const user = await getCurrentUser();
    console.log('Current User:', user);
    if (!user) {
      console.error('No authenticated user found');
      return null;
    } else {
      console.log('User found:', user.id);
    }

    // First, check if the profiles table exists by trying to fetch any single profile
    const tableCheckPromise = supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    const tableCheckResponse = await tableCheckPromise;
    console.log('Table check response:', tableCheckResponse);
    
    if (tableCheckResponse.error && tableCheckResponse.error.code === '42P01') {
      console.error('Profiles table does not exist:', tableCheckResponse.error.message);
      // Handle case where table doesn't exist - you might want to create it
      return null;
    }

    // Now try to fetch the user's profile
    const profilePromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    const profileResponse = await profilePromise;
    console.log('Profile fetch response:', profileResponse);
    
    const existingProfile = profileResponse.data;
    const fetchError = profileResponse.error;

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected for new users
      console.error('Error fetching profile:', fetchError);
      return null;
    }

    // If profile exists, return it
    if (existingProfile) {
      console.log('Existing profile found:', existingProfile);
      return existingProfile;
    }

    console.log('No existing profile found, creating a new one');

    // If no profile, create one
    try {
      // Extract first and last name from user metadata or email
      const first_name = user.user_metadata?.first_name || 
        user.user_metadata?.name?.split(' ')[0] ||  // For Google auth, name is typically provided
        (user.email?.split('@')[0] || 'User');
        
      const last_name = user.user_metadata?.last_name || 
        (user.user_metadata?.name?.split(' ').slice(1).join(' ') || '');  // For Google auth, getting last name

      const newProfile = {
        id: user.id,
        email: user.email || '',
        first_name,
        last_name,
        role: UserRole.STUDENT, // Default role
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null, // Google provides 'picture'
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Attempting to create profile with:', newProfile);

      const createPromise = supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();
        
      const createResponse = await createPromise;
      console.log('Profile creation response:', createResponse);
      
      const createdProfile = createResponse.data;
      const createError = createResponse.error;

      if (createError) {
        console.error('Error creating profile:', createError);
        
        // If the error is about missing columns, log column info
        if (createError.code === '42703') { // Column does not exist
          console.log('There might be a schema mismatch. Checking table columns...');
          
          const columnsPromise = supabase
            .from('profiles')
            .select('*')
            .limit(1);
            
          const columnsResponse = await columnsPromise;
          if (columnsResponse.data && columnsResponse.data.length > 0) {
            console.log('Available columns:', Object.keys(columnsResponse.data[0]));
          } else {
            console.log('Could not determine available columns.');
          }
        }
        
        return null;
      }

      console.log('Profile created successfully:', createdProfile);
      return createdProfile;
    } catch (error: any) {
      console.error('Unexpected error creating profile:', error);
      return null;
    }
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

    const updatePromise = supabase
      .from('profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();
      
    const updateResponse = await withTimeout(updatePromise, 10000, 'Profile update timed out');
    const data = updateResponse.data;
    const error = updateResponse.error;

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
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An error occurred during profile update',
    };
  }
};