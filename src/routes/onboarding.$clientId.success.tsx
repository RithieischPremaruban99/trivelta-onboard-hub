import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOnboardingCtx } from "@/lib/onboarding-context";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  Loader2,
  Palette,
  Smartphone,
  Zap,
  Mail,
} from "lucide-react";
import { TriveltaLogo } from "@/components/TriveltaLogo";

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
  if (!name) return "TM";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ─────────────────────── Animated counter ─────────────────────── */
function Counter({
  value,
  prefix = "",
  suffix = "",
  duration = 1600,
  start,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  start: boolean;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setN(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, value, duration]);

  const formatted =
    value >= 1_000_000
      ? (n / 1_000_000).toFixed(n >= value ? 0 : 1) + "M"
      : value >= 1_000
      ? Math.round(n).toLocaleString()
      : Math.round(n).toString();

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/* ─────────────────────── Page ─────────────────────── */
function SuccessScreen() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/success" });
  const { welcomeInfo, loadingPublic, loadingAuth, clientRole } = useOnboardingCtx();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);
  const [studioAccess, setStudioAccess] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = "Trivelta Studio · Live";
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
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

  // IntersectionObserver for stat counters
  useEffect(() => {
    if (!verified) return;
    const el = statsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setStatsVisible(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [verified]);

  if (authLoading || loadingPublic || loadingAuth || !verified || !welcomeInfo) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "#0A0F1E" }}>
        <Loader2 className="h-6 w-6 animate-spin text-white/70" />
      </div>
    );
  }

  const channel = slackName(welcomeInfo.clientName);
  const canEnterStudio = clientRole === "client_owner" && studioAccess;

  // Team members (AM is the only one we have — pad with placeholders if needed)
  const team = [
    welcomeInfo.amName || welcomeInfo.amEmail
      ? {
          name: welcomeInfo.amName ?? "Account Manager",
          role: "Account Manager",
          email: welcomeInfo.amEmail ?? null,
        }
      : null,
    {
      name: "Onboarding Team",
      role: "Platform Configuration",
      email: "onboarding@trivelta.com",
    },
    {
      name: "Tech Success",
      role: "Integrations & Launch",
      email: "tech@trivelta.com",
    },
  ].filter(Boolean) as { name: string; role: string; email: string | null }[];

  const heroWords = ["Your", "platform", "is", "being", "built."];

  return (
    <div className="launch-root relative min-h-screen overflow-x-hidden text-white">
      {/* Scoped styles */}
      <style>{`
        .launch-root { background: #0A0F1E; }
        .mesh { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .mesh::before, .mesh::after {
          content: ""; position: absolute; border-radius: 9999px; filter: blur(120px);
          opacity: 0.45; mix-blend-mode: screen;
        }
        .mesh::before {
          width: 720px; height: 720px; left: -10%; top: -15%;
          background: radial-gradient(circle, #14b8a6 0%, transparent 70%);
          animation: meshDrift1 22s ease-in-out infinite alternate;
        }
        .mesh::after {
          width: 640px; height: 640px; right: -8%; top: 20%;
          background: radial-gradient(circle, #10b981 0%, transparent 70%);
          animation: meshDrift2 28s ease-in-out infinite alternate;
        }
        .mesh-3 {
          position: absolute; width: 520px; height: 520px; left: 35%; bottom: -10%;
          border-radius: 9999px; filter: blur(120px); opacity: 0.30; mix-blend-mode: screen;
          background: radial-gradient(circle, #06b6d4 0%, transparent 70%);
          animation: meshDrift3 32s ease-in-out infinite alternate;
        }
        @keyframes meshDrift1 {
          0%   { transform: translate(0,0) scale(1); }
          100% { transform: translate(80px, 60px) scale(1.15); }
        }
        @keyframes meshDrift2 {
          0%   { transform: translate(0,0) scale(1); }
          100% { transform: translate(-100px, 40px) scale(1.1); }
        }
        @keyframes meshDrift3 {
          0%   { transform: translate(0,0) scale(1); }
          100% { transform: translate(60px,-80px) scale(1.2); }
        }
        @keyframes wordIn {
          0%   { opacity: 0; transform: translateY(28px); filter: blur(8px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes fadeUp {
          0%   { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes pulseDot {
          0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); }
          50%     { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
        }
        .logo-in { animation: fadeIn 0.6s ease-out 0.2s both; }
        .word    { display: inline-block; opacity: 0; animation: wordIn 0.65s cubic-bezier(.2,.7,.2,1) both; }
        .sub-in  { animation: fadeUp 0.7s ease-out 1.2s both; }
        .meta-in { animation: fadeUp 0.7s ease-out 1.6s both; }
        .scroll-in { animation: fadeIn 0.6s ease-out 2s both; }
        .live-dot { animation: pulseDot 2s ease-out infinite; }
        .hero-grad {
          background: linear-gradient(135deg, #5eead4 0%, #34d399 50%, #14b8a6 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .reveal { opacity: 0; transform: translateY(20px); transition: all 0.7s cubic-bezier(.2,.7,.2,1); }
        .reveal.in { opacity: 1; transform: translateY(0); }
        .feature-card {
          background: #131929;
          border: 1px solid rgba(255,255,255,0.06);
          border-left: 3px solid #14b8a6;
          transition: transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s, border-color .35s;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 60px -20px rgba(20,184,166,0.35);
          border-left-color: #5eead4;
        }
        .cta-btn {
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
          box-shadow: 0 20px 50px -12px rgba(20,184,166,0.55);
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 28px 70px -12px rgba(20,184,166,0.7); }
        .person-avatar {
          background: linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%);
        }
        .scroll-indicator {
          width: 22px; height: 36px; border: 1.5px solid rgba(255,255,255,0.3);
          border-radius: 12px; position: relative;
        }
        .scroll-indicator::after {
          content: ""; position: absolute; left: 50%; top: 6px;
          width: 3px; height: 8px; background: rgba(255,255,255,0.7); border-radius: 2px;
          transform: translateX(-50%);
          animation: scrollDot 1.6s ease-in-out infinite;
        }
        @keyframes scrollDot {
          0%   { transform: translate(-50%, 0); opacity: 1; }
          70%  { transform: translate(-50%, 12px); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 0; }
        }
      `}</style>

      {/* ──────── Top bar: Trivelta logo + LIVE indicator ──────── */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="logo-in">
          <TriveltaLogo size="md" product="Studio" />
        </div>
        <div className="logo-in flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 backdrop-blur-sm">
          <span className="live-dot h-2 w-2 rounded-full bg-emerald-400" />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/70">
            Live · {welcomeInfo.clientName}
          </span>
        </div>
      </header>

      {/* ─────────────────────── SECTION 1 — HERO ─────────────────────── */}
      <section className="relative flex min-h-[88vh] items-center justify-center px-6 pb-24 pt-8 sm:px-10">
        <div className="mesh">
          <div className="mesh-3" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
          <h1
            className="font-black tracking-tight text-white"
            style={{ fontSize: "clamp(44px, 9vw, 84px)", lineHeight: 1.05 }}
          >
            {heroWords.map((w, i) => (
              <span
                key={i}
                className="word mr-[0.22em]"
                style={{ animationDelay: `${0.8 + i * 0.12}s` }}
              >
                {w}
              </span>
            ))}
          </h1>

          <p className="sub-in mx-auto mt-8 text-2xl font-semibold sm:text-3xl">
            <span className="hero-grad">
              Trivelta Studio is live for {welcomeInfo.clientName}.
            </span>
          </p>

          <p className="meta-in mx-auto mt-5 max-w-xl text-base text-white/60">
            Your team has been notified. Configuration starts now.
          </p>

          <div className="scroll-in mt-20 flex flex-col items-center gap-3">
            <div className="scroll-indicator" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
              Scroll
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────── SECTION 2 — FEATURES ─────────────────────── */}
      <RevealSection className="relative px-6 py-24 sm:px-10" style={{ background: "#0D1424" }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
            What you just unlocked
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-white/55">
            A design surface built for operators who want their brand — not a template.
          </p>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Palette,
                title: "Your Brand, Your App",
                body: "Design your sportsbook from scratch. Colors, logo, typography — all yours. No templates. No limits.",
              },
              {
                icon: Zap,
                title: "Live Preview in Real Time",
                body: "See every change instantly on a live preview of your platform. What you design is exactly what your players see.",
              },
              {
                icon: Smartphone,
                title: "Mobile-First by Default",
                body: "Every design decision is optimized for mobile. Because that's where 87% of your players are.",
              },
            ].map((f, i) => (
              <RevealItem
                key={f.title}
                delay={i * 150}
                className="feature-card rounded-2xl p-7"
              >
                <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/30">
                  <f.icon className="h-5 w-5 text-teal-300" />
                </div>
                <div className="text-lg font-bold text-white">{f.title}</div>
                <p className="mt-2 text-[14px] leading-relaxed text-white/60">{f.body}</p>
              </RevealItem>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ─────────────────────── SECTION 3 — STATS ─────────────────────── */}
      <section
        ref={statsRef}
        className="relative border-y border-white/5 px-6 py-16 sm:px-10"
        style={{ background: "#0A0F1E" }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 md:grid-cols-4">
          {[
            { value: 2_000_000, prefix: "", suffix: "+", label: "Monthly Active Users" },
            { value: 750, prefix: "€", suffix: "M+", label: "Processed Volume" },
            { value: 370, prefix: "", suffix: "+", label: "Team Members" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-bold text-white sm:text-[40px]">
                <Counter
                  value={s.value}
                  prefix={s.prefix}
                  suffix={s.suffix}
                  start={statsVisible}
                />
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
                {s.label}
              </div>
            </div>
          ))}
          <div className="text-center">
            <div className="text-4xl font-bold text-white sm:text-[40px]">4–6 wks</div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Average Go-Live
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────── SECTION 4 — CTA ─────────────────────── */}
      <RevealSection className="relative px-6 py-28 sm:px-10" style={{ background: "#0D1424" }}>
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to build?</h2>

          {canEnterStudio ? (
            <button
              onClick={() =>
                navigate({
                  to: "/onboarding/$clientId/studio-intro",
                  params: { clientId },
                })
              }
              className="cta-btn group mt-8 inline-flex h-16 w-full items-center justify-center gap-3 rounded-2xl px-8 text-lg font-semibold text-white sm:w-[480px]"
            >
              Open Trivelta Studio
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <div className="mt-8 inline-flex h-16 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-8 text-base font-medium text-white/70 sm:w-[480px]">
              {clientRole === "client_owner"
                ? "Studio access is being prepared."
                : "Studio is available to the account owner."}
            </div>
          )}

          <p className="mt-5 text-sm text-white/50">Your dedicated team is standing by.</p>
        </div>
      </RevealSection>

      {/* ─────────────────────── SECTION 5 — TEAM ─────────────────────── */}
      <RevealSection className="relative px-6 pb-24 pt-16 sm:px-10" style={{ background: "#0A0F1E" }}>
        <div className="mx-auto max-w-5xl">
          <h3 className="text-xl font-bold text-white">Your dedicated team</h3>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {team.map((p, i) => (
              <RevealItem
                key={p.name + i}
                delay={i * 100}
                className="rounded-2xl border border-white/[0.06] bg-[#131929] p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="person-avatar grid h-12 w-12 place-items-center rounded-full text-sm font-bold text-white">
                    {initials(p.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold text-white">{p.name}</div>
                    <div className="truncate text-[12px] text-white/50">{p.role}</div>
                  </div>
                </div>
                {p.email && (
                  <a
                    href={`mailto:${p.email}`}
                    className="mt-4 inline-flex items-center gap-2 text-[13px] text-teal-300 hover:text-teal-200"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{p.email}</span>
                  </a>
                )}
              </RevealItem>
            ))}
          </div>

          {/* Utility links */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/45">
            <button
              onClick={() => {
                navigator.clipboard.writeText(channel);
              }}
              className="hover:text-white/80 transition-colors"
            >
              {channel} on Slack
            </button>
            {welcomeInfo.driveLink && (
              <a
                href={welcomeInfo.driveLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-white/80 transition-colors"
              >
                Upload brand assets <ArrowRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </RevealSection>
    </div>
  );
}

/* ─────────────────────── Reveal helpers (scroll-in) ─────────────────────── */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

function RevealSection({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { ref, shown } = useReveal<HTMLElement>();
  return (
    <section ref={ref} className={className} style={style}>
      <div className={`reveal ${shown ? "in" : ""}`}>{children}</div>
    </section>
  );
}

function RevealItem({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "in" : ""} ${className ?? ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
