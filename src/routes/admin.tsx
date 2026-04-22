import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Users,
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  Lock,
  LockOpen,
  Palette,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Check,
  Circle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  calculateProgress,
  getProgressLabel,
  getMilestoneList,
  type ClientProgressInput,
} from "@/lib/client-progress";
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

const SUPER_ADMIN_EMAILS = ["rithieisch.premaruban@trivelta.com"];
import {
  defaultStudioColors,
  type StudioThemeColors,
  type StudioSavedConfig,
} from "@/contexts/StudioContext";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/onboarding-schema";
import { AmAvatars, type AmLite } from "@/components/AmAvatars";
import { AmMultiSelect } from "@/components/AmMultiSelect";
import { generateProspectToken, buildProspectUrl } from "@/lib/prospect-tokens";
import { DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const DEFAULT_DRIVE_LINK = "https://drive.google.com/drive/folders/0ACsQEvOAQlgrUk9PVA";

interface ClientRow {
  id: string;
  name: string;
  country: string | null;
  status: "onboarding" | "active" | "churned";
  drive_link: string | null;
  platform_url: string | null;
  primary_contact_email: string | null;
  created_at: string;
  studio_access: boolean;
  platform_live?: boolean;
}

interface ProspectRow {
  id: string;
  legal_company_name: string;
  primary_contact_email: string;
  primary_contact_name: string | null;
  assigned_account_manager: string | null;
  contract_status: string;
  form_progress: number;
  access_token: string;
  created_at: string;
}

function AdminPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [prospects, setProspects] = useState<ProspectRow[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<string, { total: number; done: number }>>({});
  const [ams, setAms] = useState<AmLite[]>([]);
  // clientId -> list of AM emails
  const [clientAms, setClientAms] = useState<Record<string, string[]>>({});
  const [createProspectOpen, setCreateProspectOpen] = useState(false);
  const [studioData, setStudioData] = useState<
    Record<
      string,
      {
        config: StudioSavedConfig | null;
        locked: boolean;
        lockedAt: string | null;
      }
    >
  >({});
  const [progressData, setProgressData] = useState<
    Record<
      string,
      {
        formExists: boolean;
        formHasData: boolean;
        formSubmitted: boolean;
        studioStarted: boolean;
      }
    >
  >({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.title = "Trivelta Suite · Admin";
  }, []);

  const refresh = async () => {
    setLoading(true);
    const [clientsRes, amAssignmentsRes, tasksRes, camRes, studioRes, prospectsRes] =
      await Promise.all([
        supabase
          .from("clients")
          .select(
            "id, name, country, status, drive_link, platform_url, primary_contact_email, created_at, studio_access, platform_live",
          )
          .order("created_at", { ascending: false }),
        supabase.from("role_assignments").select("email, name").eq("role", "account_manager"),
        supabase.from("onboarding_tasks").select("client_id, completed"),
        supabase.from("client_account_managers").select("client_id, am_email"),
        supabase
          .from("onboarding_forms")
          .select("client_id, studio_config, studio_locked, studio_locked_at, submitted_at, data"),
        (supabase as unknown as { from: (t: string) => any })
          .from("prospects")
          .select(
            "id, legal_company_name, primary_contact_email, primary_contact_name, assigned_account_manager, contract_status, form_progress, access_token, created_at",
          )
          .order("created_at", { ascending: false }),
      ]);
    setClients((clientsRes.data ?? []) as unknown as ClientRow[]);
    setProspects((prospectsRes.data ?? []) as unknown as ProspectRow[]);

    const sdMap: Record<
      string,
      { config: StudioSavedConfig | null; locked: boolean; lockedAt: string | null }
    > = {};
    (
      (studioRes.data ?? []) as Array<{
        client_id: string;
        studio_config: unknown;
        studio_locked: boolean | null;
        studio_locked_at: string | null;
      }>
    ).forEach((r) => {
      sdMap[r.client_id] = {
        config: (r.studio_config as StudioSavedConfig | null) ?? null,
        locked: r.studio_locked ?? false,
        lockedAt: r.studio_locked_at ?? null,
      };
    });
    setStudioData(sdMap);

    const pdMap: Record<
      string,
      { formExists: boolean; formHasData: boolean; formSubmitted: boolean; studioStarted: boolean }
    > = {};
    (
      (studioRes.data ?? []) as Array<{
        client_id: string;
        studio_config: unknown;
        studio_locked: boolean | null;
        submitted_at: string | null;
        data: Record<string, unknown> | null;
      }>
    ).forEach((r) => {
      const formData = r.data ?? {};
      const formHasData = Object.keys(formData).length > 0;
      const studioConfig = r.studio_config as StudioSavedConfig | null;
      pdMap[r.client_id] = {
        formExists: true,
        formHasData,
        formSubmitted: !!r.submitted_at,
        studioStarted: !!(studioConfig?.palette || studioConfig?.colors),
      };
    });
    setProgressData(pdMap);

    const amList: AmLite[] = (
      (amAssignmentsRes.data ?? []) as Array<{ email: string; name: string | null }>
    )
      .map((r) => ({ email: r.email, name: r.name }))
      .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email));
    setAms(amList);

    const camMap: Record<string, string[]> = {};
    ((camRes.data ?? []) as Array<{ client_id: string; am_email: string | null }>).forEach((r) => {
      if (r.am_email) (camMap[r.client_id] ??= []).push(r.am_email);
    });
    setClientAms(camMap);

    const counts: Record<string, { total: number; done: number }> = {};
    ((tasksRes.data ?? []) as Array<{ client_id: string; completed: boolean }>).forEach((t) => {
      counts[t.client_id] ??= { total: 0, done: 0 };
      counts[t.client_id].total++;
      if (t.completed) counts[t.client_id].done++;
    });
    setTaskCounts(counts);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading || !user) return;
    refresh();
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (role === "account_manager") return <Navigate to="/dashboard" />;
  if (role !== "admin" && role !== "account_executive") {
    return <Navigate to="/" />;
  }

  const clientsWithProgress = clients.map((c) => {
    const pd = progressData[c.id];
    const sd = studioData[c.id];
    const input: ClientProgressInput = {
      hasOnboardingForm: pd?.formExists ?? false,
      formHasData: pd?.formHasData ?? false,
      formSubmitted: pd?.formSubmitted ?? false,
      studioStarted: pd?.studioStarted ?? false,
      studioLocked: sd?.locked ?? false,
      platformLive: c.platform_live ?? false,
    };
    return { ...c, progress: calculateProgress(input), milestones: getMilestoneList(input) };
  });

  const stats = {
    total: clients.length,
    prospects: prospects.length,
    active: clientsWithProgress.filter((c) => c.progress > 0 && c.progress < 100).length,
    onboarding: clients.filter((c) => c.status === "onboarding").length,
    avgCompletion:
      clientsWithProgress.length === 0
        ? 0
        : Math.round(
            clientsWithProgress.reduce((sum, c) => sum + c.progress, 0) /
              clientsWithProgress.length,
          ),
  };

  const canDelete = SUPER_ADMIN_EMAILS.includes(user?.email ?? "");

  const handleDelete = async (clientId: string, clientName: string) => {
    if (
      !window.confirm(
        `Permanently delete "${clientName}"?\n\nThis removes the client and ALL related onboarding data, tasks, submissions, AM assignments and team members. This cannot be undone.`,
      )
    )
      return;
    const { error } = await supabase.from("clients").delete().eq("id", clientId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Deleted ${clientName}`);
    setClients((prev) => prev.filter((c) => c.id !== clientId));
  };

  const handleDeleteProspect = async (prospectId: string, companyName: string) => {
    if (!window.confirm(`Permanently delete prospect "${companyName}"? This cannot be undone.`))
      return;
    const { error } = await (supabase as unknown as { from: (t: string) => any })
      .from("prospects")
      .delete()
      .eq("id", prospectId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Deleted prospect ${companyName}`);
    setProspects((prev) => prev.filter((p) => p.id !== prospectId));
  };

  return (
    <AppShell badge="Admin">
      <div className="mx-auto w-full max-w-[1400px] px-6 pb-10 pt-6">
        {/* Page header */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="micro-label mb-1.5">Trivelta · Control Plane</div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Admin overview
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-snug text-muted-foreground">
              Every client, account manager and onboarding signal — in one premium control surface.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-11 px-5 text-[13px] border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
              onClick={() => setCreateProspectOpen(true)}
            >
              <Plus className="h-4 w-4" /> New prospect
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="btn-premium h-11 px-6 text-[14px]">
                  <Plus className="h-4 w-4" /> New client
                </Button>
              </DialogTrigger>
              <NewClientDialog
                ams={ams}
                onCreated={() => {
                  setOpen(false);
                  refresh();
                }}
              />
            </Dialog>
          </div>
        </div>

        {/* Hero stats */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total clients" value={stats.total} />
          <StatCard label="Prospects" value={stats.prospects} accent="amber" />
          <StatCard label="Onboarding" value={stats.onboarding} accent="primary" />
          <StatCard label="Active" value={stats.active} accent="success" />
          <StatCard label="Avg completion" value={`${stats.avgCompletion}%`} />
        </div>

        {/* Section heading */}
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="micro-label">All clients &amp; prospects</div>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              {clients.length + prospects.length}{" "}
              <span className="font-normal text-muted-foreground">in the pipeline</span>
            </h2>
          </div>
        </div>

        {/* Table */}
        <div className="card-premium overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : clients.length === 0 && prospects.length === 0 ? (
            <div className="grid place-items-center gap-4 py-20 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-base font-semibold text-foreground">No clients yet</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Create your first client or prospect to start the onboarding flow.
                </div>
              </div>
              <Button onClick={() => setOpen(true)} className="btn-premium mt-2 h-10 px-5">
                <Plus className="h-4 w-4" /> Add your first client
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/80 text-left">
                    <th className="px-5 py-4 micro-label">Client / Prospect</th>
                    <th className="px-4 py-4 micro-label">Account Managers</th>
                    <th className="px-4 py-4 micro-label">Status</th>
                    <th className="px-4 py-4 micro-label">Progress</th>
                    <th className="px-4 py-4 micro-label">Created</th>
                    <th className="px-4 py-4 micro-label">Studio</th>
                    <th className="px-4 py-4 micro-label">Config</th>
                    <th className="px-4 py-4 micro-label">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Client rows */}
                  {clientsWithProgress.map((c) => {
                    const pct = c.progress;
                    const assignedEmails = clientAms[c.id] ?? [];
                    const assignedAms: AmLite[] = assignedEmails.map(
                      (email) => ams.find((a) => a.email === email) ?? { email, name: null },
                    );
                    const onboardingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/onboarding/${c.id}`;
                    return (
                      <tr
                        key={c.id}
                        className="row-premium border-b border-border/40 last:border-b-0"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-foreground">{c.name}</div>
                          {c.primary_contact_email && (
                            <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                              {c.primary_contact_email}
                            </div>
                          )}
                          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-primary/70">
                            Client
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <ClientAmCell
                            clientId={c.id}
                            ams={ams}
                            assignedAms={assignedAms}
                            onChanged={refresh}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-4">
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex cursor-default items-center gap-2.5">
                                  <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-foreground/[0.06]">
                                    <div
                                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground/80">
                                    {pct}%
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className="bg-card border border-border px-3 py-2.5 text-foreground shadow-xl"
                              >
                                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  {getProgressLabel(pct)}
                                </div>
                                <div className="space-y-1.5">
                                  {c.milestones.map((m) => (
                                    <div key={m.order} className="flex items-center gap-2 text-xs">
                                      {m.completed ? (
                                        <Check className="h-3 w-3 text-primary flex-shrink-0" />
                                      ) : (
                                        <Circle className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
                                      )}
                                      <span
                                        className={
                                          m.completed
                                            ? "text-foreground"
                                            : "text-muted-foreground/60"
                                        }
                                      >
                                        {m.label}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-4">
                          <StudioAccessCell
                            clientId={c.id}
                            hasAccess={c.studio_access}
                            onChanged={(val) =>
                              setClients((prev) =>
                                prev.map((r) => (r.id === c.id ? { ...r, studio_access: val } : r)),
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-4">
                          <StudioLockCell
                            clientId={c.id}
                            clientName={c.name}
                            data={studioData[c.id] ?? null}
                            onChanged={(locked, lockedAt) =>
                              setStudioData((prev) => ({
                                ...prev,
                                [c.id]: { ...prev[c.id], locked, lockedAt },
                              }))
                            }
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="row-actions flex items-center gap-0.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Copy onboarding link"
                              onClick={() => {
                                navigator.clipboard.writeText(onboardingUrl);
                                toast.success("Link copied");
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Open onboarding"
                              onClick={() => window.open(onboardingUrl, "_blank")}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Open Studio (admin preview)"
                              onClick={() => window.open(`/studio-preview/${c.id}`, "_blank")}
                            >
                              <Palette className="h-3.5 w-3.5" />
                            </Button>
                            {canDelete && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                title="Delete client (permanent)"
                                onClick={() => handleDelete(c.id, c.name)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Prospect rows */}
                  {prospects.map((p) => {
                    const prospectUrl = buildProspectUrl(p.access_token);
                    const contractLabel: Record<string, string> = {
                      in_discussion: "In discussion",
                      term_sheet: "Term sheet",
                      contract_sent: "Contract sent",
                      under_legal_review: "Legal review",
                      ready_to_sign: "Ready to sign",
                      signed: "Signed",
                    };
                    return (
                      <tr
                        key={p.id}
                        className="row-premium border-b border-border/40 last:border-b-0 bg-amber-500/[0.02]"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-foreground">
                            {p.legal_company_name}
                          </div>
                          <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                            {p.primary_contact_email}
                          </div>
                          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-amber-400/80">
                            Prospect
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[11px] text-muted-foreground">
                          {p.assigned_account_manager ?? "—"}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                            {contractLabel[p.contract_status] ?? p.contract_status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-foreground/[0.06]">
                              <div
                                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-500 to-amber-400/60 transition-all duration-500"
                                style={{ width: `${p.form_progress}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground/80">
                              {p.form_progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-muted-foreground/40">—</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-muted-foreground/40">—</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="row-actions flex items-center gap-0.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Copy magic link"
                              onClick={() => {
                                navigator.clipboard.writeText(prospectUrl);
                                toast.success("Magic link copied");
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Open prospect form"
                              onClick={() => window.open(prospectUrl, "_blank")}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                            {canDelete && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                title="Delete prospect (permanent)"
                                onClick={() =>
                                  handleDeleteProspect(p.id, p.legal_company_name)
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* New Prospect Dialog */}
        <NewProspectDialog
          open={createProspectOpen}
          onOpenChange={setCreateProspectOpen}
          currentUser={user}
          onCreated={() => refresh()}
        />
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "primary" | "success" | "amber";
}) {
  const dot =
    accent === "primary"
      ? "bg-primary shadow-[0_0_12px_2px_color-mix(in_oklab,var(--color-primary)_60%,transparent)]"
      : accent === "success"
        ? "bg-success shadow-[0_0_12px_2px_color-mix(in_oklab,var(--color-success)_60%,transparent)]"
        : accent === "amber"
          ? "bg-amber-400 shadow-[0_0_12px_2px_rgba(251,191,36,0.4)]"
          : "bg-foreground/30";
  return (
    <div className="card-premium group relative overflow-hidden p-4">
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative flex items-center justify-between">
        <span className="micro-label">{label}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      </div>
      <div className="relative mt-2.5">
        <span className="stat-hero text-4xl">{value}</span>
      </div>
    </div>
  );
}

function ClientAmCell({
  clientId,
  ams,
  assignedAms,
  onChanged,
}: {
  clientId: string;
  ams: AmLite[];
  assignedAms: AmLite[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string[]>(assignedAms.map((a) => a.email));

  useEffect(() => {
    setSelected(assignedAms.map((a) => a.email));
  }, [assignedAms.map((a) => a.email).join(",")]);

  const save = async () => {
    setSaving(true);
    const current = assignedAms.map((a) => a.email);
    const toAdd = selected.filter((e) => !current.includes(e));
    const toRemove = current.filter((e) => !selected.includes(e));

    if (toRemove.length > 0) {
      const { error } = await supabase
        .from("client_account_managers")
        .delete()
        .eq("client_id", clientId)
        .in("am_email", toRemove);
      if (error) {
        setSaving(false);
        toast.error(error.message);
        return;
      }
    }
    if (toAdd.length > 0) {
      const { error } = await supabase
        .from("client_account_managers")
        .insert(toAdd.map((am_email) => ({ client_id: clientId, am_email })));
      if (error) {
        setSaving(false);
        toast.error(error.message);
        return;
      }
    }
    setSaving(false);
    setOpen(false);
    toast.success("AMs updated");
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="cursor-pointer rounded p-1 -m-1 hover:bg-accent/60 transition-colors">
          <AmAvatars ams={assignedAms} />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign account managers</DialogTitle>
        </DialogHeader>
        <AmMultiSelect ams={ams} value={selected} onChange={setSelected} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Studio Access cell ──────────────────────────────────────────────────── */

function StudioAccessCell({
  clientId,
  hasAccess,
  onChanged,
}: {
  clientId: string;
  hasAccess: boolean;
  onChanged: (val: boolean) => void;
}) {
  const [toggling, setToggling] = useState(false);

  const toggle = async () => {
    setToggling(true);
    const next = !hasAccess;
    const { error } = await supabase
      .from("clients")
      .update(
        next
          ? { studio_access: next, studio_access_granted_at: new Date().toISOString() }
          : { studio_access: next },
      )
      .eq("id", clientId);
    setToggling(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    onChanged(next);
    toast.success(next ? "Studio access granted" : "Studio access revoked");
  };

  return (
    <button
      onClick={toggle}
      disabled={toggling}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-accent/60 disabled:opacity-50"
    >
      {toggling ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      ) : hasAccess ? (
        <>
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          <span className="font-medium text-success">Granted</span>
        </>
      ) : (
        <>
          <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-muted-foreground/50">No access</span>
        </>
      )}
    </button>
  );
}

/* ── Studio Lock cell ────────────────────────────────────────────────────── */

function StudioLockCell({
  clientId,
  clientName,
  data,
  onChanged,
}: {
  clientId: string;
  clientName: string;
  data: { config: StudioSavedConfig | null; locked: boolean; lockedAt: string | null } | null;
  onChanged: (locked: boolean, lockedAt: string | null) => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!data) {
    return <span className="text-xs text-muted-foreground/50">—</span>;
  }

  const doLock = async () => {
    const now = new Date().toISOString();
    setToggling(true);
    // Optimistic
    onChanged(true, now);
    const { error } = await supabase
      .from("onboarding_forms")
      .update({ studio_locked: true, studio_locked_at: now })
      .eq("client_id", clientId);
    setToggling(false);
    if (error) {
      onChanged(false, null); // revert
      toast.error(error.message);
      return;
    }
    toast.success(`Design locked for ${clientName}`);
  };

  const doUnlock = async () => {
    setConfirmOpen(false);
    setToggling(true);
    // Optimistic
    onChanged(false, null);
    const { error } = await supabase
      .from("onboarding_forms")
      .update({ studio_locked: false, studio_locked_at: null })
      .eq("client_id", clientId);
    setToggling(false);
    if (error) {
      onChanged(true, data.lockedAt); // revert
      toast.error(error.message);
      return;
    }
    toast.success(`Design unlocked for ${clientName}`);
  };

  return (
    <>
      {data.locked ? (
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={toggling}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-accent/60 disabled:opacity-50 cursor-pointer"
          title="Click to unlock design"
        >
          {toggling ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Lock className="h-3.5 w-3.5 text-success" />
              <span className="font-medium text-success">Locked</span>
            </>
          )}
        </button>
      ) : (
        <button
          onClick={doLock}
          disabled={toggling || !data.config}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-accent/60 disabled:opacity-50 cursor-pointer"
          title={data.config ? "Click to lock design" : "No config yet"}
        >
          {toggling ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <LockOpen className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="text-muted-foreground/50">Unlocked</span>
            </>
          )}
        </button>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlock design for {clientName}?</AlertDialogTitle>
            <AlertDialogDescription>
              The client will be able to edit their design again. This action does NOT remove the
              existing Notion page — your tech team will see both the old locked design and any new
              changes after re-lock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doUnlock}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Unlock Design
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ── Studio Config helpers ───────────────────────────────────────────────── */

function rgbaToHex(rgba: string): string {
  const m = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return "#000000";
  return "#" + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, "0")).join("");
}

const STUDIO_COLOR_LABELS: { label: string; key: keyof StudioThemeColors }[] = [
  { label: "Background", key: "primaryBg" },
  { label: "Primary", key: "primary" },
  { label: "Secondary", key: "secondary" },
  { label: "Light Text", key: "lightText" },
  { label: "Placeholder", key: "placeholderText" },
  { label: "Btn Start", key: "primaryButton" },
  { label: "Btn End", key: "primaryButtonGradient" },
  { label: "Box Start", key: "boxGradient1" },
  { label: "Box End", key: "boxGradient2" },
  { label: "Header Start", key: "headerGradient1" },
  { label: "Header End", key: "headerGradient2" },
  { label: "Won Start", key: "wonGradient1" },
  { label: "Won End", key: "wonGradient2" },
];

function buildTcmText(
  clientName: string,
  data: { config: StudioSavedConfig | null; locked: boolean; lockedAt: string | null },
): string {
  const colors: StudioThemeColors = { ...defaultStudioColors, ...(data.config?.colors ?? {}) };
  const lines: string[] = [
    `=== STUDIO CONFIG - ${clientName} ===`,
    data.locked && data.lockedAt
      ? `Locked: ${new Date(data.lockedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
      : "Status: Not locked",
    "",
    "COLORS",
    ...STUDIO_COLOR_LABELS.map(
      ({ label, key }) => `${label.padEnd(15)} ${rgbaToHex(colors[key])}  (${colors[key]})`,
    ),
    "",
    "BRAND ASSETS",
    `Logo:  ${data.config?.icons?.appNameLogo ? (data.config.icons.appNameLogo.startsWith("data:") ? "(embedded file)" : data.config.icons.appNameLogo) : "Not uploaded"}`,
    `Icon:  ${data.config?.icons?.topLeftAppIcon ? (data.config.icons.topLeftAppIcon.startsWith("data:") ? "(embedded file)" : data.config.icons.topLeftAppIcon) : "Not uploaded"}`,
  ];
  return lines.join("\n");
}

function StudioConfigCell({
  clientName,
  data,
}: {
  clientName: string;
  data: { config: StudioSavedConfig | null; locked: boolean; lockedAt: string | null } | null;
}) {
  const [open, setOpen] = useState(false);

  if (!data || !data.config) {
    return <span className="text-xs text-muted-foreground/50">-</span>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-accent/60">
          {data.locked ? (
            <>
              <Lock className="h-3.5 w-3.5 text-success" />
              <span className="font-medium text-success">Locked</span>
            </>
          ) : (
            <>
              <div
                className="h-3 w-3 rounded-sm border border-border/60"
                style={{ background: data.config.colors?.primary ?? "#888" }}
              />
              <span className="text-muted-foreground">View</span>
            </>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Studio Config
            <span className="text-muted-foreground font-normal">- {clientName}</span>
            {data.locked && <Lock className="h-3.5 w-3.5 text-success" />}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {data.locked && data.lockedAt && (
            <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-[12px] font-semibold text-success">
              <Lock className="h-3.5 w-3.5" />
              Locked on{" "}
              {new Date(data.lockedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          )}

          {/* Color grid */}
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
              Colors
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {STUDIO_COLOR_LABELS.map(({ label, key }) => {
                const colors: StudioThemeColors = {
                  ...defaultStudioColors,
                  ...(data.config?.colors ?? {}),
                };
                const hex = rgbaToHex(colors[key]);
                return (
                  <button
                    key={key}
                    onClick={() => {
                      navigator.clipboard.writeText(hex);
                      toast.success(`Copied ${hex}`);
                    }}
                    className="flex items-center gap-2 rounded-md border border-border/60 px-2.5 py-1.5 text-left transition-colors hover:bg-accent/40"
                    title={`Copy ${hex}`}
                  >
                    <div
                      className="h-5 w-5 shrink-0 rounded-sm shadow-sm"
                      style={{ background: colors[key] }}
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] text-muted-foreground leading-none">{label}</div>
                      <div className="font-mono text-[11px] font-semibold text-foreground">
                        {hex}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand assets */}
          {(data.config.icons?.appNameLogo || data.config.icons?.topLeftAppIcon) && (
            <div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                Brand Assets
              </div>
              <div className="flex gap-4">
                {data.config.icons?.appNameLogo && (
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground">Logo</div>
                    <img
                      src={data.config.icons.appNameLogo}
                      alt="Logo"
                      className="h-8 max-w-[120px] rounded object-contain border border-border/40 p-1"
                    />
                  </div>
                )}
                {data.config.icons?.topLeftAppIcon && (
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground">Icon</div>
                    <img
                      src={data.config.icons.topLeftAppIcon}
                      alt="Icon"
                      className="h-10 w-10 rounded-lg object-contain border border-border/40 p-0.5"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <Button
            onClick={() => {
              navigator.clipboard.writeText(buildTcmText(clientName, data));
              toast.success("Copied for TCM");
            }}
          >
            <Copy className="h-4 w-4" /> Copy for TCM
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewClientDialog({ ams, onCreated }: { ams: AmLite[]; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [platformUrl, setPlatformUrl] = useState("");
  const [driveLink, setDriveLink] = useState(DEFAULT_DRIVE_LINK);
  const [contactEmail, setContactEmail] = useState("");
  const [amIds, setAmIds] = useState<string[]>([]);
  const [grantStudioAccess, setGrantStudioAccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdClient, setCreatedClient] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  const reset = () => {
    setName("");
    setCountry("");
    setPlatformUrl("");
    setDriveLink(DEFAULT_DRIVE_LINK);
    setContactEmail("");
    setAmIds([]);
    setGrantStudioAccess(false);
    setCreatedClient(null);
  };

  const create = async () => {
    if (!name || !contactEmail.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from("clients")
      .insert([
        {
          name: name.trim(),
          country: country || null,
          platform_url: platformUrl.trim() || null,
          drive_link: driveLink.trim() || null,
          primary_contact_email: contactEmail.trim().toLowerCase(),
          studio_access: grantStudioAccess,
          ...(grantStudioAccess ? { studio_access_granted_at: new Date().toISOString() } : {}),
        },
      ])
      .select("id, name")
      .single();

    if (error || !data) {
      setSubmitting(false);
      toast.error(error?.message ?? "Failed to create client");
      return;
    }

    if (amIds.length > 0) {
      const { error: camErr } = await supabase
        .from("client_account_managers")
        .insert(amIds.map((am_email) => ({ client_id: data.id, am_email })));
      if (camErr) {
        toast.error(`Client created, but AM assignment failed: ${camErr.message}`);
      }
    }

    setSubmitting(false);
    toast.success(`Client "${data.name}" created`);
    setCreatedClient({ id: data.id, name: data.name, email: contactEmail.trim().toLowerCase() });
    onCreated();
  };

  if (createdClient) {
    const onboardingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/onboarding/${createdClient.id}`;
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Client created</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-md border border-success/30 bg-success/10 p-3">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">{createdClient.name} is ready.</div>
              <div className="text-muted-foreground text-xs">
                Share the onboarding link below with the primary contact.
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Onboarding link</Label>
            <div className="flex gap-2">
              <Input readOnly value={onboardingUrl} className="font-mono text-xs" />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(onboardingUrl);
                  toast.success("Link copied");
                }}
              >
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button variant="ghost" onClick={() => window.open(onboardingUrl, "_blank")}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={reset}>
            Create another
          </Button>
          <Button
            onClick={() => {
              const subject = encodeURIComponent(
                `Welcome to Trivelta - your onboarding portal for ${createdClient.name}`,
              );
              const body = encodeURIComponent(
                `Hi,\n\nWelcome aboard! Your Trivelta onboarding portal for ${createdClient.name} is ready.\n\nOpen it here: ${onboardingUrl}\n\nSign in with this email address (${createdClient.email}) and we'll send a magic link - no password required.\n\nTalk soon,\nThe Trivelta Team`,
              );
              window.location.href = `mailto:${createdClient.email}?subject=${subject}&body=${body}`;
            }}
          >
            <Mail className="h-4 w-4" /> Send via Email
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create new client</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Client name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Scorama" />
        </div>
        <div className="space-y-1.5">
          <Label>Country</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Primary Contact Email (this person will be able to submit the form) *</Label>
          <Input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contact@client.com"
          />
          <p className="text-[11px] text-muted-foreground">
            They'll receive the onboarding link and be the only one who can hit Submit. Other team
            members can still fill in fields.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Assign account managers</Label>
          <AmMultiSelect ams={ams} value={amIds} onChange={setAmIds} />
          <p className="text-[11px] text-muted-foreground">
            You can assign multiple AMs. They'll all see this client in their dashboard.
          </p>
        </div>
        <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/40 px-4 py-3">
          <div>
            <div className="text-sm font-medium">Grant Studio Access</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              Allow client to open Trivelta Studio after submitting the form.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setGrantStudioAccess((v) => !v)}
            className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${grantStudioAccess ? "bg-primary" : "bg-secondary"}`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${grantStudioAccess ? "translate-x-4" : "translate-x-0"}`}
            />
          </button>
        </div>
        <div className="space-y-1.5">
          <Label>Platform URL</Label>
          <Input
            value={platformUrl}
            onChange={(e) => setPlatformUrl(e.target.value)}
            placeholder="https://platform.client.com"
            className="font-mono text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Google Drive link</Label>
          <Input
            value={driveLink}
            onChange={(e) => setDriveLink(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="font-mono text-xs"
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={create} disabled={submitting || !name || !contactEmail.trim()}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create client
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ── New Prospect Dialog ─────────────────────────────────────────────────── */

function NewProspectDialog({
  open,
  onOpenChange,
  currentUser,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentUser: { id: string; email?: string } | null;
  onCreated: () => void;
}) {
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [assignedAM, setAssignedAM] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const reset = () => {
    setCompanyName("");
    setContactEmail("");
    setContactName("");
    setAssignedAM("");
    setMagicLink(null);
    setCopiedLink(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleCreate = async () => {
    if (!companyName.trim() || !contactEmail.trim() || !currentUser) return;
    setSubmitting(true);
    const token = generateProspectToken();
    const { error } = await (supabase as unknown as { from: (t: string) => any })
      .from("prospects")
      .insert([
        {
          legal_company_name: companyName.trim(),
          primary_contact_email: contactEmail.trim().toLowerCase(),
          primary_contact_name: contactName.trim() || null,
          assigned_account_manager: assignedAM.trim() || null,
          access_token: token,
          created_by: currentUser.id,
        },
      ]);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMagicLink(buildProspectUrl(token));
    onCreated();
  };

  const copyLink = () => {
    if (!magicLink) return;
    navigator.clipboard.writeText(magicLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {magicLink ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" /> Prospect created
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3 rounded-md border border-success/30 bg-success/10 p-3 text-sm">
                <div>
                  <div className="font-medium">
                    {companyName} is ready.
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Send this magic link to {contactEmail}. No account required.
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide mb-2">
                  Magic Link
                </div>
                <div className="flex items-center gap-2">
                  <Input readOnly value={magicLink} className="font-mono text-[11px]" />
                  <Button variant="outline" onClick={copyLink} className="shrink-0">
                    {copiedLink ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Expires in 30 days. The prospect doesn't need to create an account — this link is
                  their access.
                </p>
              </div>
            </div>
            <DialogFooter className="mt-4 gap-2 sm:justify-between">
              <Button variant="outline" onClick={reset}>
                Create another
              </Button>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create pre-onboarding prospect</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Generate a magic link for a prospect to fill out pre-onboarding information before
                contract signing.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Legal company name *</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Sportsbook Ltd."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Primary contact email *</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="ceo@acmesports.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Primary contact name (optional)</Label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Alex Johnson"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Assigned account manager (optional)</Label>
                <Input
                  value={assignedAM}
                  onChange={(e) => setAssignedAM(e.target.value)}
                  placeholder="your.email@trivelta.com"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={submitting || !companyName.trim() || !contactEmail.trim()}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Generate magic link
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
