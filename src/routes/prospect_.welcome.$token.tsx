import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  Clock,
  Info,
  Save,
  Sparkles,
} from "lucide-react";
import { TriveltaIcon } from "@/components/TriveltaIcon";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/prospect_/welcome/$token")({
  component: ProspectWelcome,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

function welcomeKey(token: string) {
  return `prospect-welcome-seen-${token}`;
}

function ProspectWelcome() {
  const { token } = useParams({ from: "/prospect_/welcome/$token" });
  const navigate = useNavigate();
  const [contactName, setContactName] = useState<string | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    document.title = "Trivelta · Pre-Onboarding";
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data } = await db
        .from("prospects")
        .select("primary_contact_name, token_expires_at")
        .eq("access_token", token)
        .maybeSingle();

      if (!data) {
        navigate({ to: "/prospect/$token", params: { token }, replace: true });
        return;
      }
      if (new Date(data.token_expires_at as string) < new Date()) {
        navigate({ to: "/prospect/$token", params: { token }, replace: true });
        return;
      }
      setContactName(data.primary_contact_name ?? null);
    })();
  }, [token, navigate]);

  const handleStart = () => {
    try {
      if (dontShowAgain) localStorage.setItem(welcomeKey(token), "1");
    } catch {
      /* ignore */
    }
    setLeaving(true);
    setTimeout(() => {
      navigate({ to: "/prospect/$token", params: { token } });
    }, 240);
  };

  const cards = [
    {
      icon: ClipboardList,
      label: "6 Sections",
      desc: "Company, payments, compliance, marketing, tech & more",
    },
    {
      icon: Clock,
      label: "5–10 Minutes",
      desc: "Answer at your own pace — no pressure",
    },
    {
      icon: Save,
      label: "Auto-Saves",
      desc: "Every change is saved instantly — pick up anytime",
    },
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

      {/* Animated orbs */}
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
              Trivelta · Pre-Onboarding
            </div>
          </div>

          {/* Hero icon */}
          <div
            className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 animate-fade-in"
            style={{ animationDelay: "80ms" }}
          >
            <Sparkles className="h-8 w-8 text-primary" />
          </div>

          {/* Personalized greeting */}
          {contactName && (
            <div
              className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary/80 animate-fade-in"
              style={{ animationDelay: "120ms" }}
            >
              Welcome, {contactName}
            </div>
          )}

          {/* Headline */}
          <h1
            className="mb-5 text-4xl md:text-[52px] font-bold leading-[1.05] tracking-tight text-foreground animate-fade-in-up"
            style={{ animationDelay: "180ms" }}
          >
            Tell us about
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
              your business
            </span>
          </h1>

          <p
            className="mx-auto mb-12 max-w-lg text-base leading-relaxed text-muted-foreground animate-fade-in-up"
            style={{ animationDelay: "260ms" }}
          >
            Complete this short form so our team can tailor your onboarding experience.
            Your answers shape everything — from integrations to compliance setup.
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
                <div className="text-[10px] leading-relaxed text-muted-foreground/70">{desc}</div>
              </div>
            ))}
          </div>

          {/* Reassurance callout */}
          <div
            className="mx-auto mb-10 flex max-w-md items-start gap-3 rounded-xl border border-border/30 bg-card/20 px-4 py-3 text-left backdrop-blur-md animate-fade-in-up"
            style={{ animationDelay: "660ms" }}
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
            <p className="text-[11px] leading-relaxed text-muted-foreground/70">
              Your information is shared only with your Trivelta Account Manager and is used
              exclusively to set up your platform.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handleStart}
            className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-4 text-base font-semibold text-primary-foreground shadow-premium transition-all hover:-translate-y-0.5 hover:shadow-premium-hover active:translate-y-0 animate-fade-in-up"
            style={{ animationDelay: "780ms" }}
          >
            Let's Get Started
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Don't show again */}
          <div className="mt-8 flex items-center justify-center">
            <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground/50 transition-colors hover:text-muted-foreground">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-border/50 bg-transparent accent-primary"
              />
              Don't show this again
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
