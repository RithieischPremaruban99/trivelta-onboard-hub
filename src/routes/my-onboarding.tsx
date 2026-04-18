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
      const { data } = await supabase
        .from("clients")
        .select("id")
        .eq("primary_contact_email", user.email!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setTarget(data?.id ?? "none");
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
  return <Navigate to="/onboarding/$clientId" params={{ clientId: target }} />;
}
