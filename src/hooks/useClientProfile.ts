/**
 * useClientProfile — resolves the authenticated user's own client row.
 *
 * Fetches the `clients` row WHERE user_id = auth.uid().
 * Returns null if the user has no associated client record.
 * Refetch by calling the returned `refresh` function.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ClientRow } from "@/types/database.types";

export interface ClientProfileState {
  profile: ClientRow | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useClientProfile(): ClientProfileState {
  const [profile, setProfile] = useState<ClientRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [rev,     setRev]     = useState(0);

  const refresh = useCallback(() => setRev((r) => r + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) { setProfile(null); setLoading(false); }
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setProfile(null);
      } else {
        setProfile(data as ClientRow | null);
      }
      setLoading(false);
    }

    load();

    // Re-run whenever the auth session changes (sign in / sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (!cancelled) load();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rev]);

  return { profile, loading, error, refresh };
}
