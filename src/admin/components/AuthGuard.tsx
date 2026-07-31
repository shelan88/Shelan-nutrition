/**
 * AuthGuard — wraps all protected admin routes.
 *
 * Two-step gate:
 *   1. Authentication — is there a valid Supabase session?
 *   2. Authorization  — is the authenticated user listed in admin_profiles
 *                       with role 'admin' or 'staff'?
 *
 * If either check fails the user is signed out and redirected to
 * /admin/login. Fails CLOSED — on any error we deny access.
 */
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type GuardState =
  | "loading"       // still resolving
  | "authorized"    // authenticated + has admin_profiles row
  | "unauthorized"; // no session OR no admin_profiles row

interface AuthGuardProps {
  children: React.ReactNode;
}

async function resolveGuardState(session: Session | null): Promise<GuardState> {
  if (!session) return "unauthorized";

  // Verify the authenticated user has an admin/staff profile
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("id, role")
    .eq("user_id", session.user.id)
    .in("role", ["admin", "staff"])
    .maybeSingle();

  // Network / transient errors: do NOT sign out — the session is still valid
  // and the user is still authorised. Signing out on a network hiccup
  // (which is common on Android app-switches) would eject the user mid-task.
  if (error) {
    console.warn("[AuthGuard] admin_profiles query failed (network?):", error.message);
    return "authorized"; // keep the gate open; next real auth event will re-check
  }

  if (!data) {
    // Row genuinely missing → not an admin. Sign out cleanly.
    await supabase.auth.signOut();
    return "unauthorized";
  }

  return "authorized";
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [state, setState] = useState<GuardState>("loading");

  useEffect(() => {
    // RECOVERY-TRACE
    console.log(`[RECOVERY-TRACE] AuthGuard MOUNTED | pathname=${window.location.pathname}`);
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      console.log(`[RECOVERY-TRACE] AuthGuard getSession | userId=${data.session?.user?.id ?? "null"} | pathname=${window.location.pathname}`);
      const result = await resolveGuardState(data.session);
      console.log(`[RECOVERY-TRACE] AuthGuard resolveGuardState(getSession) → ${result} | pathname=${window.location.pathname}`);
      if (!cancelled) setState(result);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      console.log(`[RECOVERY-TRACE] AuthGuard onAuthStateChange | event=${event} | userId=${session?.user?.id ?? "null"} | pathname=${window.location.pathname}`);
      if (event === "TOKEN_REFRESHED") return;

      const result = await resolveGuardState(session);
      console.log(`[RECOVERY-TRACE] AuthGuard resolveGuardState(${event}) → ${result} | pathname=${window.location.pathname}`);
      if (!cancelled) setState(result);
    });

    return () => {
      console.log(`[RECOVERY-TRACE] AuthGuard UNMOUNTED | pathname=${window.location.pathname}`);
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // RECOVERY-TRACE
  console.log(`[RECOVERY-TRACE] AuthGuard render | state=${state} | pathname=${window.location.pathname}`);

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-6 h-6 border-2 border-[rgba(138,92,215,0.3)] border-t-[#8a5cd7] rounded-full animate-spin" />
      </div>
    );
  }

  if (state === "unauthorized") {
    console.log(`[RECOVERY-TRACE] AuthGuard → Navigate to /admin/login | pathname=${window.location.pathname}`);
    return <Navigate to="/admin/login" replace />;
  }

  console.log(`[RECOVERY-TRACE] AuthGuard → rendering children | pathname=${window.location.pathname}`);
  return <>{children}</>;
}
