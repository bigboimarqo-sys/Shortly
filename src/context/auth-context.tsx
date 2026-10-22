import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

const AUTH_STORAGE_KEY = '@shotly_auth_session';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userType: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; user: User | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync auth state with AsyncStorage and Supabase
  const syncStorage = async (currentSession: Session | null) => {
    try {
      if (currentSession) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentSession));
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to sync auth with storage:', e);
    }
  };

  useEffect(() => {
    // 1. Initial session load from storage and Supabase
    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          await syncStorage(data.session);
        } else {
          // Fallback check in storage
          const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
          if (stored) {
            const parsedSession: Session = JSON.parse(stored);
            setSession(parsedSession);
            setUser(parsedSession.user);
          }
        }
      } catch (err) {
        console.warn('Error loading initial session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // 2. Listen to real-time auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      await syncStorage(newSession);
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: 'user',
          },
        },
      });

      if (error) {
        return { error, user: null };
      }

      setUser(data.user);
      setSession(data.session);
      await syncStorage(data.session);

      return { error: null, user: data.user };
    } catch (err: any) {
      return { error: err, user: null };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error, user: null };
      }

      setUser(data.user);
      setSession(data.session);
      await syncStorage(data.session);

      return { error: null, user: data.user };
    } catch (err: any) {
      return { error: err, user: null };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      await syncStorage(null);
    } catch (err) {
      console.warn('Error signing out:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const userType = (user?.user_metadata?.user_type as string) || null;
  const isAuthenticated = !!session && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userType,
        isLoading,
        isAuthenticated,
        signUp,
        signIn,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
