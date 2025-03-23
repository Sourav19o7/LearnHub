import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabase from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

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

  // Simplified logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Simplified profile fetching function
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Initial session check (following the pattern of your working implementation)
    console.log('Calling Session');
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('Session Data:', currentSession);
      setSession(currentSession);
      
      if (currentSession?.user) {
        setUser(currentSession.user);
        
        // Fetch user profile
        fetchProfile(currentSession.user.id).then(profileData => {
          if (profileData) {
            setProfile(profileData);
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // Set up auth state change listener (following your working implementation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth State Changed:', event, newSession);
        setSession(newSession);
        
        if (newSession?.user) {
          setUser(newSession.user);
          
          // Fetch user profile on auth state change
          const profileData = await fetchProfile(newSession.user.id);
          if (profileData) {
            setProfile(profileData);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Clean up subscription on component unmount
    return () => subscription.unsubscribe();
  }, []);

  // Simple role checking
  const isAuthenticated = !!user && !!session;
  const userRole = profile?.role || '';
  const isAdmin = userRole.toLowerCase() === UserRole.ADMIN.toLowerCase();
  const isInstructor = userRole.toLowerCase() === UserRole.INSTRUCTOR.toLowerCase();
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
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};