import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TriveltaLogo } from "@/components/TriveltaLogo";
import { ProspectAccordionSection } from "@/components/prospect/ProspectAccordionSection";
import {
  PROSPECT_SECTIONS,
  calculateProspectProgress,
} from "@/lib/prospect-fields";

export const Route = createFileRoute("/prospect/$token")({
  component: ProspectPage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface ProspectData {
  id: string;
  legal_company_name: string;
  primary_contact_name: string | null;
  primary_contact_email: string;
  notion_page_id: string | null;
  form_progress: number;
  token_expires_at: string;
  submitted_at: string | null;
  company_details: Record<string, unknown>;
  payment_providers: Record<string, unknown>;
  kyc_compliance: Record<string, unknown>;
  marketing_stack: Record<string, unknown>;
  technical_requirements: Record<string, unknown>;
  optional_features: Record<string, unknown>;
}

type PageState = "loading" | "valid" | "expired" | "invalid";

/* ── Time-ago helper ────────────────────────────────────────────────────────── */

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

function ProspectPage() {
  const { token } = useParams({ from: "/prospect/$token" });
  const [state, setState] = useState<PageState>("loading");
  const [prospect, setProspect] = useState<ProspectData | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(
    PROSPECT_SECTIONS[0].id,
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Load ── */
  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    (async () => {
      const { data, error } = await db
        .from("prospects")
        .select(
          "id, legal_company_name, primary_contact_name, primary_contact_email, notion_page_id, form_progress, token_expires_at, submitted_at, company_details, payment_providers, kyc_compliance, marketing_stack, technical_requirements, optional_features",
        )
        .eq("access_token", token)
        .maybeSingle();

      if (error || !data) {
        setState("invalid");
        return;
      }

      if (new Date(data.token_expires_at as string) < new Date()) {
        setState("expired");
        return;
      }

      // Record access time (fire-and-forget)
      db.from("prospects")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", data.id)
        .then(() => {});

      setProspect({
        ...data,
        company_details: (data.company_details as Record<string, unknown>) ?? {},
        payment_providers: (data.payment_providers as Record<string, unknown>) ?? {},
        kyc_compliance: (data.kyc_compliance as Record<string, unknown>) ?? {},
        marketing_stack: (data.marketing_stack as Record<string, unknown>) ?? {},
        technical_requirements:
          (data.technical_requirements as Record<string, unknown>) ?? {},
        optional_features: (data.optional_features as Record<string, unknown>) ?? {},
      } as ProspectData);
      setState("valid");
    })();
  }, [token]);

  /* ── Field change + debounced save ── */
  const handleFieldChange = (storageKey: string, fieldKey: string, value: unknown) => {
    if (!prospect) return;

    const updated: ProspectData = {
      ...prospect,
      [storageKey]: {
        ...(prospect[storageKey as keyof ProspectData] as Record<string, unknown>),
        [fieldKey]: value,
      },
    };
    updated.form_progress = calculateProspectProgress(updated);
    setProspect(updated);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      const { error } = await db
        .from("prospects")
        .update({
          [storageKey]: updated[storageKey as keyof ProspectData],
          form_progress: updated.form_progress,
        })
        .eq("id", prospect.id)
        .eq("access_token", token);
      setSaving(false);
      if (!error) setSavedAt(new Date());
    }, 1500);
  };

  /* ── Submit + Notion sync ── */
  const handleSubmit = async () => {
    if (!prospect) return;
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const { error: updateError } = await db
        .from("prospects")
        .update({ submitted_at: now })
        .eq("id", prospect.id)
        .eq("access_token", token);
      if (updateError) throw updateError;

      // Trigger Notion sync (fire-and-forget with graceful failure)
      const { data, error: fnError } = await supabase.functions.invoke("prospect-submitted", {
        body: {
          client_prospect_id: prospect.id,
          submitted_by: "prospect",
          submitter_email: prospect.primary_contact_email,
        },
      });
      if (fnError) {
        console.error("[Prospect] Notion sync failed:", fnError);
        toast.warning("Submitted — Notion sync queued.");
      } else {
        toast.success("Sent to Trivelta team — we'll be in touch soon.");
      }

      setProspect({
        ...prospect,
        submitted_at: now,
        notion_page_id: (data as { notion_page_id?: string } | null)?.notion_page_id ?? prospect.notion_page_id,
      });
    } catch (err) {
      console.error("[Prospect] Submit failed:", err);
      toast.error("Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Error screens ── */
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
          <div className="flex justify-center mb-6 opacity-50">
            <TriveltaLogo size="sm" withSubtitle={false} />
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-2">Link expired</h1>
          <p className="text-sm text-muted-foreground">
            This pre-onboarding link has expired. Please contact your Trivelta Account
            Manager to receive a new link.
          </p>
        </div>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-sm text-center">
          <div className="flex justify-center mb-6 opacity-50">
            <TriveltaLogo size="sm" withSubtitle={false} />
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-2">Link not found</h1>
          <p className="text-sm text-muted-foreground">
            This link is invalid or has already been used. Please contact your Trivelta
            Account Manager.
          </p>
        </div>
      </div>
    );
  }

  if (!prospect) return null;

  const progress = prospect.form_progress;
  const submitted = !!prospect.submitted_at;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header — matches Trivelta Suite pattern */}
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          {/* Left: Logo + Suite pill + Pre-Onboarding pill */}
          <div className="flex items-center gap-3">
            <TriveltaLogo size="sm" withSubtitle={false} />
            <div className="h-4 w-px bg-border/60" />
            <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
              SUITE
            </span>
            <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70">
              PRE-ONBOARDING
            </span>
          </div>

          {/* Right: Client info + progress */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wide text-foreground">
                {prospect.legal_company_name || "Untitled Prospect"}
              </div>
              <div className="mt-0.5 text-[9px] text-muted-foreground/70">
                {prospect.primary_contact_name || prospect.primary_contact_email}
              </div>
            </div>
            {submitted && (
              <span className="rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[10px] font-semibold text-success">
                Submitted
              </span>
            )}
            <div className="h-4 w-px bg-border/60" />
            <div className="text-sm font-bold tabular-nums text-foreground">
              {progress}%
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-4 pt-8">
        <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
          {prospect.primary_contact_name
            ? `Hi ${prospect.primary_contact_name.split(" ")[0]}, let's build your foundation`
            : "Let's build your foundation"}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-foreground/75">
          Share what you know — skip what you don't. Your answers help our team prepare for
          your launch. Everything saves automatically.
        </p>
      </section>

      {/* Progress + save indicator */}
      <div className="mx-auto max-w-4xl px-6 pb-5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted/30">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-semibold tabular-nums">{progress}% complete</span>
          </div>
          <div className="text-muted-foreground">
            {saving ? "Saving…" : savedAt ? `Saved ${timeAgo(savedAt)}` : ""}
          </div>
        </div>
      </div>

      {/* Submission confirmation banner */}
      {submitted && (
        <div className="mx-auto max-w-4xl px-6 mb-6">
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-foreground">Your information was sent to Trivelta</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {timeAgo(prospect.submitted_at!)} · You can keep editing — re-submit to push updates.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accordion sections */}
      <div className="mx-auto max-w-4xl px-6 pb-28">
        {PROSPECT_SECTIONS.map((section) => (
          <ProspectAccordionSection
            key={section.id}
            section={section}
            values={
              (prospect[section.storageKey as keyof ProspectData] as Record<
                string,
                unknown
              >) ?? {}
            }
            onChange={(fieldKey, value) =>
              handleFieldChange(section.storageKey, fieldKey, value)
            }
            isOpen={openSection === section.id}
            onToggle={() =>
              setOpenSection(openSection === section.id ? null : section.id)
            }
          />
        ))}
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="text-xs text-foreground/70">
            {submitted
              ? `Submitted ${timeAgo(prospect.submitted_at!)}`
              : "Submit anytime — you can keep editing after."}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizonal className="h-4 w-4" />
            )}
            {submitted ? "Resubmit to Team" : "Send to Trivelta Team"}
          </button>
        </div>
      </div>
    </div>
  );
}
