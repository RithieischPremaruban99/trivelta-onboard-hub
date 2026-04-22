import { CheckCircle2, Loader2, SendHorizonal } from "lucide-react";
import { TriveltaLogo } from "@/components/TriveltaLogo";
import { ProspectAccordionSection } from "@/components/prospect/ProspectAccordionSection";
import { PROSPECT_SECTIONS } from "@/lib/prospect-fields";

/* ── Shared Types ──────────────────────────────────────────────────────────── */

export interface ProspectData {
  id: string;
  legal_company_name: string;
  primary_contact_name: string | null;
  primary_contact_email: string;
  notion_page_id: string | null;
  form_progress: number;
  token_expires_at?: string;
  submitted_at: string | null;
  company_details: Record<string, unknown>;
  payment_providers: Record<string, unknown>;
  kyc_compliance: Record<string, unknown>;
  marketing_stack: Record<string, unknown>;
  technical_requirements: Record<string, unknown>;
  optional_features: Record<string, unknown>;
}

/* ── Time-ago helper (shared between token and authenticated routes) ─────── */

export function timeAgo(date: Date | string): string {
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

/* ── Props ───────────────────────────────────────────────────────────────── */

interface ProspectFormContentProps {
  prospect: ProspectData;
  /** "token" = prospect themselves via magic link; "authenticated" = admin/AM */
  mode: "token" | "authenticated";
  saving: boolean;
  savedAt: Date | null;
  submitting: boolean;
  openSection: string | null;
  onSectionToggle: (sectionId: string | null) => void;
  onFieldChange: (storageKey: string, fieldKey: string, value: unknown) => void;
  onSubmit: () => void;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function ProspectFormContent({
  prospect,
  mode,
  saving,
  savedAt,
  submitting,
  openSection,
  onSectionToggle,
  onFieldChange,
  onSubmit,
}: ProspectFormContentProps) {
  const progress = prospect.form_progress;
  const submitted = !!prospect.submitted_at;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <TriveltaLogo size="sm" withSubtitle={false} />
            <div className="h-4 w-px bg-border/60" />
            <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
              Pre-Onboarding
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {prospect.legal_company_name}
              </div>
              {prospect.primary_contact_name && (
                <div className="mt-0.5 text-[10px] text-muted-foreground/80 font-medium">
                  {prospect.primary_contact_name}
                </div>
              )}
            </div>
            {mode === "authenticated" && (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                Admin Edit
              </span>
            )}
            {submitted && (
              <span className="rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[10px] font-semibold text-success">
                Submitted
              </span>
            )}
            <div className="text-xs font-bold tabular-nums text-foreground">{progress}%</div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-4 pt-8">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          PRE-ONBOARDING · {prospect.legal_company_name.toUpperCase()}
        </div>
        <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
          {prospect.primary_contact_name
            ? `Hi ${prospect.primary_contact_name.split(" ")[0]}, let's build your foundation`
            : "Let's build your foundation"}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-foreground/75">
          Share what you know — skip what you don't. Your answers help our team prepare for your
          launch. Everything saves automatically.
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
              <div className="font-semibold text-foreground">
                Information was sent to Trivelta
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {timeAgo(prospect.submitted_at!)} · You can keep editing — re-submit to push
                updates.
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
            onChange={(fieldKey, value) => onFieldChange(section.storageKey, fieldKey, value)}
            isOpen={openSection === section.id}
            onToggle={() => onSectionToggle(openSection === section.id ? null : section.id)}
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
            onClick={onSubmit}
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
