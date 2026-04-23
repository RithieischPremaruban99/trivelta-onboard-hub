import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Eye,
  MessageSquare,
  Palette,
  Sparkles,
} from "lucide-react";
import { TriveltaLogo } from "@/components/TriveltaLogo";
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
      /* localStorage unavailable - show intro */
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
      {/* ── Premium ambient background ─────────────────────────────────── */}
      {/* Deep base gradient */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 0%, color-mix(in oklab, var(--color-primary) 14%, transparent), transparent 70%), radial-gradient(ellipse 80% 50% at 50% 100%, color-mix(in oklab, var(--color-primary) 10%, transparent), transparent 65%)",
        }}
      />
      {/* Silver vignette wash */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          background:
            "linear-gradient(135deg, #f4f6fa 0%, transparent 25%, transparent 75%, #d3d8e0 100%)",
        }}
      />
      {/* Fine grain texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
      {/* Slow orbs */}
      <div className="pointer-events-none fixed left-[15%] top-[20%] h-[420px] w-[420px] rounded-full bg-primary/[0.08] blur-[120px] animate-pulse-slow" />
      <div
        className="pointer-events-none fixed bottom-[15%] right-[15%] h-[360px] w-[360px] rounded-full bg-primary/[0.05] blur-[100px] animate-pulse-slow"
        style={{ animationDelay: "2.5s" }}
      />

      {/* ── Brand corner (mirrors Suite landing) ───────────────────────── */}
      <div className="fixed left-5 top-4 z-50 sm:left-8">
        <TriveltaLogo size="xl" withSubtitle product="Studio" brandSuffix="AI" poweredBy />
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-3xl text-center">
          {/* Eyebrow / personalization */}
          {welcomeInfo?.clientName && (
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/40 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80 backdrop-blur-md animate-fade-in"
              style={{ animationDelay: "120ms" }}
            >
              <span className="h-1 w-1 rounded-full bg-primary" />
              Welcome, {welcomeInfo.clientName}
            </div>
          )}

          {/* Headline — premium silver gradient on accent line */}
          <h1
            className="mb-6 text-[44px] md:text-[64px] font-semibold leading-[1.02] tracking-[-0.02em] text-foreground animate-fade-in-up"
            style={{ animationDelay: "180ms" }}
          >
            Build your brand,
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #f4f6fa 0%, #d3d8e0 25%, #aab1bd 50%, #e8ecf2 75%, #b8bfca 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              powered by AI.
            </span>
          </h1>

          <p
            className="mx-auto mb-14 max-w-xl text-[15px] md:text-base leading-relaxed text-muted-foreground/80 animate-fade-in-up"
            style={{ animationDelay: "260ms" }}
          >
            The complete design system for your iGaming platform — generated by AI,
            refined by you, delivered production-ready.
          </p>

          {/* Feature grid — premium glass cards */}
          <div className="mb-14 grid grid-cols-2 md:grid-cols-4 gap-3">
            {features.map(({ icon: Icon, label, desc }, i) => (
              <div
                key={label}
                className="group relative overflow-hidden rounded-2xl border border-border/30 bg-card/20 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-border/60 hover:bg-card/40 animate-fade-in-up"
                style={{
                  animationDelay: `${i * 100 + 320}ms`,
                  boxShadow:
                    "inset 0 1px 0 0 rgba(255,255,255,0.04), 0 1px 2px 0 rgba(0,0,0,0.2)",
                }}
              >
                {/* Subtle top sheen */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                  }}
                />
                <div
                  className="mx-auto mb-3.5 grid h-10 w-10 place-items-center rounded-xl border border-border/40 bg-gradient-to-br from-primary/15 to-primary/5 transition-all group-hover:scale-105 group-hover:border-primary/40"
                  style={{
                    boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.06)",
                  }}
                >
                  <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />
                </div>
                <div className="mb-1 text-[12px] font-semibold tracking-tight text-foreground">
                  {label}
                </div>
                <div className="text-[10.5px] leading-relaxed text-muted-foreground/65">
                  {desc}
                </div>
              </div>
            ))}
          </div>

          {/* CTA — premium dark pill with silver inner edge */}
          <button
            onClick={handleEnterStudio}
            className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-primary px-8 py-4 text-[15px] font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 animate-fade-in-up"
            style={{
              animationDelay: "780ms",
              boxShadow:
                "0 1px 0 0 rgba(255,255,255,0.12) inset, 0 0 0 1px color-mix(in oklab, var(--color-primary) 60%, transparent), 0 10px 30px -8px color-mix(in oklab, var(--color-primary) 50%, transparent), 0 20px 60px -20px color-mix(in oklab, var(--color-primary) 40%, transparent)",
            }}
          >
            {/* Sheen sweep on hover */}
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            />
            <span className="relative">Enter Studio</span>
            <ArrowRight
              className="relative h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1"
              strokeWidth={2.25}
            />
          </button>

          {/* Skip checkbox */}
          <div className="mt-10 flex items-center justify-center">
            <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] tracking-wide text-muted-foreground/40 transition-colors hover:text-muted-foreground/80">
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

      {/* ── Bottom hairline — Rolls-Royce brand bar ───────────────────── */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(220,224,232,0.25) 20%, rgba(220,224,232,0.5) 50%, rgba(220,224,232,0.25) 80%, transparent 100%)",
        }}
      />
    </div>
  );
}
