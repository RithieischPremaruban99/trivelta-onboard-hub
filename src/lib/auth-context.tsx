import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "account_manager" | "account_executive" | "client";

const ROLE_PRIORITY: AppRole[] = ["admin", "account_executive", "account_manager", "client"];

interface AuthState {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe FIRST, then fetch existing session
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        // defer role fetch to avoid recursive auth calls
        setTimeout(() => fetchRole(s.user.id), 0);
      } else {
        setRole(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchRole(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (data ?? []).map((r) => r.role as AppRole);
    const best = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null;
    setRole(best);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthCtx.Provider value={{ session, user: session?.user ?? null, role, loading, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
