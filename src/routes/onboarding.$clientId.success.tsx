import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOnboardingCtx } from "@/lib/onboarding-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, ExternalLink, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding/$clientId/success")({
  component: SuccessScreen,
});

function slackName(clientName: string) {
  return "#" + clientName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-onboarding";
}

function SuccessScreen() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/success" });
  const { welcomeInfo, loadingPublic } = useOnboardingCtx();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/onboarding/$clientId/auth", params: { clientId }, replace: true }); return; }
    // Verify submission exists
    (async () => {
      const { data } = await supabase.from("onboarding_forms").select("submitted_at").eq("client_id", clientId).maybeSingle();
      if (!data?.submitted_at) {
        navigate({ to: "/onboarding/$clientId/form", params: { clientId }, replace: true });
        return;
      }
      setVerified(true);
    })();
  }, [user, authLoading]);

  if (authLoading || loadingPublic || !verified || !welcomeInfo) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0a0d14]">
        <Loader2 className="h-6 w-6 animate-spin text-[#3b82f6]" />
      </div>
    );
  }

  const channel = slackName(welcomeInfo.clientName);

  return (
    <div className="min-h-screen bg-[#0a0d14] px-4 py-12 sm:px-6">
      {/* Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="orb-1 absolute left-[10%] top-[10%] h-[500px] w-[500px] rounded-full bg-[#22c55e] opacity-[0.05] blur-[100px]" />
        <div className="orb-2 absolute right-[10%] bottom-[20%] h-[400px] w-[400px] rounded-full bg-[#3b82f6] opacity-[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[680px]">
        {/* Logo */}
        <div className="mb-12 flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#3b82f6]/15 ring-1 ring-[#3b82f6]/30">
            <span className="font-mono text-xs font-bold text-[#3b82f6]">T</span>
          </div>
          <div className="text-[11px] font-bold tracking-widest text-[#f9fafb]">TRIVELTA</div>
        </div>

        {/* Success hero */}
        <div className="mb-10 text-center">
          <div className="check-anim mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-[#22c55e]/15 ring-2 ring-[#22c55e]/30">
            <CheckCircle2 className="h-10 w-10 text-[#22c55e]" />
          </div>
          <h1 className="text-[32px] font-semibold text-[#f9fafb]">Onboarding submitted.</h1>
          <p className="mt-3 text-[16px] text-[#9ca3af]">
            Thank you, <span className="text-[#f9fafb]">{welcomeInfo.clientName}</span>. Your Trivelta team has been notified.
          </p>
        </div>

        {/* Info cards */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {/* Slack */}
          <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-[#6b7280]">Your Slack Channel</div>
            <div className="mb-3 font-mono text-sm font-medium text-[#f9fafb] break-all">{channel}</div>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-[#1f2937] text-[#9ca3af] hover:text-[#f9fafb]"
              onClick={() => { navigator.clipboard.writeText(channel); toast.success("Copied!"); }}
            >
              <Copy className="h-3.5 w-3.5" /> Copy name
            </Button>
          </div>

          {/* Drive */}
          <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-[#6b7280]">Your Drive Folder</div>
            <div className="mb-3 text-sm text-[#9ca3af]">Upload your brand assets and any additional documents here.</div>
            {welcomeInfo.driveLink ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full border-[#1f2937] text-[#9ca3af] hover:text-[#f9fafb]"
                onClick={() => window.open(welcomeInfo.driveLink!, "_blank")}
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open folder
              </Button>
            ) : (
              <div className="text-[12px] text-[#4b5563]">Link will be shared by your AM</div>
            )}
          </div>

          {/* AM */}
          <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-[#6b7280]">Your Account Manager</div>
            <div className="mb-1 text-sm font-medium text-[#f9fafb]">{welcomeInfo.amName ?? "Account Manager"}</div>
            {welcomeInfo.amEmail && (
              <>
                <div className="mb-3 font-mono text-[12px] text-[#9ca3af]">{welcomeInfo.amEmail}</div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-[#1f2937] text-[#9ca3af] hover:text-[#f9fafb]"
                  onClick={() => window.open(`mailto:${welcomeInfo.amEmail}`, "_blank")}
                >
                  <Mail className="h-3.5 w-3.5" /> Send email
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-wider text-[#6b7280]">What happens next?</div>
          <div className="flex flex-col gap-0 sm:flex-row sm:gap-0">
            {[
              { step: "1", label: "AM reviews submission", sub: "Within 24 hours" },
              { step: "2", label: "Platform configuration begins", sub: "Technical setup starts" },
              { step: "3", label: "MVP ready for your review", sub: "Preview & feedback round" },
            ].map((item, i, arr) => (
              <div key={item.step} className="flex sm:flex-col sm:flex-1 items-start sm:items-center gap-4 sm:gap-0">
                {/* Connector */}
                <div className="flex sm:flex-col items-center gap-4 sm:gap-0 sm:w-full">
                  <div className="flex sm:justify-center sm:w-full mb-0 sm:mb-3">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-[#3b82f6]/15 font-mono text-xs font-semibold text-[#3b82f6] ring-1 ring-[#3b82f6]/30 shrink-0">
                      {item.step}
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="h-8 w-px bg-[#1f2937] sm:hidden" />
                  )}
                  {i < arr.length - 1 && (
                    <div className="hidden sm:block h-px flex-1 bg-[#1f2937] my-4 mx-2 w-full" />
                  )}
                </div>
                <div className="sm:text-center pb-6 sm:pb-0">
                  <div className="text-sm font-medium text-[#f9fafb]">{item.label}</div>
                  <div className="mt-0.5 text-[12px] text-[#6b7280]">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
