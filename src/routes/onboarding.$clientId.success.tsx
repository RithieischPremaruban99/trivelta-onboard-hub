import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOnboardingCtx } from "@/lib/onboarding-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  Loader2,
  MessagesSquare,
  FolderOpen,
  Palette,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { TriveltaNav } from "@/components/TriveltaNav";

export const Route = createFileRoute("/onboarding/$clientId/success")({
  component: SuccessScreen,
});

function slackName(clientName: string) {
  return (
    "#" +
    clientName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") +
    "-onboarding"
  );
}

function initials(name: string | null | undefined) {
  if (!name) return "AM";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SuccessScreen() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/success" });
  const { welcomeInfo, loadingPublic, loadingAuth, clientRole } = useOnboardingCtx();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);
  const [studioAccess, setStudioAccess] = useState(false);

  useEffect(() => {
    document.title = "Trivelta Hub · Complete";
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/onboarding/$clientId/auth", params: { clientId }, replace: true });
      return;
    }
    (async () => {
      const [formRes, clientRes] = await Promise.all([
        supabase
          .from("onboarding_forms")
          .select("submitted_at")
          .eq("client_id", clientId)
          .maybeSingle(),
        supabase.from("clients").select("studio_access").eq("id", clientId).maybeSingle(),
      ]);
      if (!formRes.data?.submitted_at) {
        navigate({ to: "/onboarding/$clientId/form", params: { clientId }, replace: true });
        return;
      }
      setStudioAccess(clientRes.data?.studio_access ?? false);
      setVerified(true);
    })();
  }, [user, authLoading]);

  if (authLoading || loadingPublic || loadingAuth || !verified || !welcomeInfo) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const channel = slackName(welcomeInfo.clientName);

  return (
    <div className="route-slide-up flex min-h-screen flex-col">
      <TriveltaNav
        product="Hub"
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

        <div className="relative z-10 mx-auto max-w-[900px]">
          {/* Success hero */}
          <div className="mb-10 text-center">
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

          {/* Studio CTA - PRIMARY action before info cards */}
          {clientRole === "client_owner" && studioAccess && (
            <div className="mb-8">
              <p className="mb-3 text-center text-[13px] font-medium uppercase tracking-[0.18em] text-muted-foreground font-mono">
                Your onboarding is complete. Now let&apos;s build your brand.
              </p>
              <button
                onClick={() =>
                  navigate({
                    to: "/onboarding/$clientId/studio-intro",
                    params: { clientId },
                  })
                }
                className="group relative w-full overflow-hidden rounded-2xl p-px transition-all duration-300 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,0.7), rgba(99,102,241,0.5), rgba(37,99,235,0.3))",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ boxShadow: "0 0 40px 8px rgba(37,99,235,0.3)" }}
                />
                <div className="relative flex w-full flex-col items-center gap-4 rounded-2xl bg-card px-8 py-8 text-center sm:flex-row sm:text-left">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/30 transition-colors group-hover:bg-primary/30">
                    <Palette className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-center gap-2 sm:justify-start">
                      <span className="text-[20px] font-semibold text-foreground">
                        Customize Your Platform
                      </span>
                      <Sparkles className="h-4 w-4 text-primary opacity-70" />
                    </div>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
                      Design your platform in Trivelta Studio — choose colors, generate your logo,
                      and preview your app live.
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/25 transition-all duration-200 group-hover:bg-primary group-hover:ring-primary">
                    <ArrowRight className="h-5 w-5 text-primary transition-colors group-hover:text-white" />
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Studio not yet available — AM will reach out */}
          {clientRole === "client_owner" && !studioAccess && (
            <div className="mb-8 flex items-center gap-4 rounded-xl border border-border/60 bg-card px-6 py-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Palette className="h-6 w-6 text-primary/60" />
              </div>
              <div>
                <div className="text-[15px] font-semibold text-foreground">Trivelta Studio</div>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Your AM will enable your Studio workspace shortly. You'll be notified when it's
                  ready.
                </p>
              </div>
            </div>
          )}

          {/* Info cards - equal width, equal height */}
          <div className="mb-4 grid items-stretch gap-4 sm:grid-cols-3">
            {/* Slack */}
            <div className="flex flex-col rounded-xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/30">
              <div className="mb-4 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
                <MessagesSquare className="h-5 w-5" />
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Slack Channel
              </div>
              <div className="mt-2 flex-1 break-all font-mono text-sm font-medium text-foreground">
                {channel}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-5 w-full"
                onClick={() => {
                  navigator.clipboard.writeText(channel);
                  toast.success("Copied!");
                }}
              >
                <Copy className="h-3.5 w-3.5" /> Copy name
              </Button>
            </div>

            {/* Drive */}
            <div className="flex flex-col rounded-xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/30">
              <div className="mb-4 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Drive Folder
              </div>
              <div className="mt-2 flex-1 text-sm text-muted-foreground">
                Upload brand assets and additional documents here.
              </div>
              {welcomeInfo.driveLink ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-5 w-full"
                  onClick={() => window.open(welcomeInfo.driveLink!, "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open folder
                </Button>
              ) : (
                <div className="mt-5 text-[12px] text-muted-foreground/60">
                  Link will be shared by your AM
                </div>
              )}
            </div>

            {/* AM */}
            <div className="flex flex-col rounded-xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/30">
              <div className="mb-4 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 font-semibold text-sm text-primary ring-1 ring-primary/30">
                {initials(welcomeInfo.amName)}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Account Manager
              </div>
              <div className="mt-1 truncate text-sm font-medium text-foreground">
                {welcomeInfo.amName ?? "Account Manager"}
              </div>
              {welcomeInfo.amEmail ? (
                <>
                  <div className="mt-2 flex-1 break-all font-mono text-[12px] text-muted-foreground">
                    {welcomeInfo.amEmail}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-5 w-full"
                    onClick={() => window.open(`mailto:${welcomeInfo.amEmail}`, "_blank")}
                  >
                    <Mail className="h-3.5 w-3.5" /> Send email
                  </Button>
                </>
              ) : (
                <div className="mt-2 flex-1 text-[12px] text-muted-foreground/60">
                  Contact details will be shared shortly.
                </div>
              )}
            </div>
          </div>

          {/* Non-owner notice */}
          {clientRole !== "client_owner" && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/60 bg-card px-5 py-4 text-[13px] text-muted-foreground">
              <Palette className="h-4 w-4 shrink-0" />
              Platform customization in Trivelta Studio is available to the account owner.
            </div>
          )}

          {/* Divider */}
          <div className="my-8 border-t border-border/60" />

          {/* Timeline */}
          <div className="rounded-xl border border-border/60 bg-card p-8">
            <div className="mb-7 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              What happens next?
            </div>

            {/* Desktop: horizontal with connecting line */}
            <div className="hidden sm:block">
              <div className="relative">
                <div
                  className="absolute top-[18px] left-[calc(16.67%+18px)] right-[calc(16.67%+18px)] h-px bg-border"
                  aria-hidden="true"
                />
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { step: "1", label: "AM reviews submission", sub: "Within 24 hours" },
                    {
                      step: "2",
                      label: "Platform configuration begins",
                      sub: "Technical setup starts",
                    },
                    {
                      step: "3",
                      label: "MVP ready for your review",
                      sub: "Preview & feedback round",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex flex-col items-center text-center">
                      <div className="relative z-10 mb-4 grid h-9 w-9 place-items-center rounded-full bg-card font-mono text-xs font-semibold text-primary ring-2 ring-primary/30">
                        {item.step}
                      </div>
                      <div className="text-[13px] font-semibold text-foreground">{item.label}</div>
                      <div className="mt-1 text-[12px] text-muted-foreground">{item.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile: vertical */}
            <div className="flex flex-col gap-0 sm:hidden">
              {[
                { step: "1", label: "AM reviews submission", sub: "Within 24 hours" },
                {
                  step: "2",
                  label: "Platform configuration begins",
                  sub: "Technical setup starts",
                },
                { step: "3", label: "MVP ready for your review", sub: "Preview & feedback round" },
              ].map((item, i, arr) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary ring-1 ring-primary/30">
                      {item.step}
                    </div>
                    {i < arr.length - 1 && <div className="my-1 h-8 w-px bg-border" />}
                  </div>
                  <div className={i < arr.length - 1 ? "pb-6" : ""}>
                    <div className="mt-1.5 text-[13px] font-semibold text-foreground">
                      {item.label}
                    </div>
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
