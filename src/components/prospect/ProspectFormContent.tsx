import { useState } from "react";
import {
  CheckCircle2,
  Download,
  Edit3,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  SendHorizonal,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { StageHeader } from "@/components/StageHeader";
import { ProspectAccordionSection } from "@/components/prospect/ProspectAccordionSection";
import { PROSPECT_SECTIONS } from "@/lib/prospect-fields";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  update_requested_at: string | null;
  update_request_reason: string | null;
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

/* ── Success Screen (shown when form is locked after submit) ─────────────── */

function ProspectSuccessState({
  prospect,
  onRequestUpdate,
  onDownloadPDF,
  downloading,
}: {
  prospect: ProspectData;
  onRequestUpdate: () => void;
  onDownloadPDF: () => void;
  downloading: boolean;
}) {
  const cards = [
    {
      icon: UserCircle,
      label: "AM Review",
      desc: "Your Account Manager reviews what you shared",
    },
    {
      icon: Phone,
      label: "Onboarding Call",
      desc: "They reach out to schedule next steps",
    },
    {
      icon: FileText,
      label: "Contract",
      desc: "Finalize terms and move to full onboarding",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background gradients */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 120%, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top, color-mix(in oklab, var(--color-primary) 10%, transparent), transparent 55%)",
        }}
      />
      <div className="pointer-events-none fixed left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[100px] animate-pulse-slow" />
      <div
        className="pointer-events-none fixed bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-primary/5 blur-[80px] animate-pulse-slow"
        style={{ animationDelay: "2s" }}
      />

      <StageHeader
        stage="PRE-ONBOARDING"
        rightContent={
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {prospect.legal_company_name}
            </div>
            <div className="mt-0.5 text-[10px] font-medium text-success">Submitted</div>
          </div>
        }
      />

      <div className="relative z-10 flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl">

          {/* Success indicator */}
          <div className="mb-8 flex justify-center animate-fade-in">
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-success/10">
              <CheckCircle2 className="h-10 w-10 text-success" strokeWidth={1.5} />
            </div>
          </div>

          {/* Micro-label */}
          <div
            className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-success animate-fade-in"
            style={{ animationDelay: "80ms" }}
          >
            SUBMITTED · {timeAgo(prospect.submitted_at!)}
          </div>

          {/* Headline */}
          <h1
            className="mb-4 text-center text-4xl font-bold leading-[1.05] tracking-tight md:text-[52px] animate-fade-in-up"
            style={{ animationDelay: "140ms" }}
          >
            Your information is in.
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
              We'll be in touch.
            </span>
          </h1>

          <p
            className="mx-auto mb-10 max-w-xl text-center text-base leading-relaxed text-muted-foreground animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            Your Account Manager has received everything you shared. They'll reach out to discuss
            next steps and schedule your onboarding call.
          </p>

          {/* What happens next - 3 cards */}
          <div className="mb-10 grid grid-cols-1 gap-3 md:grid-cols-3">
            {cards.map(({ icon: Icon, label, desc }, i) => (
              <div
                key={label}
                className="group rounded-xl border border-border/40 bg-card/30 p-5 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-card/50 animate-fade-in-up"
                style={{ animationDelay: `${i * 80 + 260}ms` }}
              >
                <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="mb-1 text-sm font-semibold text-foreground">{label}</div>
                <div className="text-xs leading-relaxed text-muted-foreground/80">{desc}</div>
              </div>
            ))}
          </div>

          {/* Reassurance callout */}
          <div
            className="mx-auto mb-10 flex max-w-xl items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 animate-fade-in-up"
            style={{ animationDelay: "500ms" }}
          >
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-[13px] leading-relaxed text-foreground/90">
              <span className="font-semibold">Watch your inbox.</span>{" "}
              <span className="text-muted-foreground/90">
                Your AM will reach out within one business day.
              </span>
            </p>
          </div>

          {/* Primary CTA - Download PDF */}
          <div
            className="mb-4 flex flex-col items-center animate-fade-in-up"
            style={{ animationDelay: "580ms" }}
          >
            <button
              onClick={onDownloadPDF}
              disabled={downloading}
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-4 text-base font-semibold text-primary-foreground shadow-premium transition-all hover:-translate-y-0.5 hover:shadow-premium-hover active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {downloading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              {downloading ? "Preparing PDF…" : "Download Your Submission (PDF)"}
            </button>
          </div>

          {/* Secondary action - Request Update */}
          <div
            className="flex flex-col items-center animate-fade-in-up"
            style={{ animationDelay: "640ms" }}
          >
            <button
              onClick={onRequestUpdate}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Need to update something? Request changes from your AM
            </button>
          </div>

        </div>
      </div>
    </div>
  );
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
  onRequestUpdate?: (reason: string) => Promise<void>;
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
  onRequestUpdate,
}: ProspectFormContentProps) {
  const progress = prospect.form_progress;
  const submitted = !!prospect.submitted_at;
  const isLocked = mode === "token" && submitted && !prospect.update_requested_at;
  const updatePending = !!prospect.update_requested_at;

  const [reqDialogOpen, setReqDialogOpen] = useState(false);
  const [reqReason, setReqReason] = useState("");
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleRequestUpdate = async () => {
    if (!onRequestUpdate) return;
    setReqSubmitting(true);
    try {
      await onRequestUpdate(reqReason.trim());
      setReqDialogOpen(false);
      setReqReason("");
    } finally {
      setReqSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (downloading) return;
    setDownloading(true);
    const toastId = toast.loading("Preparing your PDF…");
    try {
      // Lazy-load the PDF builder so @react-pdf/renderer never runs during SSR
      // and never blocks the success screen from rendering.
      const { downloadProspectPDF } = await import("@/lib/pdf-builder");
      await downloadProspectPDF({
        ...prospect,
        submitted_at: prospect.submitted_at!,
      });
      toast.success("PDF downloaded", { id: toastId });
    } catch (err) {
      console.error("[PDF] prospect generation failed:", err);
      toast.error("Could not generate PDF. Please try again.", { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  /* ── Success screen: replaces form entirely when locked ── */
  if (isLocked) {
    return (
      <>
        <ProspectSuccessState
          prospect={prospect}
          onRequestUpdate={() => setReqDialogOpen(true)}
          onDownloadPDF={handleDownloadPDF}
          downloading={downloading}
        />

        {/* Request Update Dialog - rendered via portal, works regardless of parent */}
        <Dialog open={reqDialogOpen} onOpenChange={(v) => { if (!v) setReqDialogOpen(false); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request an update</DialogTitle>
              <DialogDescription>
                Let us know what you'd like to change. Your form will be unlocked for editing.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2">
              <textarea
                className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none transition-colors min-h-[100px] resize-y"
                placeholder="Describe what you'd like to update (optional)…"
                value={reqReason}
                onChange={(e) => setReqReason(e.target.value)}
              />
            </div>
            <DialogFooter className="mt-2">
              <Button variant="outline" onClick={() => setReqDialogOpen(false)} disabled={reqSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleRequestUpdate} disabled={reqSubmitting}>
                {reqSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                Request Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  /* ── Editable form (not locked) ── */
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <StageHeader
        stage="PRE-ONBOARDING"
        rightContent={
          <>
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
          </>
        }
      />

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
          Share what you know - skip what you don't. Your answers help our team prepare for your
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

      {/* ── Banners (non-locked states only) ── */}

      {/* Update pending - editing unlocked (prospect view) */}
      {updatePending && mode === "token" && (
        <div className="mx-auto max-w-4xl px-6 mb-6">
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <MessageSquare className="h-5 w-5 shrink-0 text-amber-400" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-foreground">Editing enabled</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Your update request was noted. Make your changes and resubmit to the team.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update pending - info banner (admin view) */}
      {updatePending && mode === "authenticated" && (
        <div className="mx-auto max-w-4xl px-6 mb-6">
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <MessageSquare className="h-5 w-5 shrink-0 text-amber-400" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-foreground">Prospect requested an update</div>
              {prospect.update_request_reason && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  "{prospect.update_request_reason}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submitted (admin view, no update pending) */}
      {!updatePending && submitted && mode === "authenticated" && (
        <div className="mx-auto max-w-4xl px-6 mb-6">
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-foreground">Information was sent to Trivelta</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {timeAgo(prospect.submitted_at!)} · Editing as admin - re-submit to push updates.
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
              : "Submit anytime - you can keep editing after."}
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
