import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseEnabled } from "../lib/supabase/client";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authEnabled: boolean;
  signInWithOtp: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabaseEnabled || !supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setSession(null);
      } else {
        setSession(data.session ?? null);
      }
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    const userId = user?.id ?? (supabaseEnabled ? null : "local-user");
    const isAuthenticated = supabaseEnabled ? Boolean(user) : true;

    return {
      session,
      user,
      userId,
      isAuthenticated,
      isLoading,
      authEnabled: supabaseEnabled,
      signInWithOtp: async (email: string) => {
        if (!supabaseEnabled || !supabase) {
          return { error: null };
        }
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin }
        });
        return { error: error?.message ?? null };
      },
      signOut: async () => {
        if (!supabaseEnabled || !supabase) return;
        await supabase.auth.signOut();
      }
    };
  }, [session, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("AuthProvider is missing");
  }
  return ctx;
}
