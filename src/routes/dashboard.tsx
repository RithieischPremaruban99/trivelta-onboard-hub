import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ExternalLink, Hash, FolderOpen, Globe, FileText, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FormShape } from "@/lib/onboarding-schema";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

interface ClientLite {
  id: string;
  name: string;
  status: "onboarding" | "active" | "churned";
  country: string | null;
  platform_url: string | null;
  drive_link: string | null;
}

interface TaskRow {
  id: string;
  phase: number;
  task: string;
  owner: string;
  completed: boolean;
  sort_order: number;
}

const PHASE_NAMES = [
  "Pre-Sale",
  "Contract & Post-Sale",
  "Initial Setup",
  "Full Configuration",
  "Pre-Launch",
  "Post-Launch",
];

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
        .select("id, name, status, country, platform_url, drive_link")
        .order("created_at", { ascending: false });
      setClients((data ?? []) as ClientLite[]);
      if (data?.length) setSelectedId((data[0] as ClientLite).id);
      setLoading(false);
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
  if (role !== "admin" && role !== "account_manager") {
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

function ClientDetail({ client }: { client: ClientLite }) {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [formData, setFormData] = useState<FormShape | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
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
          .select("data, submitted_at")
          .eq("client_id", client.id)
          .maybeSingle(),
      ]);
      setTasks((tasksRes.data ?? []) as TaskRow[]);
      setFormData((formRes.data?.data as FormShape | null) ?? null);
      setSubmittedAt(formRes.data?.submitted_at ?? null);
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
                    {done}/{phaseTasks.length} • {pct}%
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
