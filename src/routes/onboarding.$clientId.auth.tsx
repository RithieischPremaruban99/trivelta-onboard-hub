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
import { TriveltaNav } from "@/components/TriveltaNav";

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
        emailRedirectTo: `${
          typeof window !== "undefined" ? window.location.origin : ""
        }/onboarding/${clientId}/form`,
      },
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <TriveltaNav
        right={
          welcomeInfo && (
            <div className="hidden text-right sm:block">
              <div className="text-[13px] font-semibold text-foreground">
                {welcomeInfo.clientName}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                Onboarding
              </div>
            </div>
          )
        }
      />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="orb-1 absolute left-[15%] top-[20%] h-[420px] w-[420px] rounded-full bg-primary opacity-[0.06] blur-[120px]" />
          <div className="orb-2 absolute right-[10%] bottom-[15%] h-[380px] w-[380px] rounded-full bg-primary opacity-[0.05] blur-[120px]" />
        </div>

        <div className="surface-card relative z-10 w-full max-w-[440px] p-8 shadow-2xl">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Check your inbox</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                A magic link was sent to{" "}
                <span className="font-mono text-foreground">{email}</span>. Click it to continue.
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
              <div className="mb-6">
                <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
                  Sign in to continue your onboarding
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  We'll send a secure magic link to your email. No password needed.
                </p>
              </div>
              <form onSubmit={handleSend} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-foreground/85">
                    Email address
                  </Label>
                  <Input
                    id="email"
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
                  disabled={sending}
                  className="btn-trivelta h-11 w-full"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      Send Magic Link <ArrowRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-center text-[12px] text-muted-foreground">
                  Enter any email to receive a magic link. The form owner can submit; all
                  other signers can fill in fields.
                </p>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
