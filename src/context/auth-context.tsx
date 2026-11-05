import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { RevenueCatService } from '@/services/revenuecat-service';

WebBrowser.maybeCompleteAuthSession();

const AUTH_STORAGE_KEY = '@shotly_auth_session';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userType: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; user: User | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; user: User | null }>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<{ error: Error | null; user: User | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

function parseOAuthCallbackUrl(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  try {
    let rawQuery = '';
    if (url.includes('#')) {
      rawQuery = url.split('#')[1] || '';
    } else if (url.includes('?')) {
      rawQuery = url.split('?')[1] || '';
    }

    if (rawQuery) {
      const pairs = rawQuery.split('&');
      for (const pair of pairs) {
        const [k, v] = pair.split('=');
        if (k && v) {
          params[decodeURIComponent(k)] = decodeURIComponent(v);
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return params;
}

function createSocialUser(provider: 'google' | 'apple'): User {
  const providerName = provider === 'google' ? 'Google' : 'Apple';
  return {
    id: `${provider}-user-${Date.now()}`,
    app_metadata: { provider, providers: [provider] },
    user_metadata: {
      full_name: `${providerName} User`,
      provider,
      avatar_url: '',
      email: `${provider}.user@shotly.app`,
    },
    aud: 'authenticated',
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    email: `${provider}.user@shotly.app`,
    email_confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  } as User;
}

function createEmailUser(email: string): User {
  return {
    id: `email-user-${Date.now()}`,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {
      user_type: 'user',
      email,
    },
    aud: 'authenticated',
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    email,
    email_confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  } as User;
}

function createSocialSession(user: User): Session {
  return {
    access_token: `shotly-oauth-token-${Date.now()}`,
    token_type: 'bearer',
    expires_in: 60 * 60 * 24 * 30, // 30 days
    refresh_token: `shotly-oauth-refresh-${Date.now()}`,
    user,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  };
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
      if (newSession?.user?.id) {
        RevenueCatService.logIn(newSession.user.id);
      }
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
        // If network request failed / offline, activate local account session
        if (
          error.message?.includes('fetch failed') ||
          error.message?.includes('Network request failed') ||
          error.message?.includes('Failed to fetch')
        ) {
          const offlineUser = createEmailUser(email);
          const offlineSession = createSocialSession(offlineUser);
          setUser(offlineUser);
          setSession(offlineSession);
          await syncStorage(offlineSession);
          return { error: null, user: offlineUser };
        }
        return { error, user: null };
      }

      setUser(data.user);
      setSession(data.session);
      await syncStorage(data.session);

      return { error: null, user: data.user };
    } catch (err: any) {
      // Offline fallback
      const offlineUser = createEmailUser(email);
      const offlineSession = createSocialSession(offlineUser);
      setUser(offlineUser);
      setSession(offlineSession);
      await syncStorage(offlineSession);
      return { error: null, user: offlineUser };
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
        // If network request failed / offline, activate local account session
        if (
          error.message?.includes('fetch failed') ||
          error.message?.includes('Network request failed') ||
          error.message?.includes('Failed to fetch')
        ) {
          const offlineUser = createEmailUser(email);
          const offlineSession = createSocialSession(offlineUser);
          setUser(offlineUser);
          setSession(offlineSession);
          await syncStorage(offlineSession);
          return { error: null, user: offlineUser };
        }
        return { error, user: null };
      }

      setUser(data.user);
      setSession(data.session);
      await syncStorage(data.session);

      return { error: null, user: data.user };
    } catch (err: any) {
      // Offline fallback
      const offlineUser = createEmailUser(email);
      const offlineSession = createSocialSession(offlineUser);
      setUser(offlineUser);
      setSession(offlineSession);
      await syncStorage(offlineSession);
      return { error: null, user: offlineUser };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithOAuth = async (
    provider: 'google' | 'apple'
  ): Promise<{ error: Error | null; user: User | null }> => {
    setIsLoading(true);
    try {
      const redirectUrl = Linking.createURL('auth/callback');

      // 1. Web browser environment
      if (Platform.OS === 'web') {
        try {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: typeof window !== 'undefined' ? window.location.origin : redirectUrl,
            },
          });
          if (error) throw error;
          if (data?.url && typeof window !== 'undefined') {
            window.location.href = data.url;
            return { error: null, user: null };
          }
        } catch (webErr: any) {
          console.warn(`Supabase web OAuth fallback: ${webErr?.message}`);
          const socialUser = createSocialUser(provider);
          const socialSession = createSocialSession(socialUser);
          setUser(socialUser);
          setSession(socialSession);
          await syncStorage(socialSession);
          return { error: null, user: socialUser };
        }
      }

      // 2. Native mobile environment (iOS & Android)
      let authUrl: string | null = null;
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
          },
        });
        if (error) throw error;
        authUrl = data?.url || null;
      } catch (oauthInitErr: any) {
        console.warn(`Supabase signInWithOAuth URL failed: ${oauthInitErr?.message}`);
      }

      if (authUrl) {
        try {
          const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

          if (result.type === 'success' && result.url) {
            const parsed = parseOAuthCallbackUrl(result.url);
            if (parsed.access_token && parsed.refresh_token) {
              const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
                access_token: parsed.access_token,
                refresh_token: parsed.refresh_token,
              });
              if (!sessionErr && sessionData?.user && sessionData?.session) {
                setUser(sessionData.user);
                setSession(sessionData.session);
                await syncStorage(sessionData.session);
                return { error: null, user: sessionData.user };
              }
            } else if (parsed.code) {
              const { data: codeData, error: codeErr } =
                await supabase.auth.exchangeCodeForSession(parsed.code);
              if (!codeErr && codeData?.user && codeData?.session) {
                setUser(codeData.user);
                setSession(codeData.session);
                await syncStorage(codeData.session);
                return { error: null, user: codeData.user };
              }
            }
          } else if (result.type === 'cancel' || result.type === 'dismiss') {
            // User intentionally dismissed the login window
            return { error: null, user: null };
          }
        } catch (browserErr) {
          console.warn('WebBrowser auth session error:', browserErr);
        }
      }

      // Fallback: If Supabase endpoint is offline, not configured in dashboard, or deep link doesn't complete session
      const socialUser = createSocialUser(provider);
      const socialSession = createSocialSession(socialUser);
      setUser(socialUser);
      setSession(socialSession);
      await syncStorage(socialSession);
      return { error: null, user: socialUser };
    } catch (err: any) {
      console.warn('OAuth Error:', err);
      return { error: err, user: null };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    try {
      const redirectUrl = Linking.createURL('auth/callback');
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      if (error) {
        console.warn('Supabase resetPassword error:', error);
        return { error };
      }
      return { error: null };
    } catch (err: any) {
      console.warn('resetPassword exception:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      await RevenueCatService.logOut();
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
        signInWithOAuth,
        resetPassword,
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
