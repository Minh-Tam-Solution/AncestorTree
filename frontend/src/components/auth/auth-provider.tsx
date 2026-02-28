'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/supabase-data';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isVerified: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Client-side debug logger — enabled via localStorage flag:
//   localStorage.setItem('ancestortree_debug', 'true')  then reload
const isDebug = () =>
  typeof window !== 'undefined' && localStorage.getItem('ancestortree_debug') === 'true';

function authLog(event: string, data?: Record<string, unknown>) {
  if (!isDebug()) return;
  console.log(`[Auth] ${event}`, { ts: new Date().toISOString(), ...data });
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    authLog('fetchProfile:start', { userId });
    const profile = await getProfile(userId);
    authLog('fetchProfile:done', { userId, role: profile?.role });
    return profile;
  } catch (error) {
    console.error('[Auth] fetchProfile:error', error);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    setProfile(p);
  }, [user]);

  useEffect(() => {
    // Initial session check + profile fetch
    authLog('getSession:start');
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      authLog('getSession:done', { userId: s?.user?.id ?? null, hasSession: !!s });
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const p = await fetchProfile(s.user.id);
        setProfile(p);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        authLog('onAuthStateChange', { event, userId: s?.user?.id ?? null });
        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          const p = await fetchProfile(s.user.id);
          setProfile(p);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    authLog('signIn:start', { email });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      authLog('signIn:error', { message: error.message });
      throw error;
    }
    authLog('signIn:success');
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const isAdmin = profile?.role === 'admin';
  const isEditor = profile?.role === 'admin' || profile?.role === 'editor';
  const isVerified = profile?.is_verified ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAdmin,
        isEditor,
        isVerified,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
