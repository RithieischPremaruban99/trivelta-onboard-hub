import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Eye,
  MessageSquare,
  Palette,
  Sparkles,
} from "lucide-react";
import { TriveltaIcon } from "@/components/TriveltaIcon";
import { useOnboardingCtx } from "@/lib/onboarding-context";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/onboarding/$clientId/studio-intro")({
  component: StudioIntro,
});

function skipKey(clientId: string) {
  return `studio-skip-intro-${clientId}`;
}

function StudioIntro() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/studio-intro" });
  const navigate = useNavigate();
  const { welcomeInfo } = useOnboardingCtx();
  const { user, loading: authLoading } = useAuth();
  const [skipNextTime, setSkipNextTime] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Auth guard + auto-skip if previously opted out
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/onboarding/$clientId/auth", params: { clientId }, replace: true });
      return;
    }
    try {
      if (localStorage.getItem(skipKey(clientId)) === "true") {
        sessionStorage.setItem(`studio-from-intro-${clientId}`, "true");
        navigate({
          to: "/onboarding/$clientId/studio",
          params: { clientId },
          replace: true,
        });
      }
    } catch {
      /* localStorage unavailable — show intro */
    }
  }, [authLoading, user, clientId, navigate]);

  useEffect(() => {
    document.title = "Trivelta Studio · Welcome";
  }, []);

  const handleEnterStudio = () => {
    try {
      if (skipNextTime) localStorage.setItem(skipKey(clientId), "true");
      else localStorage.removeItem(skipKey(clientId));
      sessionStorage.setItem(`studio-from-intro-${clientId}`, "true");
    } catch {
      /* ignore */
    }
    setLeaving(true);
    setTimeout(() => {
      navigate({
        to: "/onboarding/$clientId/studio",
        params: { clientId },
      });
    }, 240);
  };

  const features = [
    { icon: MessageSquare, label: "AI Chat", desc: "Describe your brand in plain English" },
    { icon: Palette, label: "344 Colors", desc: "Every detail, semantically aware" },
    { icon: Sparkles, label: "Logo Studio", desc: "3 unique variants per request" },
    { icon: Eye, label: "Live Preview", desc: "See your platform instantly" },
  ];

  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-background transition-opacity duration-300 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
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

      {/* Subtle animated orbs */}
      <div className="pointer-events-none fixed left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[100px] animate-pulse-slow" />
      <div
        className="pointer-events-none fixed bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-primary/5 blur-[80px] animate-pulse-slow"
        style={{ animationDelay: "2s" }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl text-center">
          {/* Branding stamp */}
          <div className="mb-10 flex items-center justify-center gap-3 animate-fade-in">
            <TriveltaIcon className="h-8 w-8" />
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/70">
              Trivelta · Studio
            </div>
          </div>

          {/* Welcome personalization */}
          {welcomeInfo?.clientName && (
            <div
              className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary/80 animate-fade-in"
              style={{ animationDelay: "120ms" }}
            >
              Welcome, {welcomeInfo.clientName}
            </div>
          )}

          {/* Headline */}
          <h1
            className="mb-5 text-4xl md:text-[52px] font-bold leading-[1.05] tracking-tight text-foreground animate-fade-in-up"
            style={{ animationDelay: "180ms" }}
          >
            Build your brand,
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
              powered by AI
            </span>
          </h1>

          <p
            className="mx-auto mb-12 max-w-lg text-base leading-relaxed text-muted-foreground animate-fade-in-up"
            style={{ animationDelay: "260ms" }}
          >
            The complete design system for your iGaming platform — generated by AI, refined by
            you, delivered production-ready.
          </p>

          {/* Feature grid */}
          <div className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-3">
            {features.map(({ icon: Icon, label, desc }, i) => (
              <div
                key={label}
                className="group rounded-xl border border-border/40 bg-card/30 p-4 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-card/50 animate-fade-in-up"
                style={{ animationDelay: `${i * 100 + 320}ms` }}
              >
                <div className="mx-auto mb-3 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="mb-1 text-xs font-semibold text-foreground">{label}</div>
                <div className="text-[10px] leading-relaxed text-muted-foreground/70">{desc}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleEnterStudio}
            className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-4 text-base font-semibold text-primary-foreground shadow-premium transition-all hover:-translate-y-0.5 hover:shadow-premium-hover active:translate-y-0 animate-fade-in-up"
            style={{ animationDelay: "780ms" }}
          >
            Enter Studio
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Skip checkbox */}
          <div className="mt-8 flex items-center justify-center">
            <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground/50 transition-colors hover:text-muted-foreground">
              <input
                type="checkbox"
                checked={skipNextTime}
                onChange={(e) => setSkipNextTime(e.target.checked)}
                className="rounded border-border/50 bg-transparent accent-primary"
              />
              Skip this intro next time
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
