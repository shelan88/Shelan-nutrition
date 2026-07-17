/**
 * useAuth — shared public-site auth hook.
 *
 * Subscribes to supabase.auth.onAuthStateChange so any component that calls
 * this hook sees the same session state without additional round-trips.
 */
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface AuthState {
  user: User | null;
  /** True only during the initial session resolution (< 1 frame on warm load). */
  loading: boolean;
}

export function useAuth(): AuthState {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Resolve the current session synchronously from storage.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Keep in sync across tab focus / token refresh / sign-out.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
