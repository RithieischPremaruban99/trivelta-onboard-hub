import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOnboardingCtx } from "@/lib/onboarding-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding/$clientId/auth")({
  component: AuthScreen,
});

function AuthScreen() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/auth" });
  const { welcomeInfo, clientRole, loadingAuth } = useOnboardingCtx();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Already authenticated member → go to form
  useEffect(() => {
    if (authLoading || loadingAuth) return;
    if (user && clientRole) {
      navigate({ to: "/onboarding/$clientId/form", params: { clientId }, replace: true });
    }
  }, [user, clientRole, authLoading, loadingAuth]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/onboarding/${clientId}/form`,
      },
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#0a0d14]">
      {/* Left: dimmed/blurred welcome background */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="orb-1 absolute left-[10%] top-[15%] h-[600px] w-[600px] rounded-full bg-[#3b82f6] opacity-[0.06] blur-[100px]" />
          <div className="orb-2 absolute right-[5%] top-[8%] h-[450px] w-[450px] rounded-full bg-[#06b6d4] opacity-[0.05] blur-[120px]" />
          <div className="orb-3 absolute bottom-[10%] left-[25%] h-[400px] w-[400px] rounded-full bg-[#6366f1] opacity-[0.04] blur-[110px]" />
        </div>
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#3b82f6]/15 ring-1 ring-[#3b82f6]/30">
              <span className="font-mono text-sm font-bold text-[#3b82f6]">T</span>
            </div>
            <div>
              <div className="text-sm font-bold tracking-widest text-[#f9fafb]">TRIVELTA</div>
              <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#9ca3af]">Onboarding Hub</div>
            </div>
          </div>
          <div className="max-w-sm">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1f2937] bg-[#111827]/60 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-[#9ca3af]">
              <span className="text-[#3b82f6]">✦</span> Platform Onboarding
            </div>
            {welcomeInfo && (
              <>
                <h2 className="text-3xl font-semibold leading-tight text-[#f9fafb]">
                  Welcome to Trivelta,
                  <br />
                  <span className="text-[#3b82f6]">{welcomeInfo.clientName}.</span>
                </h2>
                <p className="mt-4 text-[15px] text-[#9ca3af] leading-relaxed">
                  Your premium iGaming B2B turnkey solution. Built for your market, live in weeks.
                </p>
              </>
            )}
          </div>
          <div className="text-[11px] text-[#4b5563]">© {new Date().getFullYear()} Trivelta — Invited users only</div>
        </div>
      </div>

      {/* Right: auth card */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[420px] rounded-2xl border border-[#1f2937] bg-[#111827] p-8 shadow-2xl">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#3b82f6]/15 ring-1 ring-[#3b82f6]/30">
              <span className="font-mono text-xs font-bold text-[#3b82f6]">T</span>
            </div>
            <div className="text-sm font-bold tracking-widest text-[#f9fafb]">TRIVELTA</div>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#3b82f6]/15">
                <Mail className="h-7 w-7 text-[#3b82f6]" />
              </div>
              <h3 className="text-lg font-semibold text-[#f9fafb]">Check your inbox</h3>
              <p className="mt-2 text-sm text-[#9ca3af]">
                A magic link was sent to{" "}
                <span className="font-mono text-[#f9fafb]">{email}</span>
                . Click it to continue.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-5 text-[#9ca3af] hover:text-[#f9fafb]"
                onClick={() => { setSent(false); setEmail(""); }}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-[#f9fafb]">Sign in to continue</h2>
                <p className="mt-1.5 text-sm text-[#9ca3af]">
                  We'll send a secure magic link to your email. No password needed.
                </p>
              </div>
              <form onSubmit={handleSend} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-[#d1d5db]">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 border-[#1f2937] bg-[#0a0d14] text-[#f9fafb] placeholder:text-[#4b5563] focus-visible:ring-[#3b82f6]"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={sending}
                  className="h-11 w-full rounded-xl bg-[#3b82f6] text-white hover:bg-[#2563eb]"
                >
                  {sending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                  ) : (
                    <>Send Magic Link <ArrowRight className="ml-1 h-4 w-4" /></>
                  )}
                </Button>
                <p className="text-center text-[12px] text-[#6b7280]">
                  Access is limited to invited team members. Contact your Account Manager if you need access.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
