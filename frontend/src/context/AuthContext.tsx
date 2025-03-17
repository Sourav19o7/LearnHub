import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabase from '../lib/supabase';
import { UserProfile, UserRole } from '../types';
import { getUserProfile } from '../lib/auth';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isStudent: boolean;
  isInstructor: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  debugSession: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  isStudent: false,
  isInstructor: false,
  isAdmin: false,
  refreshProfile: async () => null,
  logout: async () => {},
  debugSession: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Comprehensive session debugging function
  const debugSession = () => {
    console.group('🔐 Supabase Session Debug');
    
    // Session details
    console.log('Full Session Object:', session);
    
    if (session) {
      console.group('Session Details');
      console.log('Access Token:', session.access_token);
      console.log('Refresh Token:', session.refresh_token);
      console.log('Expires At:', session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A');
      console.log('Token Type:', session.token_type);
      console.groupEnd();
    }
    
    // User details
    console.group('User Details');
    console.log('User Object:', user);
    if (user) {
      console.log('User ID:', user.id);
      console.log('User Email:', user.email);
      console.log('User Metadata:', user.user_metadata);
      console.log('App Metadata:', user.app_metadata);
    }
    console.groupEnd();
    
    // Profile details
    console.group('Profile Details');
    console.log('User Profile:', profile);
    if (profile) {
      console.log('Role:', profile.role);
      console.log('Name:', `${profile.first_name} ${profile.last_name}`);
    }
    console.groupEnd();
    
    console.groupEnd();
  };

  const refreshProfile = async (): Promise<UserProfile | null> => {
    console.log('Refreshing profile');
    if (!user) return null;

    try {
      const profileData = await getUserProfile();
      console.log('Profile data:', profileData);
      if (profileData) {
        setProfile(profileData as UserProfile);
        return profileData as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing profile:', error);
      return null;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      await supabase.auth.signOut();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        console.log('Initial Session Check:', currentSession);
        
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          try {
            const profileData = await getUserProfile();
            if (profileData) {
              setProfile(profileData as UserProfile);
            }
          } catch (profileError) {
            console.error('Error fetching profile:', profileError);
          }
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth State Change Event:', event);
        console.log('New Session:', newSession);
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          try {
            console.log('New Session Profile:', newSession?.user);
            const profileData = await getUserProfile();
            if (profileData) {
              setProfile(profileData as UserProfile);
            }
          } catch (profileError) {
            console.error('Error fetching profile on auth state change:', profileError);
          }
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

// Change this section at the end of your AuthContext.tsx
const isAuthenticated = !!user && !!session;

// Add more flexible role checking
const userRole = profile?.role || '';
const isAdmin = userRole.toLowerCase() === UserRole.ADMIN.toLowerCase();
const isInstructor = userRole.toLowerCase() === UserRole.INSTRUCTOR.toLowerCase();
// If authenticated and not admin or instructor, default to student
const isStudent = isAuthenticated && !isAdmin && !isInstructor;

  const value = {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated,
    isStudent,
    isInstructor,
    isAdmin,
    refreshProfile,
    logout,
    debugSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};