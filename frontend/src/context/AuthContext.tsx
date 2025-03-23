import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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
  logout: () => Promise<void>;
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
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use refs to keep track of in-progress operations to prevent duplicates
  const profileFetchInProgress = useRef(false);
  const initialAuthCheckComplete = useRef(false);

  // Memoize the logout function to prevent unnecessary re-creation
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  // Function to fetch profile data - memoized to avoid re-creation on each render
  const fetchUserProfile = useCallback(async () => {
    // If a profile fetch is already in progress, don't start another one
    if (profileFetchInProgress.current) return;
    
    try {
      profileFetchInProgress.current = true;
      const profileData = await getUserProfile();
      console.log('Profile data fetched:', profileData);
      
      if (profileData) {
        setProfile(profileData as UserProfile);
      }
      
      return profileData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    } finally {
      profileFetchInProgress.current = false;
    }
  }, []);

  // Handle auth state changes
  const handleAuthChange = useCallback(async (newSession: Session | null) => {
    console.log('Handling auth change for session:', newSession?.user?.email);
    
    setSession(newSession);
    
    if (newSession?.user) {
      setUser(newSession.user);
      await fetchUserProfile();
    } else {
      setUser(null);
      setProfile(null);
    }
    
    // Only set loading to false when handling auth changes, not on initial load
    if (initialAuthCheckComplete.current) {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    let mounted = true;
    
    // Initial session check
    const checkSession = async () => {
      try {
        console.log('Performing initial session check');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        // Only handle the session if mounted to prevent state updates on unmounted components
        if (currentSession) {
          console.log('Initial session found:', currentSession.user?.email);
          await handleAuthChange(currentSession);
        } else {
          console.log('No initial session found');
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        if (mounted) {
          initialAuthCheckComplete.current = true;
          setIsLoading(false);
        }
      }
    };
  
    // Run initial session check
    checkSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // Skip duplicate INITIAL_SESSION events if we've already completed the initial check
        if (event === 'INITIAL_SESSION' && initialAuthCheckComplete.current) {
          console.log('Skipping duplicate INITIAL_SESSION event');
          return;
        }
        
        console.log('Auth State Changed:', event, newSession?.user?.email);
        
        if (!mounted) return;
        await handleAuthChange(newSession);
      }
    );
  
    // Clean up subscription and flag on component unmount
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthChange]);

  // Derive role properties - memoized based on dependencies
  const authState = {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated: !!user && !!session,
    isStudent: !!profile && profile.role?.toLowerCase() === UserRole.STUDENT.toLowerCase(),
    isInstructor: !!profile && profile.role?.toLowerCase() === UserRole.INSTRUCTOR.toLowerCase(),
    isAdmin: !!profile && profile.role?.toLowerCase() === UserRole.ADMIN.toLowerCase(),
    logout
  };

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
};