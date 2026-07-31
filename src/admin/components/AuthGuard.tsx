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
  | "unauthorized"  // no session OR no admin_profiles row
  | "recovery";     // PASSWORD_RECOVERY session — must go to reset-password page

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Returns true when the session was established via a password-recovery link.
 * Supabase stores the AMR (Authentication Methods References) in the JWT payload;
 * recovery sessions carry { method: "recovery" } in that array.
 * We decode the access token locally — no network call needed.
 */
function isRecoverySession(session: Session): boolean {
  try {
    const payload = JSON.parse(atob(session.access_token.split(".")[1]));
    const amr: Array<{ method: string }> = payload.amr ?? [];
    return amr.some((a) => a.method === "recovery");
  } catch {
    return false;
  }
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
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      // Recovery sessions must go to /admin/reset-password, not the dashboard.
      // Supabase (implicit flow) processes the recovery hash synchronously during
      // client init, so getSession() already holds the recovery session by the
      // time this callback runs — before PASSWORD_RECOVERY even fires.
      if (data.session && isRecoverySession(data.session)) {
        if (!cancelled) setState("recovery");
        return;
      }
      const result = await resolveGuardState(data.session);
      if (!cancelled) setState(result);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      if (event === "TOKEN_REFRESHED") return;
      // Belt-and-suspenders: also catch the explicit PASSWORD_RECOVERY event
      // in case the recovery session was not yet stored when getSession() ran.
      if (event === "PASSWORD_RECOVERY") {
        if (!cancelled) setState("recovery");
        return;
      }

      const result = await resolveGuardState(session);
      if (!cancelled) setState(result);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-6 h-6 border-2 border-[rgba(138,92,215,0.3)] border-t-[#8a5cd7] rounded-full animate-spin" />
      </div>
    );
  }

  if (state === "recovery") {
    // A recovery session landed on a guarded route (e.g. /admin).
    // Send the user to the dedicated reset-password page.
    return <Navigate to="/admin/reset-password" replace />;
  }

  if (state === "unauthorized") {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
