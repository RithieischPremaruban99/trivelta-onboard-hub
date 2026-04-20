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
  Clock,
  Percent,
  Copy,
  ExternalLink,
  Mail,
  Lock,
  Palette,
  ShieldCheck,
  ShieldAlert,
  Unlock,
} from "lucide-react";
import {
  defaultStudioColors,
  type StudioThemeColors,
  type StudioSavedConfig,
} from "@/contexts/StudioContext";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/onboarding-schema";
import { AmAvatars, type AmLite } from "@/components/AmAvatars";
import { AmMultiSelect } from "@/components/AmMultiSelect";

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
}

function AdminPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<string, { total: number; done: number }>>({});
  const [ams, setAms] = useState<AmLite[]>([]);
  // clientId -> list of AM emails
  const [clientAms, setClientAms] = useState<Record<string, string[]>>({});
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
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [clientsRes, amAssignmentsRes, tasksRes, camRes, studioRes] = await Promise.all([
      supabase
        .from("clients")
        .select(
          "id, name, country, status, drive_link, platform_url, primary_contact_email, created_at, studio_access",
        )
        .order("created_at", { ascending: false }),
      supabase.from("role_assignments").select("email, name").eq("role", "account_manager"),
      supabase.from("onboarding_tasks").select("client_id, completed"),
      supabase.from("client_account_managers").select("client_id, am_email"),
      supabase
        .from("onboarding_forms")
        .select("client_id, studio_config, studio_locked, studio_locked_at"),
    ]);
    setClients((clientsRes.data ?? []) as ClientRow[]);

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

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    onboarding: clients.filter((c) => c.status === "onboarding").length,
    avgCompletion:
      clients.length === 0
        ? 0
        : Math.round(
            clients.reduce((sum, c) => {
              const t = taskCounts[c.id];
              if (!t || t.total === 0) return sum;
              return sum + (t.done / t.total) * 100;
            }, 0) / clients.length,
          ),
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Admin overview</h1>
            <p className="text-sm text-muted-foreground">
              All clients, account managers, and onboarding progress.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
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

        {/* Stats */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Total clients" value={stats.total} />
          <StatCard icon={Clock} label="Onboarding" value={stats.onboarding} accent="primary" />
          <StatCard icon={CheckCircle2} label="Active" value={stats.active} accent="success" />
          <StatCard icon={Percent} label="Avg completion" value={`${stats.avgCompletion}%`} />
        </div>

        {/* Table */}
        <div className="surface-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : clients.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No clients yet. Create your first one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-left">
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                      Client
                    </th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                      Country
                    </th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                      Account Managers
                    </th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                      Progress
                    </th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                      Created
                    </th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                      Studio Access
                    </th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                      Studio Config
                    </th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                      Onboarding link
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => {
                    const t = taskCounts[c.id];
                    const pct = t && t.total > 0 ? Math.round((t.done / t.total) * 100) : 0;
                    const assignedEmails = clientAms[c.id] ?? [];
                    const assignedAms: AmLite[] = assignedEmails.map(
                      (email) => ams.find((a) => a.email === email) ?? { email, name: null },
                    );
                    const onboardingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/onboarding/${c.id}`;
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-border/60 transition-colors hover:bg-accent/40"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{c.name}</div>
                          {c.primary_contact_email && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {c.primary_contact_email}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{c.country ?? "-"}</td>
                        <td className="px-4 py-3">
                          <ClientAmCell
                            clientId={c.id}
                            ams={ams}
                            assignedAms={assignedAms}
                            onChanged={refresh}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="font-mono text-xs text-muted-foreground">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3">
                          <StudioConfigCell clientName={c.name} data={studioData[c.id] ?? null} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(onboardingUrl);
                                toast.success("Link copied");
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" /> Copy
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(onboardingUrl, "_blank")}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Open Studio (admin preview)"
                              onClick={() => window.open(`/studio-preview/${c.id}`, "_blank")}
                            >
                              <Palette className="h-3.5 w-3.5" />
                            </Button>
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
      </div>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent?: "primary" | "success";
}) {
  const ring =
    accent === "primary"
      ? "bg-primary/15 text-primary ring-primary/30"
      : accent === "success"
        ? "bg-success/15 text-success ring-success/30"
        : "bg-secondary text-foreground ring-border";
  return (
    <div className="surface-card flex items-center gap-4 p-4">
      <div className={`grid h-10 w-10 place-items-center rounded-md ring-1 ${ring}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold font-mono">{value}</div>
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
