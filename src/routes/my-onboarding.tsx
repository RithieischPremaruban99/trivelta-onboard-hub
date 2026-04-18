import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/my-onboarding")({
  component: MyOnboardingRedirect,
});

function MyOnboardingRedirect() {
  const { user, loading: authLoading } = useAuth();
  const [target, setTarget] = useState<string | null | "none">(null);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      // Look up via team_members so both owners and members are redirected correctly
      const { data } = await supabase
        .from("team_members")
        .select("client_id")
        .eq("email", user.email!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setTarget(data?.client_id ?? "none");
    })();
  }, [user, authLoading]);

  if (authLoading || target === null) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (target === "none") {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="surface-card max-w-md p-8 text-center">
          <h1 className="text-lg font-semibold">No onboarding found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn't find an onboarding linked to{" "}
            <span className="font-mono text-foreground">{user.email}</span>. Please contact your
            account manager.
          </p>
        </div>
      </div>
    );
  }
  return <Navigate to="/onboarding/$clientId/form" params={{ clientId: target }} />;
}
