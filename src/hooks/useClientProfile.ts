/**
 * useClientProfile — resolves the authenticated user's own client row.
 *
 * Fetches the `clients` row WHERE user_id = auth.uid().
 *
 * AUTO-RECOVERY: If the user is authenticated but no client row exists yet
 * (e.g. email-confirmed signup, OAuth login, or timing race after registration),
 * the hook automatically calls upsert_client_from_auth and retries once.
 * This guarantees every authenticated user always has a profile — no manual
 * DB insertion is ever required.
 *
 * Returns null only if:
 *   • There is no active session (user is not logged in), OR
 *   • A genuine database error occurred after the recovery attempt.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { upsertClientFromAuth } from "@/admin/repositories/clients.repository";
import type { ClientRow } from "@/types/database.types";

export interface ClientProfileState {
  profile:  ClientRow | null;
  loading:  boolean;
  error:    string | null;
  refresh:  () => void;
}

export function useClientProfile(): ClientProfileState {
  const [profile,  setProfile]  = useState<ClientRow | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [rev,      setRev]      = useState(0);

  const refresh = useCallback(() => setRev((r) => r + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      // ── 1. Require an active session ────────────────────────────────────────
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) { setProfile(null); setLoading(false); }
        return;
      }

      // ── 2. Attempt to fetch the existing client row ─────────────────────────
      const { data, error: fetchError } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (data) {
        // Row found — happy path.
        setProfile(data as ClientRow);
        setLoading(false);
        return;
      }

      // ── 3. No row found — auto-create then retry ────────────────────────────
      // This handles: email-confirmed signups, OAuth logins, timing races after
      // registration, and any other path where the upsert wasn't awaited.
      await upsertClientFromAuth(session.user);

      const { data: recovered, error: recoveryError } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (recoveryError) {
        setError(recoveryError.message);
        setProfile(null);
      } else {
        setProfile(recovered as ClientRow | null);
      }
      setLoading(false);
    }

    load();

    // Re-run whenever the auth session changes (sign in / sign out / token refresh)
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
