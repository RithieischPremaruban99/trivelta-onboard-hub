import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — Trivelta Onboarding Hub" },
      {
        name: "description",
        content: "Sign in with your work email to access Trivelta Onboarding Hub.",
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
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-border bg-card/40">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/15 ring-1 ring-primary/30 grid place-items-center">
            <span className="font-mono text-sm text-primary">T</span>
          </div>
          <div>
            <div className="text-sm font-semibold">Trivelta</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Onboarding Hub
            </div>
          </div>
        </div>
        <div className="space-y-6 max-w-md">
          <h1 className="text-4xl font-semibold leading-tight">
            One source of truth for every client launch.
          </h1>
          <p className="text-muted-foreground">
            Track contracts, branding, integrations, and go-live tasks across all your iGaming
            clients — from kickoff to post-launch.
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {[
              "6-phase SOP per client",
              "Self-serve onboarding form",
              "Account manager dashboards",
              "Admin oversight & assignment",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Trivelta — internal use only.
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="surface-card w-full max-w-md p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We'll email you a magic link. No passwords.
            </p>
          </div>

          {sent ? (
            <div className="rounded-md border border-border bg-accent/40 p-6 text-center">
              <Mail className="mx-auto h-8 w-8 text-primary" />
              <h3 className="mt-3 text-sm font-medium">Check your inbox</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                A sign-in link was sent to{" "}
                <span className="font-mono text-foreground">{email}</span>. Click it to continue.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" /> Send magic link
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Access is limited to invited users. Contact your admin if you need an account.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
