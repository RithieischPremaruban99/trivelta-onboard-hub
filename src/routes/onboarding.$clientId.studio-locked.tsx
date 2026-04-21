import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/onboarding/$clientId/studio-locked")({
  component: StudioLockedPage,
});

function StudioLockedPage() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/studio-locked" });
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    document.title = "Trivelta Hub · Design Submitted";
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/onboarding/$clientId/auth", params: { clientId }, replace: true });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("onboarding_forms")
        .select("studio_locked")
        .eq("client_id", clientId)
        .maybeSingle();

      if (!data?.studio_locked) {
        // Design isn't actually locked — redirect back to Studio
        navigate({ to: "/onboarding/$clientId/studio", params: { clientId }, replace: true });
        return;
      }
      setVerified(true);
    })();
  }, [user, authLoading, clientId, navigate]);

  if (authLoading || !verified) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-xl">

        {/* Success icon + heading */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-20 w-20 rounded-full bg-success/10 grid place-items-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-success" strokeWidth={1.5} />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
            DESIGN LOCKED · SENT TO TEAM
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Your design is with the Trivelta team
          </h1>
          <p className="text-sm text-muted-foreground max-w-md">
            We received your complete color palette, brand assets, and configuration.
            Your Account Manager will begin platform setup and reach out within 1 business day.
          </p>
        </div>

        {/* What happens next card */}
        <div className="rounded-xl border border-border bg-card/50 p-6 mb-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">
            WHAT HAPPENS NEXT
          </div>
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary grid place-items-center flex-shrink-0 text-[10px] font-bold">1</div>
              <span className="text-muted-foreground">Your Account Manager reviews the design and reaches out</span>
            </li>
            <li className="flex gap-3 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary grid place-items-center flex-shrink-0 text-[10px] font-bold">2</div>
              <span className="text-muted-foreground">Tech team configures your platform with your exact specs</span>
            </li>
            <li className="flex gap-3 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary grid place-items-center flex-shrink-0 text-[10px] font-bold">3</div>
              <span className="text-muted-foreground">Complete onboarding form to finalize your launch</span>
            </li>
          </ul>
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate({ to: "/onboarding/$clientId/studio", params: { clientId } })}
            className="rounded-xl border border-border bg-card hover:bg-muted/50 px-4 py-3 text-sm font-semibold text-foreground transition-colors"
          >
            View Locked Design
          </button>
          <button
            onClick={() => navigate({ to: "/onboarding/$clientId/form", params: { clientId } })}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-3 text-sm font-semibold transition-colors"
          >
            Continue Onboarding →
          </button>
        </div>

        {/* Support note */}
        <div className="text-center mt-8">
          <p className="text-[11px] text-muted-foreground/60">
            Questions? Contact your Account Manager directly.
          </p>
        </div>

      </div>
    </div>
  );
}
