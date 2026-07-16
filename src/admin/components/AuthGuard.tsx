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

  if (error || !data) {
    // Not an authorised staff member — sign out immediately
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
      const result = await resolveGuardState(data.session);
      if (!cancelled) setState(result);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      setState("loading");
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

  if (state === "unauthorized") {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
