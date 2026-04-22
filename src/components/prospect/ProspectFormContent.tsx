import { useState } from "react";
import { CheckCircle2, Download, Loader2, MessageSquare, SendHorizonal } from "lucide-react";
import { StageHeader } from "@/components/StageHeader";
import { ProspectAccordionSection } from "@/components/prospect/ProspectAccordionSection";
import { PROSPECT_SECTIONS } from "@/lib/prospect-fields";
import { buildProspectPDF } from "@/lib/pdf-builder";
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

      {/* ── Banners ── */}

      {/* Locked: submitted, no update pending (prospect view only) */}
      {isLocked && (
        <div className="mx-auto max-w-4xl px-6 mb-6">
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-foreground">Information was sent to Trivelta</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {timeAgo(prospect.submitted_at!)} · Your form is locked. Request an update to make changes.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    const doc = buildProspectPDF({
                      ...prospect,
                      submitted_at: prospect.submitted_at!,
                    });
                    const safeName = prospect.legal_company_name.replace(/\s+/g, "-").toLowerCase();
                    doc.save(`${safeName}-pre-onboarding-${new Date().toISOString().split("T")[0]}.pdf`);
                  } catch (err) {
                    console.error("[PDF] prospect generation failed:", err);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-background/60 px-3 py-1.5 text-[11px] font-medium text-foreground/70 hover:bg-card hover:border-primary/30 hover:text-foreground transition-all whitespace-nowrap"
              >
                <Download className="h-3 w-3" />
                Download PDF
              </button>
              {onRequestUpdate && (
                <button
                  type="button"
                  onClick={() => setReqDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[11px] font-medium text-amber-300 hover:bg-amber-500/20 transition-all whitespace-nowrap"
                >
                  <MessageSquare className="h-3 w-3" />
                  Request Update
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update pending — editing unlocked (prospect view) */}
      {!isLocked && updatePending && mode === "token" && (
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

      {/* Update pending — info banner (admin view) */}
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
                {timeAgo(prospect.submitted_at!)} · Editing as admin — re-submit to push updates.
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
            disabled={isLocked}
          />
        ))}
      </div>

      {/* Fixed bottom bar — hidden when form is locked for prospect */}
      {!isLocked && (
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
      )}

      {/* Request Update Dialog */}
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
    </div>
  );
}
