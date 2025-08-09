import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children, setError }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    // Get initial session - Use Promise chain
    supabase?.auth?.getSession()?.then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session?.user)
          fetchUserProfile(session?.user?.id)
        }
        setLoading(false)
      })?.catch((error) => {
        if (error?.message?.includes('Failed to fetch') || 
            error?.message?.includes('AuthRetryableFetchError')) {
          setAuthError('Cannot connect to authentication service. Your Supabase project may be paused or inactive. Please check your Supabase dashboard and resume your project if needed.');
        } else {
          setAuthError('Failed to load user session');
          console.error('Session error:', error);
        }
        setLoading(false);
      })

    // Listen for auth changes - NEVER ASYNC callback
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session?.user)
          fetchUserProfile(session?.user?.id)  // Fire-and-forget, NO AWAIT
        } else {
          setUser(null)
          setUserProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const fetchUserProfile = (userId) => {
    supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single()?.then(({ data, error }) => {
        if (error) {
          setAuthError(error?.message);
          return;
        }
        setUserProfile(data);
      })?.catch((error) => {
        if (error?.message?.includes('Failed to fetch')) {
          setAuthError('Cannot connect to database. Your Supabase project may be paused or inactive.');
        } else {
          setAuthError('Failed to load user profile');
        }
      });
  }

  const signUp = async (email, password, fullName = null) => {
    try {
      setLoading(true);
      setAuthError('');
      
      const { data, error } = await supabase?.auth?.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email?.split('@')?.[0],
            role: 'basic_user'
          }
        }
      });
      
      if (error) {
        setAuthError(error?.message);
        return { error };
      }
      
      return { data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('AuthRetryableFetchError')) {
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused or inactive. Please check your Supabase dashboard and resume your project if needed.');
      } else {
        setAuthError('Registration failed. Please try again.');
        console.error('SignUp error:', error);
      }
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setAuthError('');
      
      const { data, error } = await supabase?.auth?.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        setAuthError(error?.message);
        return { error };
      }
      
      return { data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('AuthRetryableFetchError')) {
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused or inactive. Please check your Supabase dashboard and resume your project if needed.');
      } else {
        setAuthError('Login failed. Please try again.');
        console.error('SignIn error:', error);
      }
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setAuthError('');
      
      const { error } = await supabase?.auth?.signOut();
      
      if (error) {
        setAuthError(error?.message);
        return { error };
      }
      
      setUser(null);
      setUserProfile(null);
      
      return { success: true };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused or inactive.');
      } else {
        setAuthError('Logout failed. Please try again.');
        console.error('SignOut error:', error);
      }
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const clearAuthError = () => {
    setAuthError('');
  };

  const value = {
    user,
    userProfile,
    loading,
    authError,
    signUp,
    signIn,
    signOut,
    clearAuthError,
    isAuthenticated: !!user,
    isAdmin: userProfile?.role === 'admin',
    isProUser: userProfile?.role === 'pro_user' || userProfile?.role === 'admin',
    subscriptionTier: userProfile?.subscription_tier || 'free'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}