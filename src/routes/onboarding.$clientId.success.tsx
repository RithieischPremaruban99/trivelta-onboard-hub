import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  Eye,
  FileText,
  Loader2,
  Mail,
  Palette,
  Rocket,
  Settings2,
  Shield,
  Sparkles,
  UserCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { StageHeader } from "@/components/StageHeader";
import { downloadClientPDF } from "@/lib/pdf-builder";
import type { FormShape } from "@/lib/onboarding-schema";
import { OnboardingLoadingScreen } from "@/components/onboarding/OnboardingLoadingScreen";

export const Route = createFileRoute("/onboarding/$clientId/success")({
  component: SuccessScreen,
});

function SuccessScreen() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/success" });
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);
  const [pdfData, setPdfData] = useState<{
    clientName: string;
    contactEmail: string;
    submittedAt: string;
    form: FormShape;
  } | null>(null);
  const [hasLandingPageCTA, setHasLandingPageCTA] = useState(false);

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
          .select("data, submitted_at")
          .eq("client_id", clientId)
          .maybeSingle(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("clients")
          .select("name, primary_contact_email, studio_features")
          .eq("id", clientId)
          .maybeSingle(),
      ]);
      if (!formRes.data?.submitted_at) {
        navigate({ to: "/onboarding/$clientId/form", params: { clientId }, replace: true });
        return;
      }
      setPdfData({
        clientName: clientRes.data?.name ?? "Client",
        contactEmail: clientRes.data?.primary_contact_email ?? "",
        submittedAt: formRes.data.submitted_at,
        form: formRes.data.data as FormShape,
      });
      const sf = clientRes.data?.studio_features as Record<string, boolean> | null;
      if (sf?.landing_page_generator) setHasLandingPageCTA(true);
      setVerified(true);
    })();
  }, [user, authLoading, clientId]);

  if (authLoading || !verified) {
    return <OnboardingLoadingScreen />;
  }

  // ── Step 2 mandatory layout ────────────────────────────────────────────────
  if (hasLandingPageCTA) {
    return (
      <div className="relative min-h-screen bg-background">
        <StageHeader stage="ONBOARDING" />
        {/* Background layers */}
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 120%, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 60%)",
          }}
        />
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            background:
              "radial-gradient(ellipse at top, color-mix(in oklab, var(--color-primary) 10%, transparent), transparent 55%)",
          }}
        />
        <div className="pointer-events-none fixed left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[100px] animate-pulse-slow" />
        <div
          className="pointer-events-none fixed bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-primary/5 blur-[80px] animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        />

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
          <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto w-full">

            {/* Strategic Partnership Hero — Claude × Trivelta */}
            <div
              className="relative flex flex-col items-center gap-8 animate-fade-in"
              style={{ animationDelay: "20ms" }}
            >
              {/* Soft glow backdrop */}
              <div
                className="pointer-events-none absolute inset-0 -z-10 blur-3xl scale-150"
                style={{
                  background:
                    "radial-gradient(ellipse at center, color-mix(in oklab, var(--color-primary) 22%, transparent) 0%, color-mix(in oklab, #D97757 12%, transparent) 40%, transparent 70%)",
                }}
              />

              {/* Lockup */}
              <div className="relative flex items-center gap-6 md:gap-10">
                {/* Claude side */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div
                      className="h-20 w-20 md:h-24 md:w-24 rounded-2xl flex items-center justify-center ring-1 ring-white/10"
                      style={{
                        background: "linear-gradient(135deg, #D97757 0%, #C56B4A 100%)",
                        boxShadow: "0 20px 50px -10px rgba(217,119,87,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="h-10 w-10 md:h-12 md:w-12 text-white" fill="currentColor">
                        <path d="M12 2L13.09 8.26L22 9L13.09 10.74L12 22L10.91 10.74L2 9L10.91 8.26L12 2Z" />
                      </svg>
                    </div>
                    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-[#D97757]/40 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold tracking-tight">Claude</div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-[0.18em] mt-0.5">
                      by Anthropic
                    </div>
                  </div>
                </div>

                {/* Connection */}
                <div className="flex flex-col items-center gap-2">
                  <div className="h-px w-16 md:w-28 bg-gradient-to-r from-[#D97757]/60 via-foreground/30 to-primary/60" />
                  <div className="relative">
                    <div className="h-9 w-9 rounded-full border border-white/10 backdrop-blur-sm flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, color-mix(in oklab, #D97757 20%, transparent), color-mix(in oklab, var(--color-primary) 20%, transparent))",
                      }}
                    >
                      <div
                        className="h-2 w-2 rounded-full animate-pulse"
                        style={{ background: "linear-gradient(90deg, #D97757, var(--color-primary))" }}
                      />
                    </div>
                  </div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-[0.18em]">
                    Partnership
                  </div>
                </div>

                {/* Trivelta side */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div
                      className="h-20 w-20 md:h-24 md:w-24 rounded-2xl flex items-center justify-center ring-1 ring-white/10 p-3.5"
                      style={{
                        background:
                          "linear-gradient(135deg, color-mix(in oklab, var(--color-primary) 100%, transparent) 0%, color-mix(in oklab, var(--color-primary) 70%, transparent) 100%)",
                        boxShadow:
                          "0 20px 50px -10px color-mix(in oklab, var(--color-primary) 45%, transparent), inset 0 1px 0 rgba(255,255,255,0.15)",
                      }}
                    >
                      <img
                        src="/favicon.png"
                        alt="Trivelta"
                        className="h-full w-full object-contain"
                        draggable={false}
                      />
                    </div>
                    <div
                      className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-primary/40 animate-pulse"
                      style={{ animationDelay: "0.5s" }}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold tracking-tight">Trivelta</div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-[0.18em] mt-0.5">
                      iGaming Platform
                    </div>
                  </div>
                </div>
              </div>

              {/* Announcement */}
              <div className="text-center space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    Strategic Partnership
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                  World-class AI meets world-class iGaming.
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Trivelta has partnered with Anthropic — makers of Claude, the most trusted AI for
                  regulated industries — to bring you an exclusive AI Studio experience reserved for
                  Trivelta clients only.
                </p>
              </div>
            </div>

            {/* Premium AI Studio card */}
            <div
              className="w-full rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 relative overflow-hidden text-left animate-fade-in-up"
              style={{ animationDelay: "220ms" }}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl -translate-y-20 translate-x-20 pointer-events-none" />

              <div className="relative space-y-6">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Exclusive Access · Trivelta AI Studio
                  </span>
                </div>

                {/* Body */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">
                    You're about to enter Trivelta AI Studio.
                  </h3>

                  <p className="text-muted-foreground leading-relaxed">
                    Most operators spend weeks and thousands of dollars building their compliant landing pages,
                    terms of service, privacy policy, and responsible gambling resources. You're about to do it
                    in under 5 minutes.
                  </p>

                  <p className="text-muted-foreground leading-relaxed">
                    Our AI Studio is powered by{" "}
                    <span className="text-foreground font-medium">Anthropic's Claude</span> —
                    the same AI used by Fortune 500 companies for legal and compliance work. Every page is generated
                    specifically for your brand, your jurisdiction, and your market.
                  </p>

                  {/* What happens inside */}
                  <div className="rounded-xl bg-background/40 border border-border/40 p-4 space-y-2.5 mt-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      What happens inside
                    </div>
                    {[
                      { icon: Palette, text: "Upload your logo and pick your brand color" },
                      { icon: Sparkles, text: "AI generates your 4 pages with jurisdiction-specific legal copy" },
                      { icon: Eye, text: "Preview on desktop + mobile, regenerate until perfect" },
                      { icon: Download, text: "Download and hand off to your Trivelta team for deployment" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-3 text-sm">
                        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() =>
                    navigate({ to: "/onboarding/$clientId/studio", params: { clientId } })
                  }
                  className="group w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/30 active:translate-y-0"
                >
                  <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                  Enter Trivelta AI Studio
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>

                {/* Meta */}
                <div className="flex items-center justify-center gap-6 text-[11px] text-muted-foreground pt-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>~5 minutes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3 w-3" />
                    <span>Compliance-ready</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3 w-3" />
                    <span>Powered by Anthropic</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Secondary actions */}
            <div
              className="flex flex-col items-center gap-2 opacity-70 animate-fade-in-up"
              style={{ animationDelay: "380ms" }}
            >
              {pdfData && (
                <button
                  onClick={async () => {
                    try {
                      await downloadClientPDF(
                        {
                          name: pdfData.clientName,
                          primary_contact_email: pdfData.contactEmail,
                          submitted_at: pdfData.submittedAt,
                        },
                        pdfData.form,
                      );
                    } catch (err) {
                      console.error("[PDF] client generation failed:", err);
                      toast.error("Could not generate PDF. Please try again.");
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground/70 hover:text-foreground/70 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Submission Summary (PDF)
                </button>
              )}
              <p className="text-xs text-muted-foreground">
                You can return to Trivelta AI Studio anytime from your dashboard.
              </p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ── Original "You're all set" layout (no landing page feature) ─────────────
  const cards = [
    {
      icon: UserCircle,
      label: "Account review",
      desc: "Your AM checks everything you've submitted",
    },
    {
      icon: Settings2,
      label: "Platform setup",
      desc: "Technical team prepares your configuration",
    },
    {
      icon: Rocket,
      label: "Go live",
      desc: "Launch coordination with your team",
    },
  ];

  return (
    <div className="relative min-h-screen bg-background">
      <StageHeader stage="ONBOARDING" />
      {/* Background layers */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 120%, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top, color-mix(in oklab, var(--color-primary) 10%, transparent), transparent 55%)",
        }}
      />

      {/* Animated orbs */}
      <div className="pointer-events-none fixed left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[100px] animate-pulse-slow" />
      <div
        className="pointer-events-none fixed bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-primary/5 blur-[80px] animate-pulse-slow"
        style={{ animationDelay: "2s" }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl text-center">



          {/* Strategic partnership lockup */}
          <img
            src={partnershipLogo}
            alt="Claude × Trivelta — Strategic Partnership"
            className="mx-auto mb-8 h-16 md:h-20 w-auto select-none animate-fade-in"
            style={{ animationDelay: "80ms" }}
            draggable={false}
          />

          {/* Micro-label */}
          <div
            className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-success animate-fade-in"
            style={{ animationDelay: "120ms" }}
          >
            ONBOARDING · SUBMITTED
          </div>

          {/* Headline */}
          <h1
            className="mb-5 text-4xl md:text-[52px] font-bold leading-[1.05] tracking-tight text-foreground animate-fade-in-up"
            style={{ animationDelay: "180ms" }}
          >
            Thank you.
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
              You're all set.
            </span>
          </h1>

          <p
            className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-muted-foreground animate-fade-in-up"
            style={{ animationDelay: "260ms" }}
          >
            Your onboarding information is with the Trivelta team. Your Account Manager will reach
            out within one business day to walk through next steps.
          </p>

          {/* What happens next - 3 cards */}
          <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-3">
            {cards.map(({ icon: Icon, label, desc }, i) => (
              <div
                key={label}
                className="group rounded-xl border border-border/40 bg-card/30 p-5 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-card/50 animate-fade-in-up"
                style={{ animationDelay: `${i * 100 + 320}ms` }}
              >
                <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="mb-1 text-sm font-semibold text-foreground">{label}</div>
                <div className="text-xs leading-relaxed text-muted-foreground/80">{desc}</div>
              </div>
            ))}
          </div>

          {/* Reassurance callout */}
          <div
            className="mx-auto mb-10 flex max-w-xl items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 text-left animate-fade-in-up"
            style={{ animationDelay: "640ms" }}
          >
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-[13px] leading-relaxed text-foreground/90">
              <span className="font-semibold">Watch your inbox.</span>{" "}
              <span className="text-muted-foreground/90">
                We'll be in touch within 24 hours. If anything urgent comes up, reach your Account
                Manager directly.
              </span>
            </p>
          </div>

          {/* CTA */}
          <div
            className="flex flex-col items-center gap-3 animate-fade-in-up"
            style={{ animationDelay: "720ms" }}
          >
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-4 text-base font-semibold text-primary-foreground shadow-premium transition-all hover:-translate-y-0.5 hover:shadow-premium-hover active:translate-y-0"
            >
              Return to Dashboard
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            {pdfData && (
              <button
                onClick={async () => {
                  try {
                    await downloadClientPDF(
                      {
                        name: pdfData.clientName,
                        primary_contact_email: pdfData.contactEmail,
                        submitted_at: pdfData.submittedAt,
                      },
                      pdfData.form,
                    );
                  } catch (err) {
                    console.error("[PDF] client generation failed:", err);
                    toast.error("Could not generate PDF. Please try again.");
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-card/30 backdrop-blur-md px-4 py-2 text-xs font-medium text-foreground/80 hover:bg-card/50 hover:border-primary/30 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                Download Submission Summary (PDF)
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
