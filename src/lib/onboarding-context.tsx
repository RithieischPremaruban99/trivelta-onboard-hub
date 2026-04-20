import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export interface WelcomeInfo {
  clientName: string;
  driveLink: string | null;
  amName: string | null;
  amEmail: string | null;
}

export interface OnboardingCtxValue {
  clientId: string;
  welcomeInfo: WelcomeInfo | null;
  clientRole: "client_owner" | "client_member" | null;
  ownerEmail: string | null;
  loadingPublic: boolean;
  loadingAuth: boolean;
}

export const OnboardingCtx = createContext<OnboardingCtxValue | undefined>(undefined);

export function OnboardingProvider({ clientId, children }: { clientId: string; children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [welcomeInfo, setWelcomeInfo] = useState<WelcomeInfo | null>(null);
  const [clientRole, setClientRole] = useState<"client_owner" | "client_member" | null>(null);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingPublic(true);
      const [welcomeRes, clientRes] = await Promise.all([
        supabase.rpc("get_client_welcome_info", { _client_id: clientId }),
        supabase.from("clients").select("drive_link").eq("id", clientId).maybeSingle(),
      ]);
      if (welcomeRes.data && welcomeRes.data.length > 0) {
        const row = welcomeRes.data[0];
        setWelcomeInfo({
          clientName: row.client_name,
          driveLink: clientRes.data?.drive_link ?? null,
          amName: row.am_name,
          amEmail: row.am_email,
        });
      }
      setLoadingPublic(false);
    })();
  }, [clientId]);

  useEffect(() => {
    if (authLoading || !user) {
      setClientRole(null);
      setOwnerEmail(null);
      return;
    }
    (async () => {
      setLoadingAuth(true);
      // Auto-register this visitor as client_member if they have no row yet.
      // No-op if they're already the client_owner.
      await supabase.rpc("register_onboarding_visitor", { _client_id: clientId });
      const [memberRes, ownerRes] = await Promise.all([
        supabase
          .from("team_members")
          .select("client_role")
          .eq("client_id", clientId)
          .eq("email", user.email!)
          .maybeSingle(),
        supabase
          .from("team_members")
          .select("email")
          .eq("client_id", clientId)
          .eq("client_role", "client_owner")
          .maybeSingle(),
      ]);
      setClientRole((memberRes.data?.client_role as "client_owner" | "client_member") ?? null);
      setOwnerEmail(ownerRes.data?.email ?? null);
      setLoadingAuth(false);
    })();
  }, [clientId, user, authLoading]);

  return (
    <OnboardingCtx.Provider value={{ clientId, welcomeInfo, clientRole, ownerEmail, loadingPublic, loadingAuth }}>
      {children}
    </OnboardingCtx.Provider>
  );
}

export function useOnboardingCtx() {
  const ctx = useContext(OnboardingCtx);
  if (!ctx) throw new Error("useOnboardingCtx must be used within OnboardingProvider");
  return ctx;
}
