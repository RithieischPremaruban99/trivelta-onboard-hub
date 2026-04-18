import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOnboardingCtx } from "@/lib/onboarding-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, ExternalLink, Mail, Loader2, MessagesSquare, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { TriveltaNav } from "@/components/TriveltaNav";

export const Route = createFileRoute("/onboarding/$clientId/success")({
  component: SuccessScreen,
});

function slackName(clientName: string) {
  return (
    "#" +
    clientName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") +
    "-onboarding"
  );
}

function initials(name: string | null | undefined) {
  if (!name) return "AM";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function SuccessScreen() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/success" });
  const { welcomeInfo, loadingPublic } = useOnboardingCtx();
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
      const { data } = await supabase
        .from("onboarding_forms")
        .select("submitted_at")
        .eq("client_id", clientId)
        .maybeSingle();
      if (!data?.submitted_at) {
        navigate({ to: "/onboarding/$clientId/form", params: { clientId }, replace: true });
        return;
      }
      setVerified(true);
    })();
  }, [user, authLoading]);

  if (authLoading || loadingPublic || !verified || !welcomeInfo) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const channel = slackName(welcomeInfo.clientName);

  return (
    <div className="flex min-h-screen flex-col">
      <TriveltaNav
        right={
          <div className="hidden text-right sm:block">
            <div className="text-[13px] font-semibold text-foreground">
              {welcomeInfo.clientName}
            </div>
            <div className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Submitted
            </div>
          </div>
        }
      />

      <main className="relative flex-1 overflow-hidden px-4 py-12 sm:px-6">
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="orb-1 absolute left-[10%] top-[10%] h-[500px] w-[500px] rounded-full bg-success opacity-[0.05] blur-[120px]" />
          <div className="orb-2 absolute right-[10%] bottom-[20%] h-[400px] w-[400px] rounded-full bg-primary opacity-[0.05] blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[820px]">
          {/* Success hero */}
          <div className="mb-12 text-center">
            <div className="check-anim mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-success/15 ring-2 ring-success/30">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-[36px] font-semibold tracking-tight text-foreground sm:text-[44px]">
              Platform onboarding submitted.
            </h1>
            <p className="mx-auto mt-4 max-w-[520px] text-[16px] leading-relaxed text-muted-foreground">
              Thank you, <span className="text-foreground">{welcomeInfo.clientName}</span>. Your
              Trivelta team has been notified and your platform configuration starts now.
            </p>
          </div>

          {/* Info cards */}
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            {/* Slack */}
            <div className="surface-card group p-6 transition-colors hover:border-primary/30">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
                <MessagesSquare className="h-5 w-5" />
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Slack Channel
              </div>
              <div className="mt-2 break-all font-mono text-sm font-medium text-foreground">
                {channel}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full"
                onClick={() => {
                  navigator.clipboard.writeText(channel);
                  toast.success("Copied!");
                }}
              >
                <Copy className="h-3.5 w-3.5" /> Copy name
              </Button>
            </div>

            {/* Drive */}
            <div className="surface-card group p-6 transition-colors hover:border-primary/30">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Drive Folder
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Upload brand assets and additional documents here.
              </div>
              {welcomeInfo.driveLink ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => window.open(welcomeInfo.driveLink!, "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open folder
                </Button>
              ) : (
                <div className="mt-4 text-[12px] text-muted-foreground/70">
                  Link will be shared by your AM
                </div>
              )}
            </div>

            {/* AM */}
            <div className="surface-card group p-6 transition-colors hover:border-primary/30">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 font-semibold text-sm text-primary ring-1 ring-primary/30">
                  {initials(welcomeInfo.amName)}
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Account Manager
                  </div>
                  <div className="truncate text-sm font-medium text-foreground">
                    {welcomeInfo.amName ?? "Account Manager"}
                  </div>
                </div>
              </div>
              {welcomeInfo.amEmail && (
                <>
                  <div className="break-all font-mono text-[12px] text-muted-foreground">
                    {welcomeInfo.amEmail}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => window.open(`mailto:${welcomeInfo.amEmail}`, "_blank")}
                  >
                    <Mail className="h-3.5 w-3.5" /> Send email
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="surface-card p-7">
            <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              What happens next?
            </div>
            <div className="flex flex-col gap-0 sm:flex-row">
              {[
                { step: "1", label: "AM reviews submission", sub: "Within 24 hours" },
                { step: "2", label: "Platform configuration begins", sub: "Technical setup starts" },
                { step: "3", label: "MVP ready for your review", sub: "Preview & feedback round" },
              ].map((item, i, arr) => (
                <div
                  key={item.step}
                  className="flex flex-1 items-start gap-4 sm:flex-col sm:items-center sm:gap-0"
                >
                  <div className="flex items-center gap-4 sm:w-full sm:flex-col sm:gap-0">
                    <div className="mb-0 flex shrink-0 sm:mb-3 sm:w-full sm:justify-center">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 font-mono text-xs font-semibold text-primary ring-1 ring-primary/30">
                        {item.step}
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="h-8 w-px bg-border sm:hidden" />
                    )}
                    {i < arr.length - 1 && (
                      <div className="my-4 mx-2 hidden h-px w-full flex-1 bg-border sm:block" />
                    )}
                  </div>
                  <div className="pb-6 sm:pb-0 sm:text-center">
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
