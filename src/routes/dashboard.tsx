import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2, ExternalLink, Hash, FolderOpen, Globe, FileText, Inbox,
  Palette, Lock, CheckCircle2, Copy, Download, Clock, AlertCircle,
  ShieldCheck, ShieldAlert, Unlock, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FormShape } from "@/lib/onboarding-schema";
import type { StudioThemeColors, StudioSavedConfig } from "@/contexts/StudioContext";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

/* ── Types ─────────────────────────────────────────────────────────────── */

interface ClientLite {
  id: string;
  name: string;
  status: "onboarding" | "active" | "churned";
  country: string | null;
  platform_url: string | null;
  drive_link: string | null;
  studio_access_locked: boolean;
}

interface TaskRow {
  id: string;
  phase: number;
  task: string;
  owner: string;
  completed: boolean;
  sort_order: number;
}

/* ── Constants ──────────────────────────────────────────────────────────── */

const PHASE_NAMES = [
  "Pre-Sale",
  "Contract & Post-Sale",
  "Initial Setup",
  "Full Configuration",
  "Pre-Launch",
  "Post-Launch",
];

const CORE_COLORS: { key: keyof StudioThemeColors; label: string }[] = [
  { key: "primaryBg",              label: "primaryBg" },
  { key: "primary",                label: "primary" },
  { key: "secondary",              label: "secondary" },
  { key: "primaryButton",          label: "primaryButton" },
  { key: "primaryButtonGradient",  label: "primaryButtonGradient" },
  { key: "headerGradient1",        label: "headerGradient1" },
  { key: "headerGradient2",        label: "headerGradient2" },
  { key: "wonGradient1",           label: "wonGradient1" },
  { key: "wonGradient2",           label: "wonGradient2" },
  { key: "boxGradient1",           label: "boxGradient1" },
  { key: "boxGradient2",           label: "boxGradient2" },
  { key: "lightText",              label: "lightText" },
  { key: "placeholderText",        label: "placeholderText" },
];

const EXTENDED_COLORS: { key: keyof StudioThemeColors; label: string }[] = [
  { key: "navbarLabel",            label: "navbarLabel" },
  { key: "textSecondary",          label: "textSecondary" },
  { key: "darkTextColor",          label: "darkTextColor" },
  { key: "inactiveButtonBg",       label: "inactiveButtonBg" },
  { key: "inactiveButtonText",     label: "inactiveButtonText" },
  { key: "inactiveButtonTextSecondary", label: "inactiveButtonTextSecondary" },
  { key: "inactiveTabUnderline",   label: "inactiveTabUnderline" },
  { key: "activeSecondaryGradient", label: "activeSecondaryGradient" },
  { key: "dark",                   label: "dark" },
  { key: "darkContainer",          label: "darkContainer" },
  { key: "betcardHeaderBg",        label: "betcardHeaderBg" },
  { key: "modalBackground",        label: "modalBackground" },
  { key: "notificationBg",         label: "notificationBg" },
  { key: "freeBetBackground",      label: "freeBetBackground" },
  { key: "bgColor",                label: "bgColor" },
  { key: "flexBetHeaderBg",        label: "flexBetHeaderBg" },
  { key: "flexBetFooterBg",        label: "flexBetFooterBg" },
  { key: "wonColor",               label: "wonColor" },
  { key: "lostColor",              label: "lostColor" },
  { key: "payoutWonColor",         label: "payoutWonColor" },
  { key: "lossAmountText",         label: "lossAmountText" },
  { key: "winStatusGradient1",     label: "winStatusGradient1" },
  { key: "winStatusGradient2",     label: "winStatusGradient2" },
  { key: "loseStatusGradient1",    label: "loseStatusGradient1" },
  { key: "loseStatusGradient2",    label: "loseStatusGradient2" },
  { key: "vsColor",                label: "vsColor" },
  { key: "borderAndGradientBg",    label: "borderAndGradientBg" },
];

/* ── Helpers ────────────────────────────────────────────────────────────── */

function rgbaToHex(rgba: string): string {
  const m = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return rgba;
  return "#" + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, "0")).join("");
}

function extractAlpha(rgba: string): number {
  const m = rgba.match(/rgba?\([^)]*,\s*([\d.]+)\s*\)/);
  return m ? parseFloat(m[1]) : 1;
}

function buildTcmText(
  clientName: string,
  colors: Partial<StudioThemeColors>,
  icons: StudioSavedConfig["icons"],
  locked: boolean,
  lockedAt: string | null,
): string {
  const fmt = (key: keyof StudioThemeColors) => {
    const val = colors[key];
    if (!val) return "(not set)";
    return val; // output full rgba() value for TCM
  };
  const lines: string[] = [
    `=== STUDIO CONFIG - ${clientName} ===`,
    `Status: ${locked ? `Locked${lockedAt ? " on " + new Date(lockedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}` : "In progress (not locked)"}`,
    "",
    "--- CORE BRAND ---",
    ...CORE_COLORS.map(({ key }) => `${key.padEnd(30)}: ${fmt(key)}`),
    "",
    "--- EXTENDED ---",
    ...EXTENDED_COLORS.map(({ key }) => `${key.padEnd(30)}: ${fmt(key)}`),
    "",
    "--- BRAND ASSETS ---",
    `appNameLogo                   : ${icons?.appNameLogo ? "Uploaded (download from Studio Config panel)" : "Not set"}`,
    `topLeftAppIcon                : ${icons?.topLeftAppIcon ? "Uploaded (download from Studio Config panel)" : "Not set"}`,
  ];
  return lines.join("\n");
}

/* ── Page ───────────────────────────────────────────────────────────────── */

function DashboardPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("clients")
        .select("id, name, status, country, platform_url, drive_link, studio_access_locked")
        .order("created_at", { ascending: false });
      setClients((data ?? []) as ClientLite[]);
      if (data?.length) setSelectedId((data[0] as ClientLite).id);
      setLoading(false);
    })();
  }, [user, authLoading]);

  // Retry any pending Notion syncs left over from failed design-locked calls
  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const { data: pending } = await supabase
        .from("onboarding_forms")
        .select("client_id")
        .eq("notion_sync_pending", true)
        .eq("studio_locked", true);

      if (!pending?.length) return;

      let synced = 0;
      await Promise.all(
        pending.map(async (row: { client_id: string }) => {
          const { error } = await supabase.functions.invoke("design-locked", {
            body: { client_id: row.client_id },
          });
          if (!error) {
            await supabase
              .from("onboarding_forms")
              .update({ notion_sync_pending: false })
              .eq("client_id", row.client_id);
            synced++;
          } else {
            console.warn("[dashboard] Notion retry failed for client", row.client_id, error);
          }
        }),
      );

      if (synced > 0) {
        toast.success(
          synced === 1
            ? "Notion synced for 1 client design."
            : `Notion synced for ${synced} client designs.`,
          { duration: 4000 },
        );
      }
    })();
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (role !== "admin" && role !== "account_manager" && role !== "account_executive") {
    return <Navigate to="/" />;
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar: client list */}
          <aside className="surface-card h-fit p-3">
            <div className="px-2 pb-2 pt-1 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Clients ({clients.length})
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : clients.length === 0 ? (
              <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                <Inbox className="mx-auto mb-2 h-5 w-5" />
                No clients assigned yet.
              </div>
            ) : (
              <ul className="space-y-1">
                {clients.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        "flex w-full items-start justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                        selectedId === c.id
                          ? "bg-primary/15 text-foreground ring-1 ring-primary/30"
                          : "hover:bg-accent text-foreground/90",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{c.name}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {c.country ?? "-"}
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Main pane */}
          <section>
            {selectedId ? (
              <ClientDetail
                client={clients.find((c) => c.id === selectedId)!}
                key={selectedId}
                onStudioAccessChange={(clientId, locked) =>
                  setClients((prev) =>
                    prev.map((c) => c.id === clientId ? { ...c, studio_access_locked: locked } : c)
                  )
                }
              />
            ) : (
              <div className="surface-card grid place-items-center p-16 text-center text-sm text-muted-foreground">
                Select a client to view details.
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

/* ── Client detail ──────────────────────────────────────────────────────── */

function ClientDetail({ client, onStudioAccessChange }: {
  client: ClientLite;
  onStudioAccessChange: (clientId: string, locked: boolean) => void;
}) {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [formData, setFormData] = useState<FormShape | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [studioConfig, setStudioConfig] = useState<StudioSavedConfig | null>(null);
  const [studioLocked, setStudioLocked] = useState(false);
  const [studioLockedAt, setStudioLockedAt] = useState<string | null>(null);
  const [studioAccessLocked, setStudioAccessLocked] = useState(client.studio_access_locked);
  const [togglingAccess, setTogglingAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const slackChannel = `#client-${client.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-onboarding`;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [tasksRes, formRes] = await Promise.all([
        supabase
          .from("onboarding_tasks")
          .select("id, phase, task, owner, completed, sort_order")
          .eq("client_id", client.id)
          .order("phase", { ascending: true })
          .order("sort_order", { ascending: true }),
        supabase
          .from("onboarding_forms")
          .select("data, submitted_at, studio_config, studio_locked, studio_locked_at")
          .eq("client_id", client.id)
          .maybeSingle(),
      ]);
      setTasks((tasksRes.data ?? []) as TaskRow[]);
      setFormData((formRes.data?.data as FormShape | null) ?? null);
      setSubmittedAt(formRes.data?.submitted_at ?? null);
      const sc = formRes.data?.studio_config;
      setStudioConfig(sc && typeof sc === "object" ? (sc as StudioSavedConfig) : null);
      setStudioLocked(formRes.data?.studio_locked ?? false);
      setStudioLockedAt(formRes.data?.studio_locked_at ?? null);
      setLoading(false);
    })();
  }, [client.id]);

  const phases = useMemo(() => {
    const grouped: Record<number, TaskRow[]> = {};
    tasks.forEach((t) => {
      grouped[t.phase] ??= [];
      grouped[t.phase].push(t);
    });
    return grouped;
  }, [tasks]);

  const toggleTask = async (task: TaskRow) => {
    const next = !task.completed;
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, completed: next } : t)));
    const { error } = await supabase
      .from("onboarding_tasks")
      .update({ completed: next, completed_at: next ? new Date().toISOString() : null })
      .eq("id", task.id);
    if (error) {
      toast.error(error.message);
      setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, completed: !next } : t)));
    }
  };

  const copySlack = () => {
    navigator.clipboard.writeText(slackChannel);
    toast.success("Slack channel copied");
  };

  const toggleStudioAccess = async () => {
    setTogglingAccess(true);
    const next = !studioAccessLocked;
    const { error } = await supabase
      .from("clients")
      .update({ studio_access_locked: next })
      .eq("id", client.id);
    if (error) {
      toast.error(error.message);
    } else {
      setStudioAccessLocked(next);
      onStudioAccessChange(client.id, next);
      toast.success(
        next
          ? `Studio locked for ${client.name}`
          : `Studio unlocked for ${client.name}`,
      );
    }
    setTogglingAccess(false);
  };

  if (loading) {
    return (
      <div className="surface-card grid place-items-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top header card */}
      <div className="surface-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">{client.name}</h2>
              <StatusBadge status={client.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{client.country ?? "-"}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/onboarding/$clientId" params={{ clientId: client.id }}>
              Open onboarding form <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button
            onClick={copySlack}
            className="flex items-center gap-3 rounded-md border border-border bg-background/40 p-3 text-left transition-colors hover:bg-accent"
          >
            <Hash className="h-4 w-4 text-primary" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Slack</div>
              <div className="truncate font-mono text-xs">{slackChannel}</div>
            </div>
          </button>
          <a
            href={client.drive_link ?? "#"}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "flex items-center gap-3 rounded-md border border-border bg-background/40 p-3 transition-colors",
              client.drive_link ? "hover:bg-accent" : "opacity-50 pointer-events-none",
            )}
          >
            <FolderOpen className="h-4 w-4 text-primary" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Drive</div>
              <div className="truncate text-xs">{client.drive_link ?? "Not set"}</div>
            </div>
          </a>
          <a
            href={client.platform_url ?? "#"}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "flex items-center gap-3 rounded-md border border-border bg-background/40 p-3 transition-colors",
              client.platform_url ? "hover:bg-accent" : "opacity-50 pointer-events-none",
            )}
          >
            <Globe className="h-4 w-4 text-primary" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Platform</div>
              <div className="truncate text-xs">{client.platform_url ?? "Not set"}</div>
            </div>
          </a>
        </div>
      </div>

      {/* Studio Access Control */}
      <div className="surface-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10">
              <Palette className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider">Studio Access</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Control whether the client can access Trivelta Studio.
              </p>
            </div>
          </div>
          {studioAccessLocked ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-[11px] font-medium text-destructive">
              <ShieldAlert className="h-3 w-3" />
              Studio Locked — client cannot access
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[11px] font-medium text-success">
              <ShieldCheck className="h-3 w-3" />
              Studio Open — client can edit
            </span>
          )}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {studioAccessLocked ? (
            <button
              onClick={toggleStudioAccess}
              disabled={togglingAccess}
              className="inline-flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-4 py-2 text-sm font-medium text-success transition-colors hover:bg-success/20 disabled:opacity-60"
            >
              {togglingAccess ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlock className="h-3.5 w-3.5" />}
              Unlock Studio Access
            </button>
          ) : (
            <button
              onClick={toggleStudioAccess}
              disabled={togglingAccess}
              className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-60"
            >
              {togglingAccess ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
              Lock Studio Access
            </button>
          )}
          <div className="flex items-start gap-1.5 rounded-md bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            Lock while implementing in TCM to prevent conflicting changes.
          </div>
          <button
            onClick={() =>
              window.open(`/studio-preview/${client.id}`, "_blank")
            }
            className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <Palette className="h-3.5 w-3.5" />
            Preview Studio
          </button>
        </div>
      </div>

      {/* Studio Config */}
      <StudioConfigSection
        clientName={client.name}
        studioConfig={studioConfig}
        locked={studioLocked}
        lockedAt={studioLockedAt}
      />

      {/* Form summary */}
      <div className="surface-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Onboarding form</h3>
          </div>
          {submittedAt ? (
            <span className="text-xs text-success">
              Submitted {new Date(submittedAt).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Not submitted yet</span>
          )}
        </div>
        {formData ? (
          <FormDataSummary data={formData} />
        ) : (
          <p className="text-sm text-muted-foreground">
            The client hasn't started filling the form yet.
          </p>
        )}
      </div>

      {/* SOP checklist */}
      <div className="surface-card p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">SOP Checklist</h3>
        <div className="space-y-5">
          {PHASE_NAMES.map((name, idx) => {
            const phase = idx + 1;
            const phaseTasks = phases[phase] ?? [];
            const done = phaseTasks.filter((t) => t.completed).length;
            const pct = phaseTasks.length ? Math.round((done / phaseTasks.length) * 100) : 0;
            return (
              <div key={phase} className="rounded-lg border border-border bg-background/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Phase {phase}
                    </span>
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {done}/{phaseTasks.length} - {pct}%
                  </span>
                </div>
                <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <ul className="space-y-1.5">
                  {phaseTasks.map((t) => (
                    <li key={t.id} className="flex items-start gap-2.5">
                      <Checkbox
                        checked={t.completed}
                        onCheckedChange={() => toggleTask(t)}
                        className="mt-0.5"
                      />
                      <div className="flex flex-1 items-start justify-between gap-2">
                        <span
                          className={cn(
                            "text-sm",
                            t.completed && "line-through text-muted-foreground",
                          )}
                        >
                          {t.task}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ring-1 ring-inset",
                            t.owner === "INTERNAL"
                              ? "bg-primary/10 text-primary ring-primary/20"
                              : "bg-warning/10 text-warning ring-warning/20",
                          )}
                        >
                          {t.owner}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Studio Config Section ──────────────────────────────────────────────── */

function StudioConfigSection({
  clientName,
  studioConfig,
  locked,
  lockedAt,
}: {
  clientName: string;
  studioConfig: StudioSavedConfig | null;
  locked: boolean;
  lockedAt: string | null;
}) {
  const [showExtended, setShowExtended] = useState(false);

  const colors = studioConfig?.colors ?? {};
  const icons = studioConfig?.icons ?? {};
  const hasConfig = !!studioConfig;

  const lockedDate = lockedAt
    ? new Date(lockedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const copyHex = (key: keyof StudioThemeColors) => {
    const val = colors[key];
    if (!val) return;
    navigator.clipboard.writeText(rgbaToHex(val));
    toast.success("Copied!");
  };

  const copyAllJson = () => {
    const out: Record<string, string> = {};
    [...CORE_COLORS, ...EXTENDED_COLORS].forEach(({ key, label }) => {
      const val = colors[key];
      if (val) out[label] = rgbaToHex(val);
    });
    navigator.clipboard.writeText(JSON.stringify(out, null, 2));
    toast.success("Colors copied as JSON");
  };

  const copyForTcm = () => {
    const text = buildTcmText(clientName, colors, icons, locked, lockedAt);
    navigator.clipboard.writeText(text);
    toast.success("Copied for TCM!");
  };

  return (
    <div className="surface-card overflow-hidden p-0">
      {/* Section header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Studio Config</h3>
        </div>
        {hasConfig && (
          <button
            onClick={copyForTcm}
            className="flex items-center gap-2 rounded-lg border border-border bg-primary/10 px-4 py-1.5 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy for TCM
          </button>
        )}
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Status banner */}
        {locked ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-success/20 bg-success/8 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            <div>
              <div className="text-[13px] font-semibold text-success">
                Design locked{lockedDate ? ` on ${lockedDate}` : ""}
              </div>
              <div className="text-[11px] text-success/70">
                Final values - ready for TCM configuration
              </div>
            </div>
          </div>
        ) : hasConfig ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-warning/20 bg-warning/8 px-4 py-3">
            <Clock className="h-4 w-4 shrink-0 text-warning" />
            <div>
              <div className="text-[13px] font-semibold text-warning">Design in progress</div>
              <div className="text-[11px] text-warning/70">
                Client has started but not locked their design yet
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <div className="text-[13px] font-semibold text-foreground">No design configured</div>
              <div className="text-[11px] text-muted-foreground">
                Client has not used Platform Studio yet
              </div>
            </div>
          </div>
        )}

        {hasConfig && (
          <>
            {/* Brand assets */}
            {(icons.appNameLogo || icons.topLeftAppIcon) && (
              <div>
                <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                  Brand Assets
                </div>
                <div className="flex flex-wrap gap-3">
                  {icons.appNameLogo && (
                    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3">
                      <img
                        src={icons.appNameLogo}
                        alt="App Name Logo"
                        className="h-8 max-w-[120px] object-contain"
                      />
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-foreground">App Name Logo</div>
                        <div className="text-[10px] text-muted-foreground">1792x1024</div>
                      </div>
                      <a
                        href={icons.appNameLogo}
                        download="app-name-logo.png"
                        className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                  {icons.topLeftAppIcon && (
                    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3">
                      <img
                        src={icons.topLeftAppIcon}
                        alt="App Icon"
                        className="h-10 w-10 rounded-lg object-contain"
                      />
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-foreground">App Icon</div>
                        <div className="text-[10px] text-muted-foreground">1024x1024</div>
                      </div>
                      <a
                        href={icons.topLeftAppIcon}
                        download="app-icon.png"
                        className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Core colors */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                  Core Colors
                </div>
                <button
                  onClick={copyAllJson}
                  className="flex items-center gap-1.5 rounded-md border border-border/50 px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <Copy className="h-3 w-3" /> Copy all as JSON
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {CORE_COLORS.map(({ key, label }) => {
                  const val = colors[key];
                  const hex = val ? rgbaToHex(val) : null;
                  return (
                    <ColorRow
                      key={key}
                      label={label}
                      hex={hex}
                      rgba={val ?? null}
                      onCopy={() => copyHex(key)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Extended colors (collapsible) */}
            <div>
              <button
                onClick={() => setShowExtended((v) => !v)}
                className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
              >
                {showExtended ? "- Hide" : "+ Show"} Extended Colors ({EXTENDED_COLORS.length})
              </button>
              {showExtended && (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {EXTENDED_COLORS.map(({ key, label }) => {
                    const val = colors[key];
                    const hex = val ? rgbaToHex(val) : null;
                    return (
                      <ColorRow
                        key={key}
                        label={label}
                        hex={hex}
                        rgba={val ?? null}
                        onCopy={() => copyHex(key)}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Lock badge if not locked */}
            {!locked && (
              <div className="flex items-center gap-1.5 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2 text-[11px] text-warning/80">
                <Lock className="h-3 w-3 shrink-0" />
                Colors may still change - client has not locked their design yet.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Color row atom ─────────────────────────────────────────────────────── */

function ColorRow({
  label,
  hex,
  rgba,
  onCopy,
}: {
  label: string;
  hex: string | null;
  rgba: string | null;
  onCopy: () => void;
}) {
  const alpha = rgba ? extractAlpha(rgba) : 1;
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-background/30 px-3 py-2">
      <div
        className="h-7 w-7 shrink-0 rounded-md border border-white/10 shadow-sm"
        style={{ background: rgba ?? "#000" }}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-muted-foreground leading-none mb-0.5">{label}</div>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[11px] font-medium text-foreground">
            {hex ?? "(not set)"}
          </span>
          {alpha < 1 && (
            <span className="font-mono text-[9px] text-muted-foreground/60">
              {Math.round(alpha * 100)}%
            </span>
          )}
        </div>
      </div>
      {hex && (
        <button
          onClick={onCopy}
          className="shrink-0 rounded p-1 text-muted-foreground/50 transition-colors hover:text-foreground"
          title="Copy hex"
        >
          <Copy className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/* ── Form data summary ──────────────────────────────────────────────────── */

function FormDataSummary({ data }: { data: FormShape }) {
  const items: Array<[string, string]> = [
    ["Platform URL", data.platform_url || "-"],
    ["Country", data.country || "-"],
    ["DNS Provider", data.dns_provider || "-"],
    ["DNS Access", data.dns_access || "-"],
    ["Sportsbook contact", data.contact_sportsbook?.name || "-"],
    ["Operational contact", data.contact_operational?.name || "-"],
    ["Compliance contact", data.contact_compliance?.name || "-"],
    [
      "PSPs",
      [
        data.psp_opay && "Opay",
        data.psp_palmpay && "PalmPay",
        data.psp_paystack && "Paystack",
      ]
        .filter(Boolean)
        .join(", ") || "-",
    ],
    ["KYC SURT", data.kyc_surt || "-"],
    [
      "SMS",
      data.sms_provider === "other" ? data.sms_provider_other || "Other" : data.sms_provider || "-",
    ],
    ["Zendesk", data.zendesk || "-"],
    [
      "Analytics",
      [
        data.analytics_meta && "Meta",
        data.analytics_ga && "GA",
        data.analytics_gtm && "GTM",
        data.analytics_snapchat && "Snap",
        data.analytics_reddit && "Reddit",
      ]
        .filter(Boolean)
        .join(", ") || "-",
    ],
  ];
  return (
    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-3 border-b border-border/50 py-1.5">
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">{k}</dt>
          <dd className="truncate text-sm">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
