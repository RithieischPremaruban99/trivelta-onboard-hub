import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOnboardingCtx } from "@/lib/onboarding-context";
import { ArrowRight, Lock, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TriveltaNav } from "@/components/TriveltaNav";
import { PartnerLogos } from "@/components/PartnerLogos";

export const Route = createFileRoute("/onboarding/$clientId/")({
  component: WelcomeGate,
});

function initials(name: string | null | undefined) {
  if (!name) return "AM";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
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

  // Show spinner while: public data loading, auth resolving, or logged-in user
  // waiting for role check (prevents welcome gate flash before redirect fires)
  const stillResolving = loadingPublic || authLoading || (!!user && loadingAuth);
  if (stillResolving) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!welcomeInfo) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Onboarding not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This onboarding link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="route-fade-in relative flex min-h-screen flex-col">
      <TriveltaNav
        right={
          <span className="hidden items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline-flex">
            <span className="text-primary">●</span> Platform Onboarding
          </span>
        }
      />

      {/* Hero - two-column layout like trivelta.com */}
      <main className="relative flex-1 overflow-hidden">
        {/* Soft orbs for atmosphere */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="orb-1 absolute left-[5%] top-[10%] h-[520px] w-[520px] rounded-full bg-primary opacity-[0.08] blur-[120px]" />
          <div className="orb-2 absolute right-[5%] top-[20%] h-[420px] w-[420px] rounded-full bg-primary opacity-[0.06] blur-[120px]" />
        </div>

        <div className="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          {/* LEFT - headline + CTA */}
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 backdrop-blur-sm">
              <span className="text-primary">✦</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Premium iGaming · B2B Turnkey
              </span>
            </div>

            <h1 className="text-[44px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[60px] lg:text-[68px]">
              Welcome to Trivelta,
              <br />
              <span className="text-primary">{welcomeInfo.clientName}.</span>
            </h1>

            <p className="mt-6 max-w-[520px] text-[18px] leading-relaxed text-muted-foreground">
              Your premium iGaming B2B turnkey solution is ready to be built.
            </p>
            <p className="mt-3 max-w-[520px] text-[15px] leading-relaxed text-muted-foreground/85">
              We're excited to partner with you. Let's get your platform configured and live.
            </p>

            <div className="mt-10 flex flex-col items-start gap-3">
              <Button
                size="lg"
                onClick={() =>
                  navigate({ to: "/onboarding/$clientId/auth", params: { clientId } })
                }
                className="btn-trivelta h-12 px-8 text-[15px]"
              >
                Begin Onboarding <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Lock className="h-3 w-3" />
                Secure access · Invited users only
              </div>
            </div>

            <div className="mt-14">
              <PartnerLogos />
            </div>
          </div>

          {/* RIGHT - AM card */}
          <div className="flex flex-col justify-center">
            <div className="surface-card relative overflow-hidden p-7 shadow-2xl">
              {/* subtle inner glow */}
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative">
                {(() => {
                  const isMulti = welcomeInfo.amName?.includes(" & ");
                  const emails = welcomeInfo.amEmail?.split(",").map((e) => e.trim()).filter(Boolean) ?? [];
                  return (
                    <>
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        {isMulti ? "Your Account Managers" : "Your Account Manager"}
                      </div>
                      <div className="mt-5 flex items-start gap-4">
                        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary/15 font-semibold text-base text-primary ring-1 ring-primary/30">
                          {initials(welcomeInfo.amName)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[18px] font-semibold text-foreground">
                            {welcomeInfo.amName ?? "Account Manager"}
                          </div>
                          <div className="text-[13px] text-muted-foreground">
                            {isMulti ? "Account Managers" : "Account Manager"}
                          </div>
                        </div>
                      </div>
                      {emails.length > 0 && (
                        <div className="mt-5 flex flex-col gap-2">
                          {emails.map((email) => (
                            <a
                              key={email}
                              href={`mailto:${email}`}
                              className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3.5 py-2.5 font-mono text-[13px] text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              {email}
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}

                <div className="mt-6 border-t border-border pt-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    What we'll build together
                  </div>
                  <ul className="mt-3 space-y-2 text-[13px] text-foreground/85">
                    {[
                      "Branded sportsbook platform",
                      "Integrated PSPs, KYC & SMS",
                      "Live launch in weeks, not months",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        © {new Date().getFullYear()} Trivelta · iGaming B2B Turnkey
      </footer>
    </div>
  );
}
