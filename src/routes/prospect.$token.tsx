import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TriveltaIcon } from "@/components/TriveltaIcon";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

export const Route = createFileRoute("/prospect/$token")({
  component: ProspectPage,
});

interface ProspectRow {
  id: string;
  legal_company_name: string;
  primary_contact_name: string | null;
  form_progress: number;
  token_expires_at: string;
}

type PageState = "loading" | "valid" | "expired" | "invalid";

function ProspectPage() {
  const { token } = useParams({ from: "/prospect/$token" });
  const [state, setState] = useState<PageState>("loading");
  const [prospect, setProspect] = useState<ProspectRow | null>(null);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    (async () => {
      const { data, error } = await db
        .from("prospects")
        .select("id, legal_company_name, primary_contact_name, form_progress, token_expires_at")
        .eq("access_token", token)
        .maybeSingle();

      if (error || !data) {
        setState("invalid");
        return;
      }

      if (new Date((data as ProspectRow & { token_expires_at: string }).token_expires_at) < new Date()) {
        setState("expired");
        return;
      }

      // Record access time (fire-and-forget)
      db.from("prospects")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", (data as ProspectRow).id)
        .then(() => {});

      setProspect(data as ProspectRow);
      setState("valid");
    })();
  }, [token]);

  if (state === "loading") {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-sm text-center">
          <TriveltaIcon className="h-10 w-10 mx-auto mb-4 opacity-40" />
          <h1 className="text-xl font-bold tracking-tight mb-2">Link expired</h1>
          <p className="text-sm text-muted-foreground">
            This pre-onboarding link has expired. Please contact your Trivelta Account Manager to
            receive a new link.
          </p>
        </div>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-sm text-center">
          <TriveltaIcon className="h-10 w-10 mx-auto mb-4 opacity-40" />
          <h1 className="text-xl font-bold tracking-tight mb-2">Link not found</h1>
          <p className="text-sm text-muted-foreground">
            This link is invalid or has already been used. Please contact your Trivelta Account
            Manager.
          </p>
        </div>
      </div>
    );
  }

  if (!prospect) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <header className="border-b border-border/40 backdrop-blur-md sticky top-0 z-10 bg-background/80">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TriveltaIcon className="h-7 w-7" />
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Trivelta · Pre-Onboarding
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {prospect.legal_company_name}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Progress: {prospect.form_progress}%
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-3">
            WELCOME TO TRIVELTA
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            {prospect.primary_contact_name
              ? `Hi ${prospect.primary_contact_name.split(" ")[0]}, let's get you set up`
              : "Let's get you set up"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Share what you know about your platform needs. You don't have to fill everything —
            answer what's clear now, skip what isn't. Your Account Manager will walk through the
            rest during onboarding.
          </p>
        </div>

        {/* Phase P2 placeholder */}
        <div className="rounded-xl border border-border/40 bg-card/30 p-8 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mb-2">
            Coming in Phase P2
          </div>
          <p className="text-sm text-muted-foreground">
            Pre-onboarding form sections will appear here.
          </p>
        </div>
      </main>
    </div>
  );
}
