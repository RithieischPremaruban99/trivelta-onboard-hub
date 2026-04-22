import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ClipboardList, Save, Sparkles, Users } from "lucide-react";
import { Loader2 } from "lucide-react";
import { StageHeader } from "@/components/StageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useOnboardingCtx } from "@/lib/onboarding-context";

export const Route = createFileRoute("/onboarding/$clientId/welcome")({
  component: ClientWelcomePage,
});

function emailToFirstName(email: string): string {
  const local = email.split("@")[0];
  const name = local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return name.split(" ")[0];
}

function ClientWelcomePage() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/welcome" });
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { welcomeInfo, loadingPublic } = useOnboardingCtx();
  const [studioAccess, setStudioAccess] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    document.title = "Trivelta Hub · Welcome";
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/onboarding/$clientId/auth", params: { clientId }, replace: true });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("clients")
        .select("studio_access")
        .eq("id", clientId)
        .maybeSingle();
      if (!data) {
        navigate({ to: "/", replace: true });
        return;
      }
      setStudioAccess(data.studio_access ?? false);
      setClientReady(true);
    })();
  }, [authLoading, user, clientId, navigate]);

  const handleStart = () => {
    try {
      localStorage.setItem(`client-welcome-seen-${clientId}`, "1");
    } catch {
      /* silent */
    }
    setLeaving(true);
    setTimeout(() => {
      navigate({ to: "/onboarding/$clientId/form", params: { clientId }, replace: true });
    }, 240);
  };

  const handleLater = () => {
    navigate({ to: "/dashboard" });
  };

  if (authLoading || loadingPublic || !clientReady) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const firstName = user ? emailToFirstName(user.email ?? "") : "";

  const studioCard = studioAccess
    ? {
        icon: Sparkles,
        label: "Trivelta Studio",
        desc: "Design your brand, colors, logo yourself",
      }
    : {
        icon: Users,
        label: "Expert guidance",
        desc: "Your Account Manager walks you through setup",
      };

  const cards = [
    {
      icon: ClipboardList,
      label: "Pre-filled form",
      desc: "Your pre-onboarding answers are already there",
    },
    { icon: Save, label: "Auto-saves", desc: "Keep working - nothing gets lost" },
    studioCard,
  ];

  return (
    <div
      className={`relative min-h-screen bg-background transition-opacity duration-300 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
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
        <div className="w-full max-w-2xl text-center">
          {/* Hero icon */}
          <div
            className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 animate-fade-in"
            style={{ animationDelay: "80ms" }}
          >
            <Sparkles className="h-8 w-8 text-primary" />
          </div>

          {/* Personalized greeting */}
          {firstName && (
            <div
              className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary/80 animate-fade-in"
              style={{ animationDelay: "120ms" }}
            >
              Hi, {firstName}
            </div>
          )}

          {/* Headline */}
          <h1
            className="mb-5 text-4xl md:text-[52px] font-bold leading-[1.05] tracking-tight text-foreground animate-fade-in-up"
            style={{ animationDelay: "180ms" }}
          >
            Welcome aboard.
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
              Let's set up your platform.
            </span>
          </h1>

          <p
            className="mx-auto mb-12 max-w-lg text-base leading-relaxed text-muted-foreground animate-fade-in-up"
            style={{ animationDelay: "260ms" }}
          >
            Your contract is signed. We've already pre-filled the onboarding form with what you
            shared during pre-onboarding. Just review, fill in what's left, and you're live.
          </p>

          {/* Info cards */}
          <div className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {cards.map(({ icon: Icon, label, desc }, i) => (
              <div
                key={label}
                className="group rounded-xl border border-border/40 bg-card/30 p-4 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-card/50 animate-fade-in-up"
                style={{ animationDelay: `${i * 100 + 320}ms` }}
              >
                <div className="mx-auto mb-3 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="mb-1 text-xs font-semibold text-foreground">{label}</div>
                <div className="text-[10px] leading-relaxed text-muted-foreground/80">{desc}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleStart}
            className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-4 text-base font-semibold text-primary-foreground shadow-premium transition-all hover:-translate-y-0.5 hover:shadow-premium-hover active:translate-y-0 animate-fade-in-up"
            style={{ animationDelay: "640ms" }}
          >
            Start onboarding
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Skip link */}
          <div className="mt-6 animate-fade-in-up" style={{ animationDelay: "720ms" }}>
            <button
              onClick={handleLater}
              className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              I'll do this later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
