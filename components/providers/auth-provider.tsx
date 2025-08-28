"use client";

import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { SWRConfig } from "swr";
import { usePathname } from "next/navigation";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  role: string | null;
  profile: { photo_url?: string | null; name?: string | null } | null;
  loading: boolean;
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ photo_url?: string | null; name?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Shared loader to sync auth/session/profile state
  const loadSession = async () => {
    try {
      const supabase = createClient();
      setLoading(true);
      const { data: sessRes } = await supabase.auth.getSession();
      setSession(sessRes.session ?? null);
      const currentUser = sessRes.session?.user ?? null;
      setUser(currentUser ?? null);
      setRole(currentUser?.user_metadata?.role ?? null);

      if (currentUser) {
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("photo_url, name")
          .eq("id", currentUser.id)
          .maybeSingle();
        setProfile(profileData || {});
      } else {
        setProfile(null);
      }
  } catch (error) {
      // Reset to safe defaults on error
      setSession(null);
      setUser(null);
      setRole(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    
    // Initial load
    loadSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      // Directly update state from the session parameter
      if (session) {
        setUser(session.user);
        setRole(session.user.user_metadata?.role ?? null);
        setSession(session);
        
        // Fetch profile
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("photo_url, name")
          .eq("id", session.user.id)
          .maybeSingle();
        setProfile(profileData || {});
      } else {
        setUser(null);
        setRole(null);
        setSession(null);
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Also recheck session on route changes; needed when auth happens via server actions + redirect
  useEffect(() => {
    // Force a session check when navigating to home page after login
    if (pathname === '/' || pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')) {
      loadSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Also refresh on window focus (useful after email verification)
  useEffect(() => {
    const handleFocus = () => {
      loadSession();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const value = useMemo(
    () => ({ user, session, role, profile, loading, refreshAuth: loadSession }),
    [user, session, role, profile, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      <SWRConfig value={{ revalidateOnFocus: false, dedupingInterval: 60_000 }}>
        {children}
      </SWRConfig>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
