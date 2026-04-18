import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOnboardingCtx } from "@/lib/onboarding-context";
import { ArrowRight, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/onboarding/$clientId/")({
  component: WelcomeGate,
});

function initials(name: string | null | undefined) {
  if (!name) return "AM";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function WelcomeGate() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/" });
  const { welcomeInfo, clientRole, loadingPublic, loadingAuth } = useOnboardingCtx();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || loadingAuth) return;
    if (user && clientRole) {
      navigate({ to: "/onboarding/$clientId/form", params: { clientId }, replace: true });
    }
  }, [user, clientRole, authLoading, loadingAuth]);

  if (loadingPublic) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0a0d14]">
        <Loader2 className="h-6 w-6 animate-spin text-[#3b82f6]" />
      </div>
    );
  }

  if (!welcomeInfo) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0a0d14] px-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-[#f9fafb]">Onboarding not found</h1>
          <p className="mt-2 text-sm text-[#9ca3af]">This onboarding link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a0d14]">
      {/* Animated orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="orb-1 absolute left-[10%] top-[15%] h-[600px] w-[600px] rounded-full bg-[#3b82f6] opacity-[0.07] blur-[100px]" />
        <div className="orb-2 absolute right-[5%] top-[8%] h-[450px] w-[450px] rounded-full bg-[#06b6d4] opacity-[0.06] blur-[120px]" />
        <div className="orb-3 absolute bottom-[10%] left-[25%] h-[400px] w-[400px] rounded-full bg-[#6366f1] opacity-[0.05] blur-[110px]" />
      </div>

      {/* Logo */}
      <header className="relative z-10 px-8 pt-8">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#3b82f6]/15 ring-1 ring-[#3b82f6]/30">
            <span className="font-mono text-sm font-bold text-[#3b82f6]">T</span>
          </div>
          <div>
            <div className="text-sm font-bold tracking-widest text-[#f9fafb]">TRIVELTA</div>
            <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#9ca3af]">Onboarding Hub</div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#1f2937] bg-[#111827]/60 px-4 py-1.5 backdrop-blur-sm">
          <span className="text-[#3b82f6]">✦</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#9ca3af]">Platform Onboarding</span>
        </div>

        {/* Heading */}
        <h1 className="max-w-[680px] text-[44px] font-semibold leading-[1.12] tracking-tight text-[#f9fafb] sm:text-[56px]">
          Welcome to Trivelta,
          <br />
          <span className="text-[#3b82f6]">{welcomeInfo.clientName}.</span>
        </h1>

        {/* Sub */}
        <p className="mt-6 max-w-[500px] text-[18px] leading-relaxed text-[#9ca3af]">
          Your premium iGaming B2B turnkey solution.
          <br className="hidden sm:block" />
          Built for your market, live in weeks.
        </p>

        {/* Body */}
        <p className="mt-4 max-w-[460px] text-[14px] leading-relaxed text-[#6b7280]">
          We're excited to partner with you. This onboarding form captures everything we need to build and launch your platform. It takes approximately 15 minutes to complete.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={() => navigate({ to: "/onboarding/$clientId/auth", params: { clientId } })}
            className="h-12 w-full max-w-[320px] rounded-xl bg-[#3b82f6] px-8 text-base font-medium text-white shadow-lg shadow-[#3b82f6]/20 transition-all duration-200 hover:bg-[#2563eb] hover:shadow-[#3b82f6]/30"
          >
            Begin Onboarding <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1.5 text-[12px] text-[#6b7280]">
            <Lock className="h-3 w-3" />
            Secure access · Invited users only
          </div>
        </div>
      </main>

      {/* AM footer */}
      {(welcomeInfo.amName || welcomeInfo.amEmail) && (
        <footer className="relative z-10 border-t border-[#1f2937] px-8 py-5">
          <div className="mx-auto flex max-w-[520px] items-center gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#3b82f6]/15 font-semibold text-sm text-[#3b82f6] ring-1 ring-[#3b82f6]/30">
              {initials(welcomeInfo.amName)}
            </div>
            <div>
              <div className="mb-0.5 font-mono text-[10px] uppercase tracking-wider text-[#6b7280]">Your Account Manager</div>
              <div className="text-sm font-medium text-[#f9fafb]">{welcomeInfo.amName ?? "Account Manager"}</div>
              {welcomeInfo.amEmail && (
                <div className="font-mono text-[12px] text-[#9ca3af]">{welcomeInfo.amEmail}</div>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
