import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AmAvatars, type AmLite } from "@/components/AmAvatars";
import { CopyableLink } from "@/components/CopyableLink";
import { StatusBadge } from "@/components/StatusBadge";
import { buildProspectUrl } from "@/lib/prospect-tokens";
import { calculateProgress, type ClientProgressInput } from "@/lib/client-progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { StudioSavedConfig } from "@/contexts/StudioContext";
import { DEFAULT_STUDIO_FEATURES, type StudioFeatures } from "@/lib/studio-features";
import {
  ExternalLink,
  Palette,
  Trash2,
  FileSignature,
  Rocket,
  ShieldCheck,
  ShieldAlert,
  Lock,
  LockOpen,
  Pencil,
  Check,
  ArrowRight,
  Loader2,
  LayoutGrid,
} from "lucide-react";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface ClientRow {
  id: string;
  name: string;
  country: string | null;
  status: "onboarding" | "active" | "churned";
  drive_link: string | null;
  platform_url: string | null;
  primary_contact_email: string | null;
  primary_contact_name: string | null;
  created_at: string;
  studio_access: boolean;
  platform_live?: boolean;
  studio_features: StudioFeatures | null;
  notion_page_id?: string | null;
  onboarding_phase?:
    | "Pre-Sale"
    | "Post-Sale"
    | "Contract"
    | "Initial Setup"
    | "Full Config"
    | "Pre-Launch"
    | "Post-Launch"
    | null;
  contract_signed_at?: string | null;
  contract_start_date?: string | null;
  go_live_date?: string | null;
  next_renewal_date?: string | null;
  health_score?: string | null;
  access_token?: string | null;
}

export interface ProspectRow {
  id: string;
  legal_company_name: string;
  primary_contact_email: string;
  primary_contact_name: string | null;
  assigned_account_manager: string | null;
  contract_status: string;
  form_progress: number;
  access_token: string;
  created_at: string;
  submitted_at: string | null;
  update_requested_at: string | null;
  notion_page_id: string | null;
  converted_to_client_id: string | null;
  converted_at: string | null;
}

export type DrawerTarget =
  | { kind: "client"; id: string }
  | { kind: "prospect"; id: string };

// ─── Lifecycle: Mark Commitment Fee Paid ──────────────────────────────────────

export function MarkContractSignedButton({
  clientId,
  onSuccess,
}: {
  clientId: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("contract-signed", {
        body: { client_id: clientId },
      });
      if (error) throw error;
      toast.success("Commitment fee marked as paid. Notion updated.");
      onSuccess();
    } catch (err) {
      toast.error(
        `Failed to mark commitment fee paid: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <Button
        className="w-full gap-2 h-10"
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
        Mark Commitment Fee Paid
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark commitment fee as paid?</AlertDialogTitle>
            <AlertDialogDescription>
              This transitions the client to Contract phase. Contract Start Date will be set to
              today. Notion will be updated automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Lifecycle: Mark as Live ──────────────────────────────────────────────────

export function MarkAsLiveButton({
  clientId,
  clientName,
  onSuccess,
}: {
  clientId: string;
  clientName: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("go-live", {
        body: { client_id: clientId },
      });
      if (error) throw error;
      toast.success(
        `${clientName} is now live. Don't forget to email the client manually.`,
      );
      onSuccess();
    } catch (err) {
      toast.error(
        `Go Live failed: ${err instanceof Error ? err.message : "Unknown error"}. Client remains in Pre-Launch.`,
      );
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <Button
        className="w-full gap-2 h-10 bg-gradient-to-r from-primary to-primary/80 shadow-md"
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Rocket className="h-4 w-4" />
        )}
        🚀 Mark as Live
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark {clientName} as live?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <span className="block">This will:</span>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  <li>Transition Notion page to Status = Active, Phase = Post-Launch</li>
                  <li>Set Next Renewal to Contract Start + 12 months</li>
                  <li>Set Health Score to Good</li>
                </ul>
                <span className="block pt-2 text-xs text-amber-600">
                  After confirming, remember to send a launch confirmation email to the client
                  manually via Gmail.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading ? "Launching..." : "Yes — mark as live"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Phase helpers ────────────────────────────────────────────────────────────

const PHASE_DOT_COLORS: Record<string, string> = {
  "Pre-Sale": "bg-amber-400",
  "Post-Sale": "bg-orange-400",
  Contract: "bg-blue-400",
  "Initial Setup": "bg-blue-500",
  "Full Config": "bg-indigo-400",
  "Pre-Launch": "bg-purple-400",
  "Post-Launch": "bg-green-500",
};

export function phaseDotColor(phase: string): string {
  return PHASE_DOT_COLORS[phase] ?? "bg-muted-foreground/40";
}

const PHASE_PILL_COLORS: Record<string, string> = {
  "Pre-Sale": "border-amber-500/30 bg-amber-500/10 text-amber-400",
  "Post-Sale": "border-orange-500/30 bg-orange-500/10 text-orange-400",
  Contract: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  "Initial Setup": "border-blue-500/30 bg-blue-500/10 text-blue-400",
  "Full Config": "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
  "Pre-Launch": "border-purple-500/30 bg-purple-500/10 text-purple-400",
  "Post-Launch": "border-green-500/30 bg-green-500/10 text-green-400",
};

function PhasePill({ phase }: { phase: string }) {
  const colors =
    PHASE_PILL_COLORS[phase] ??
    "border-border/40 bg-muted/20 text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors}`}
    >
      {phase}
    </span>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 border-b border-border/20 last:border-b-0">
      <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center justify-end text-[12px] text-foreground">{children}</div>
    </div>
  );
}

// ─── Client drawer body ───────────────────────────────────────────────────────

interface ClientDrawerBodyProps {
  c: ClientRow;
  studioData: Record<
    string,
    { config: StudioSavedConfig | null; locked: boolean; lockedAt: string | null }
  >;
  progressData: Record<
    string,
    { formExists: boolean; formHasData: boolean; formSubmitted: boolean; studioStarted: boolean }
  >;
  clientAms: Record<string, string[]>;
  ams: AmLite[];
  isAdminRole: boolean;
  canDelete: boolean;
  onRefresh: () => void;
  onRequestDelete: (kind: "client" | "prospect", id: string, name: string) => void;
  onOpenStudioFeatures: (params: {
    clientId: string;
    clientName: string;
    currentFeatures: StudioFeatures | null;
  }) => void;
}

function ClientDrawerBody({
  c,
  studioData,
  progressData,
  clientAms,
  ams,
  isAdminRole,
  canDelete,
  onRefresh,
  onRequestDelete,
  onOpenStudioFeatures,
}: ClientDrawerBodyProps) {
  const onboardingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/onboarding/${c.id}`;
  const pd = progressData[c.id];
  const sd = studioData[c.id] ?? null;
  const input: ClientProgressInput = {
    hasOnboardingForm: pd?.formExists ?? false,
    formHasData: pd?.formHasData ?? false,
    formSubmitted: pd?.formSubmitted ?? false,
    studioStarted: pd?.studioStarted ?? false,
    studioLocked: sd?.locked ?? false,
    platformLive: c.platform_live ?? false,
  };
  const pct = calculateProgress(input);
  const assignedEmails = clientAms[c.id] ?? [];
  const assignedAms: AmLite[] = assignedEmails.map(
    (email) => ams.find((a) => a.email === email) ?? { email, name: null },
  );
  const needsLifecycle =
    c.onboarding_phase == null ||
    c.onboarding_phase === "Pre-Sale" ||
    c.onboarding_phase === "Post-Sale" ||
    c.onboarding_phase === "Pre-Launch";

  return (
    <div className="space-y-4">
      {/* ── Summary ── */}
      <SectionCard title="Summary">
        <div>
          <SummaryRow label="Created">
            <span className="font-mono text-[11px]">
              {new Date(c.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </SummaryRow>
          <SummaryRow label="Account managers">
            {assignedAms.length > 0 ? (
              <AmAvatars ams={assignedAms} />
            ) : (
              <span className="text-[11px] text-muted-foreground/50">None assigned</span>
            )}
          </SummaryRow>
          {c.onboarding_phase && (
            <SummaryRow label="Phase">
              <PhasePill phase={c.onboarding_phase} />
            </SummaryRow>
          )}
          <SummaryRow label="Form progress">
            <div className="flex items-center gap-2.5">
              <div className="relative h-1.5 w-20 overflow-hidden rounded-full bg-foreground/[0.06]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="font-mono text-[11px] font-semibold tabular-nums">{pct}%</span>
            </div>
          </SummaryRow>
          <SummaryRow label="Studio access">
            {c.studio_access ? (
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                <span className="font-medium text-[11px] text-success">Granted</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="text-[11px] text-muted-foreground/50">No access</span>
              </span>
            )}
          </SummaryRow>
          <SummaryRow label="Studio config">
            {sd ? (
              sd.locked ? (
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-success" />
                  <span className="font-medium text-[11px] text-success">Locked</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <LockOpen className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-[11px] text-muted-foreground/50">Unlocked</span>
                </span>
              )
            ) : (
              <span className="text-[11px] text-muted-foreground/50">No config yet</span>
            )}
          </SummaryRow>
        </div>
      </SectionCard>

      {/* ── Quick Actions ── */}
      <SectionCard title="Quick Actions">
        <div className="space-y-3">
          {/* Lifecycle hero */}
          {needsLifecycle && (
            <>
              {(c.onboarding_phase == null ||
                c.onboarding_phase === "Pre-Sale" ||
                c.onboarding_phase === "Post-Sale") && (
                <MarkContractSignedButton clientId={c.id} onSuccess={onRefresh} />
              )}
              {c.onboarding_phase === "Pre-Launch" && (
                <MarkAsLiveButton clientId={c.id} clientName={c.name} onSuccess={onRefresh} />
              )}
            </>
          )}

          {/* Onboarding link */}
          <div className="space-y-1">
            <CopyableLink url={onboardingUrl} />
            <div className="truncate font-mono text-[10px] text-muted-foreground/40 px-0.5">
              {onboardingUrl}
            </div>
          </div>

          {/* Secondary actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-[11px]"
              onClick={() => window.open(onboardingUrl, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View as client
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-[11px]"
              onClick={() => window.open(`/studio-preview/${c.id}`, "_blank")}
            >
              <Palette className="h-3.5 w-3.5" />
              Open Studio
            </Button>
            {isAdminRole && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-[11px]"
                onClick={() =>
                  onOpenStudioFeatures({
                    clientId: c.id,
                    clientName: c.name,
                    currentFeatures: c.studio_features ?? DEFAULT_STUDIO_FEATURES,
                  })
                }
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Studio Features
              </Button>
            )}
          </div>

          {/* Delete */}
          {canDelete && (
            <div className="flex justify-end border-t border-border/20 pt-2">
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onRequestDelete("client", c.id, c.name)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete client
              </Button>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Timeline placeholder ── */}
      <SectionCard title="Timeline / Notes">
        <div className="rounded-lg bg-muted/30 px-4 py-6 text-center">
          <span className="text-[12px] text-muted-foreground/60">No activity recorded yet</span>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Prospect drawer body ─────────────────────────────────────────────────────

interface ProspectDrawerBodyProps {
  p: ProspectRow;
  prospectAms: Record<string, string[]>;
  ams: AmLite[];
  canDelete: boolean;
  onConvertProspect: (prospect: ProspectRow) => void;
  onRequestDelete: (kind: "client" | "prospect", id: string, name: string) => void;
  onMarkUpdateHandled: (prospect: ProspectRow) => void;
  onContractStatusChange: (prospect: ProspectRow, newStatus: string) => void;
}

function ProspectDrawerBody({
  p,
  prospectAms,
  ams,
  canDelete,
  onConvertProspect,
  onRequestDelete,
  onMarkUpdateHandled,
  onContractStatusChange,
}: ProspectDrawerBodyProps) {
  const navigate = useNavigate();
  const isConverted = !!p.converted_to_client_id;
  const prospectUrl = p.access_token ? buildProspectUrl(p.access_token) : null;
  const displayProgress = isConverted ? 100 : p.form_progress;
  const assignedEmails =
    prospectAms[p.id] ?? (p.assigned_account_manager ? [p.assigned_account_manager] : []);
  const assignedAms: AmLite[] = assignedEmails.map(
    (email) => ams.find((a) => a.email === email) ?? { email, name: null },
  );

  const CONTRACT_OPTIONS = [
    { value: "in_discussion", label: "In discussion" },
    { value: "term_sheet", label: "Term sheet" },
    { value: "contract_sent", label: "Contract sent" },
    { value: "under_legal_review", label: "Legal review" },
    { value: "ready_to_sign", label: "Ready to sign" },
    { value: "signed", label: "Signed ✓" },
  ];

  return (
    <div className="space-y-4">
      {/* ── Summary ── */}
      <SectionCard title="Summary">
        <div>
          <SummaryRow label="Created">
            <span className="font-mono text-[11px]">
              {new Date(p.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </SummaryRow>
          <SummaryRow label="Account managers">
            {assignedAms.length > 0 ? (
              <AmAvatars ams={assignedAms} />
            ) : (
              <span className="text-[11px] text-muted-foreground/50">None assigned</span>
            )}
          </SummaryRow>
          <SummaryRow label="Contract status">
            {isConverted ? (
              <span className="inline-flex items-center rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                Signed
              </span>
            ) : (
              <select
                value={p.contract_status}
                onChange={(e) => onContractStatusChange(p, e.target.value)}
                className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
              >
                {CONTRACT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </SummaryRow>
          <SummaryRow label="Form progress">
            <div className="flex items-center gap-2.5">
              <div className="relative h-1.5 w-20 overflow-hidden rounded-full bg-foreground/[0.06]">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${isConverted ? "bg-gradient-to-r from-success to-success/60" : "bg-gradient-to-r from-amber-500 to-amber-400/60"}`}
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
              <span className="font-mono text-[11px] font-semibold tabular-nums">
                {displayProgress}%
              </span>
            </div>
          </SummaryRow>
          {p.submitted_at && !isConverted && (
            <SummaryRow label="Submission">
              <span className="inline-flex items-center rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-success">
                Submitted
              </span>
            </SummaryRow>
          )}
          {p.update_requested_at && !isConverted && (
            <SummaryRow label="Update">
              <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-400">
                Update Requested
              </span>
            </SummaryRow>
          )}
        </div>
      </SectionCard>

      {/* ── Quick Actions ── */}
      <SectionCard title="Quick Actions">
        <div className="space-y-3">
          {isConverted ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5 text-[11px] text-success border-success/30 hover:bg-success/10 hover:text-success"
              onClick={() =>
                navigate({
                  to: "/onboarding/$clientId/form",
                  params: { clientId: p.converted_to_client_id! },
                })
              }
            >
              View client record <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <>
              {/* Magic link share */}
              {prospectUrl && (
                <div className="space-y-1">
                  <CopyableLink
                    url={prospectUrl}
                    label="Magic link"
                    clientEmail={p.primary_contact_email}
                    emailSubject={`Your ${p.legal_company_name} pre-onboarding link`}
                    emailBody={`Hi,\n\nHere's your Trivelta pre-onboarding link for ${p.legal_company_name}:\n\n${prospectUrl}\n\nNo account needed - just click the link to get started.\n\nBest regards,\nThe Trivelta Team`}
                    messageTemplate={`Hi, here's your Trivelta pre-onboarding link for ${p.legal_company_name}: {link}`}
                  />
                </div>
              )}

              {/* Secondary actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-[11px]"
                  onClick={() =>
                    navigate({ to: "/admin/prospects/$id/edit", params: { id: p.id } })
                  }
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit prospect
                </Button>
                {prospectUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-[11px]"
                    onClick={() => window.open(prospectUrl, "_blank")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open form
                  </Button>
                )}
                {p.update_requested_at && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-[11px] text-amber-400 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300"
                    onClick={() => onMarkUpdateHandled(p)}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Handle update
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-[11px] text-success border-success/30 hover:bg-success/10 hover:text-success"
                  onClick={() => onConvertProspect(p)}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  Convert to client
                </Button>
              </div>
            </>
          )}

          {/* Delete */}
          {canDelete && (
            <div className="flex justify-end border-t border-border/20 pt-2">
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onRequestDelete("prospect", p.id, p.legal_company_name)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete prospect
              </Button>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Timeline placeholder ── */}
      <SectionCard title="Timeline / Notes">
        <div className="rounded-lg bg-muted/30 px-4 py-6 text-center">
          <span className="text-[12px] text-muted-foreground/60">No activity recorded yet</span>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ClientDetailDrawerProps {
  target: DrawerTarget | null;
  onClose: () => void;
  onRefresh: () => void;
  clients: ClientRow[];
  prospects: ProspectRow[];
  studioData: Record<
    string,
    { config: StudioSavedConfig | null; locked: boolean; lockedAt: string | null }
  >;
  progressData: Record<
    string,
    { formExists: boolean; formHasData: boolean; formSubmitted: boolean; studioStarted: boolean }
  >;
  clientAms: Record<string, string[]>;
  prospectAms: Record<string, string[]>;
  ams: AmLite[];
  isAdminRole: boolean;
  canDelete: boolean;
  onConvertProspect: (prospect: ProspectRow) => void;
  onRequestDelete: (kind: "client" | "prospect", id: string, name: string) => void;
  onMarkUpdateHandled: (prospect: ProspectRow) => void;
  onContractStatusChange: (prospect: ProspectRow, newStatus: string) => void;
  onOpenStudioFeatures: (params: {
    clientId: string;
    clientName: string;
    currentFeatures: StudioFeatures | null;
  }) => void;
}

export function ClientDetailDrawer({
  target,
  onClose,
  onRefresh,
  clients,
  prospects,
  studioData,
  progressData,
  clientAms,
  prospectAms,
  ams,
  isAdminRole,
  canDelete,
  onConvertProspect,
  onRequestDelete,
  onMarkUpdateHandled,
  onContractStatusChange,
  onOpenStudioFeatures,
}: ClientDetailDrawerProps) {
  const client =
    target?.kind === "client" ? (clients.find((c) => c.id === target.id) ?? null) : null;
  const prospect =
    target?.kind === "prospect" ? (prospects.find((p) => p.id === target.id) ?? null) : null;

  // Record was just deleted — close gracefully
  if (target !== null && client === null && prospect === null) {
    onClose();
    return null;
  }

  const displayName = client?.name ?? prospect?.legal_company_name ?? "";
  const displayEmail = client?.primary_contact_email ?? prospect?.primary_contact_email ?? "";

  const roleBadge = client ? (
    <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary/80">
      Client
    </span>
  ) : prospect?.converted_to_client_id ? (
    <span className="inline-flex items-center rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-success/80">
      Converted
    </span>
  ) : prospect ? (
    <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-400/80">
      Prospect
    </span>
  ) : null;

  return (
    <Sheet open={target !== null} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="sm:max-w-[480px] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border/40 px-6 pb-4 pt-6">
          <div className="pr-8">
            <SheetTitle className="text-xl font-semibold tracking-tight">{displayName}</SheetTitle>
            <SheetDescription asChild>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {displayEmail && (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {displayEmail}
                  </span>
                )}
                {roleBadge}
                {client?.onboarding_phase && <PhasePill phase={client.onboarding_phase} />}
                {client && <StatusBadge status={client.status} />}
              </div>
            </SheetDescription>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {client && (
            <ClientDrawerBody
              c={client}
              studioData={studioData}
              progressData={progressData}
              clientAms={clientAms}
              ams={ams}
              isAdminRole={isAdminRole}
              canDelete={canDelete}
              onRefresh={onRefresh}
              onRequestDelete={onRequestDelete}
              onOpenStudioFeatures={onOpenStudioFeatures}
            />
          )}
          {prospect && (
            <ProspectDrawerBody
              p={prospect}
              prospectAms={prospectAms}
              ams={ams}
              canDelete={canDelete}
              onConvertProspect={onConvertProspect}
              onRequestDelete={onRequestDelete}
              onMarkUpdateHandled={onMarkUpdateHandled}
              onContractStatusChange={onContractStatusChange}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
