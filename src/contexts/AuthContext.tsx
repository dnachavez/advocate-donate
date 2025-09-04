import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { getCurrentUser, isAuthenticated, validateSessionIntegrity } from '@/lib/auth';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
  user_metadata?: {
    userType?: string;
    fullName?: string;
    [key: string]: unknown;
  };
  app_metadata?: {
    userType?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkPermission: (requiredRole?: string) => boolean;
  isEmailVerified: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  const refreshUser = async () => {
    try {
      const { user: userData, error } = await getCurrentUser();
      if (error) {
        console.error('Failed to refresh user data:', error);
        setUser(null);
        return;
      }
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      setUser(null);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      setIsAuth(false);
      
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkPermission = (requiredRole?: string): boolean => {
    if (!user || !requiredRole) return true;
    
    const userRole = user.user_metadata?.userType || user.app_metadata?.userType;
    return userRole === requiredRole;
  };

  const isEmailVerified = (): boolean => {
    return !!(user?.email_confirmed_at);
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }

        if (mounted) {
          setSession(initialSession);
          
          if (initialSession?.user) {
            // Validate session integrity
            const isValidSession = await validateSessionIntegrity();
            
            if (isValidSession) {
              const authStatus = await isAuthenticated();
              setIsAuth(authStatus);
              
              if (authStatus) {
                await refreshUser();
              }
            } else {
              // Invalid session, sign out
              await signOut();
            }
          } else {
            setIsAuth(false);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setIsAuth(false);
          setUser(null);
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);
        
        setSession(newSession);
        
        switch (event) {
          case 'SIGNED_IN':
            if (newSession?.user) {
              setIsAuth(true);
              await refreshUser();
              toast.success('Successfully signed in');
            }
            break;
            
          case 'SIGNED_OUT':
            setIsAuth(false);
            setUser(null);
            break;
            
          case 'TOKEN_REFRESHED':
            if (newSession?.user) {
              await refreshUser();
            }
            break;
            
          case 'USER_UPDATED':
            if (newSession?.user) {
              await refreshUser();
            }
            break;
            
          default:
            break;
        }
        
        setLoading(false);
      }
    );

    // Cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Periodic session validation
  useEffect(() => {
    if (!isAuth || !session) return;

    const validateSession = async () => {
      try {
        const isValid = await validateSessionIntegrity();
        if (!isValid) {
          console.warn('Session validation failed, signing out');
          await signOut();
        }
      } catch (error) {
        console.error('Session validation error:', error);
      }
    };

    // Validate session every 5 minutes
    const interval = setInterval(validateSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuth, session]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: isAuth,
    signOut,
    refreshUser,
    checkPermission,
    isEmailVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;