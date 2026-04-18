import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { TriveltaNav } from "@/components/TriveltaNav";
import { PartnerLogos } from "@/components/PartnerLogos";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — Trivelta Onboarding Hub" },
      {
        name: "description",
        content:
          "Sign in to the Trivelta Onboarding Hub — the premium iGaming B2B turnkey platform.",
      },
      { property: "og:title", content: "Sign in — Trivelta Onboarding Hub" },
      {
        property: "og:description",
        content:
          "Sign in to the Trivelta Onboarding Hub — the premium iGaming B2B turnkey platform.",
      },
    ],
  }),
});

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    const redirectTo = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      <TriveltaNav
        homeHref="/login"
        right={
          <span className="hidden items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline-flex">
            <span className="text-primary">●</span> Onboarding Portal
          </span>
        }
      />

      {/* Hero */}
      <main className="relative flex-1 overflow-hidden">
        {/* Atmospheric orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="orb-1 absolute left-[5%] top-[8%] h-[560px] w-[560px] rounded-full bg-primary opacity-[0.09] blur-[130px]" />
          <div className="orb-2 absolute right-[5%] top-[18%] h-[460px] w-[460px] rounded-full bg-primary opacity-[0.07] blur-[130px]" />
        </div>

        <div className="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          {/* LEFT — headline */}
          <div className="flex flex-col">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 backdrop-blur-sm">
              <span className="text-primary">✦</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Premium iGaming · B2B Turnkey
              </span>
            </div>

            <h1 className="text-[44px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[58px] lg:text-[64px]">
              Welcome to Trivelta.
              <br />
              <span className="text-primary">Your platform is ready to be built.</span>
            </h1>

            <p className="mt-6 max-w-[540px] text-[18px] leading-relaxed text-muted-foreground">
              A fully customizable iGaming engine built to your exact specifications.
            </p>
            <p className="mt-3 max-w-[540px] text-[15px] leading-relaxed text-muted-foreground/85">
              Track contracts, branding, integrations, and go-live tasks — from kickoff to
              post-launch.
            </p>

            <div className="mt-9 flex flex-col items-start gap-3">
              <Button
                size="lg"
                onClick={() => {
                  document.getElementById("signin-card")?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  document.getElementById("signin-email")?.focus();
                }}
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
              <PartnerLogos label="Our Partners and Clients" />
            </div>
          </div>

          {/* RIGHT — sign-in card */}
          <div id="signin-card" className="flex flex-col">
            <div className="surface-card relative overflow-hidden p-8 shadow-2xl">
              <div
                className="pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-full bg-primary/15 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative">
                {sent ? (
                  <div className="text-center">
                    <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30">
                      <Mail className="h-7 w-7 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Check your inbox</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      A sign-in link was sent to{" "}
                      <span className="font-mono text-foreground">{email}</span>. Click it to
                      continue.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-5 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setSent(false);
                        setEmail("");
                      }}
                    >
                      Use a different email
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      Sign in
                    </div>
                    <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground">
                      Sign in to your onboarding portal
                    </h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      We'll email you a magic link. No password needed.
                    </p>

                    <form onSubmit={handleMagicLink} className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-sm text-foreground/85">
                          Work email
                        </Label>
                        <Input
                          id="signin-email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="btn-trivelta h-11 w-full"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                          </>
                        ) : (
                          <>
                            Send magic link <ArrowRight className="ml-1 h-4 w-4" />
                          </>
                        )}
                      </Button>
                      <p className="pt-1 text-center text-[12px] text-muted-foreground">
                        Access is limited to invited users.
                      </p>
                    </form>

                    <div className="mt-6 border-t border-border pt-5">
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        What you'll get inside
                      </div>
                      <ul className="mt-3 space-y-2 text-[13px] text-foreground/85">
                        {[
                          "Self-serve onboarding form",
                          "Live progress tracking",
                          "Direct line to your account manager",
                        ].map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-5 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        © 2026 Trivelta — Internal use only.
      </footer>
    </div>
  );
}
