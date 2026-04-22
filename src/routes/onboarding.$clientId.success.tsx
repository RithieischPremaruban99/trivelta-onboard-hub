import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/onboarding/$clientId/success")({
  component: SuccessScreen,
});

function SuccessScreen() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/success" });
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/onboarding/$clientId/auth", params: { clientId }, replace: true });
      return;
    }
    (async () => {
      const { data: formData } = await supabase
        .from("onboarding_forms")
        .select("submitted_at")
        .eq("client_id", clientId)
        .maybeSingle();
      if (!formData?.submitted_at) {
        navigate({ to: "/onboarding/$clientId/form", params: { clientId }, replace: true });
        return;
      }
      setVerified(true);
    })();
  }, [user, authLoading, clientId]);

  if (authLoading || !verified) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-xl text-center">

        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-success/10 grid place-items-center">
            <CheckCircle2 className="h-8 w-8 text-success" strokeWidth={1.5} />
          </div>
        </div>

        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-3">
          ONBOARDING SUBMITTED
        </div>

        <h1 className="text-3xl font-bold mb-3">Thank you</h1>

        <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
          Your onboarding information has been sent to the Trivelta team. Your Account Manager
          will reach out within 1 business day to discuss next steps.
        </p>

        <div className="rounded-xl border border-border/40 bg-card/30 p-6 mb-6 text-left">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
            WHAT HAPPENS NEXT
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-3">
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary grid place-items-center flex-shrink-0 text-[10px] font-bold">
                1
              </div>
              <span className="text-muted-foreground">Account Manager reviews your information</span>
            </li>
            <li className="flex gap-3">
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary grid place-items-center flex-shrink-0 text-[10px] font-bold">
                2
              </div>
              <span className="text-muted-foreground">
                Technical team prepares your platform configuration
              </span>
            </li>
            <li className="flex gap-3">
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary grid place-items-center flex-shrink-0 text-[10px] font-bold">
                3
              </div>
              <span className="text-muted-foreground">
                You'll receive design access once setup is confirmed
              </span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Return to dashboard
        </button>
      </div>
    </div>
  );
}
