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

        <div
          className="relative mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-[1200px] items-center px-6 py-16 lg:px-12"
        >
          <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* LEFT — headline */}
            <div className="flex w-full max-w-[520px] flex-col">
              <h1
                className="font-bold tracking-tight text-white"
                style={{ fontSize: "52px", lineHeight: 1.1, fontWeight: 700 }}
              >
                Welcome to Trivelta.
                <br />
                <span style={{ color: "#2563eb" }}>
                  Your platform is ready to be built.
                </span>
              </h1>

              <p
                className="mt-5 text-[16px] font-normal"
                style={{ color: "#8896ab", marginTop: "20px" }}
              >
                A fully customizable iGaming engine built to your exact specifications.
              </p>
              <p
                className="text-[14px] font-normal leading-relaxed"
                style={{ color: "#6b7280", marginTop: "12px" }}
              >
                Track contracts, branding, integrations, and go-live tasks — from kickoff to
                post-launch.
              </p>

              <div style={{ marginTop: "32px" }}>
                <Button
                  onClick={() => {
                    document.getElementById("signin-card")?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                    document.getElementById("signin-email")?.focus();
                  }}
                  className="btn-trivelta inline-flex items-center"
                  style={{
                    height: "48px",
                    padding: "0 28px",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  Begin Onboarding <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
                <div
                  className="flex items-center gap-1.5 text-[13px]"
                  style={{ color: "#6b7280", marginTop: "12px" }}
                >
                  <Lock className="h-3 w-3" />
                  Secure access · Invited users only
                </div>
              </div>

              <div
                style={{
                  marginTop: "40px",
                  paddingTop: "24px",
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <PartnerLogos label="Our Partners and Clients" />
              </div>
            </div>

            {/* RIGHT — sign-in card */}
            <div className="flex w-full justify-center lg:justify-end">
              <div
                id="signin-card"
                className="surface-card relative w-full overflow-hidden shadow-2xl"
                style={{ maxWidth: "460px", padding: "32px", borderRadius: "12px" }}
              >
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
                      <h2 className="text-lg font-semibold text-white">Check your inbox</h2>
                      <p className="mt-2 text-sm" style={{ color: "#8896ab" }}>
                        A sign-in link was sent to{" "}
                        <span className="font-mono text-white">{email}</span>. Click it to
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
                      <div
                        className="text-[11px] font-semibold uppercase"
                        style={{ color: "#6b7280", letterSpacing: "1.5px" }}
                      >
                        Sign in
                      </div>
                      <h2
                        className="text-white"
                        style={{
                          fontSize: "22px",
                          fontWeight: 600,
                          marginTop: "8px",
                          lineHeight: 1.25,
                        }}
                      >
                        Sign in to your onboarding portal
                      </h2>
                      <p
                        className="text-[14px]"
                        style={{ color: "#8896ab", marginTop: "6px" }}
                      >
                        We'll email you a magic link. No password needed.
                      </p>

                      <form onSubmit={handleMagicLink}>
                        <Label
                          htmlFor="signin-email"
                          className="block text-[13px] font-medium"
                          style={{ color: "#9ca3af", marginTop: "20px" }}
                        >
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
                          className="mt-2 w-full text-white placeholder:text-[#5b6478]"
                          style={{
                            height: "48px",
                            backgroundColor: "#1a2234",
                            border: "1px solid #1f2d45",
                            borderRadius: "8px",
                            padding: "0 16px",
                            fontSize: "14px",
                          }}
                        />
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="btn-trivelta w-full"
                          style={{
                            height: "48px",
                            backgroundColor: "#2563eb",
                            borderRadius: "8px",
                            marginTop: "12px",
                            fontSize: "16px",
                            fontWeight: 600,
                          }}
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
                        <p
                          className="text-center text-[12px]"
                          style={{ color: "#6b7280", marginTop: "12px" }}
                        >
                          Access is limited to invited users.
                        </p>
                      </form>

                      <div
                        style={{
                          marginTop: "24px",
                          paddingTop: "20px",
                          borderTop: "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        <div
                          className="text-[11px] font-semibold uppercase"
                          style={{ color: "#6b7280", letterSpacing: "1.5px" }}
                        >
                          What you'll get inside
                        </div>
                        <ul className="mt-3 flex flex-col gap-[10px]">
                          {[
                            "Self-serve onboarding form",
                            "Live progress tracking",
                            "Direct line to your account manager",
                          ].map((item) => (
                            <li
                              key={item}
                              className="flex items-center gap-2 text-[14px]"
                              style={{ color: "#9ca3af" }}
                            >
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
        </div>
      </main>

      <footer className="border-t border-border px-6 py-5 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        © 2026 Trivelta — Internal use only.
      </footer>
    </div>
  );
}
