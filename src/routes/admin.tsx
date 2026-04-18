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
} from "lucide-react";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/onboarding-schema";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

interface ClientRow {
  id: string;
  name: string;
  country: string | null;
  status: "onboarding" | "active" | "churned";
  drive_link: string | null;
  platform_url: string | null;
  primary_contact_email: string | null;
  assigned_am_id: string | null;
  created_at: string;
}

interface AmProfile {
  user_id: string;
  email: string;
  name: string | null;
}

function AdminPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [taskCounts, setTaskCounts] = useState<
    Record<string, { total: number; done: number }>
  >({});
  const [ams, setAms] = useState<AmProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [clientsRes, amRolesRes, tasksRes] = await Promise.all([
      supabase
        .from("clients")
        .select("id, name, country, status, drive_link, platform_url, primary_contact_email, assigned_am_id, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id").eq("role", "account_manager"),
      supabase.from("onboarding_tasks").select("client_id, completed"),
    ]);
    setClients((clientsRes.data ?? []) as ClientRow[]);

    const amUserIds = ((amRolesRes.data ?? []) as Array<{ user_id: string }>).map((r) => r.user_id);
    let amList: AmProfile[] = [];
    if (amUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, name")
        .in("user_id", amUserIds);
      amList = ((profiles ?? []) as Array<{ user_id: string; email: string; name: string | null }>).map(
        (p) => ({ user_id: p.user_id, email: p.email, name: p.name }),
      );
    }
    setAms(amList);

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
  if (role !== "admin" && role !== "account_executive" && role !== "account_manager") {
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
            <NewClientDialog ams={ams} onCreated={() => { setOpen(false); refresh(); }} />
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
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">Client</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">Country</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">AM</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">Progress</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">Created</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">Onboarding link</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => {
                    const t = taskCounts[c.id];
                    const pct = t && t.total > 0 ? Math.round((t.done / t.total) * 100) : 0;
                    const am = ams.find((a) => a.user_id === c.assigned_am_id);
                    const onboardingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/onboarding/${c.id}`;
                    return (
                      <tr key={c.id} className="border-b border-border/60 transition-colors hover:bg-accent/40">
                        <td className="px-4 py-3">
                          <div className="font-medium">{c.name}</div>
                          {c.primary_contact_email && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {c.primary_contact_email}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{c.country ?? "—"}</td>
                        <td className="px-4 py-3">
                          <AmAssignSelect
                            clientId={c.id}
                            currentId={c.assigned_am_id}
                            ams={ams}
                            onChanged={refresh}
                          />
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
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

function AmAssignSelect({
  clientId,
  currentId,
  ams,
  onChanged,
}: {
  clientId: string;
  currentId: string | null;
  ams: AmProfile[];
  onChanged: () => void;
}) {
  const [saving, setSaving] = useState(false);
  return (
    <Select
      value={currentId ?? "unassigned"}
      onValueChange={async (v) => {
        setSaving(true);
        const newId = v === "unassigned" ? null : v;
        const { error } = await supabase
          .from("clients")
          .update({ assigned_am_id: newId })
          .eq("id", clientId);
        setSaving(false);
        if (error) toast.error(error.message);
        else {
          toast.success("AM updated");
          onChanged();
        }
      }}
    >
      <SelectTrigger className="h-8 min-w-[140px] text-xs" disabled={saving}>
        <SelectValue placeholder="Unassigned" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {ams.map((a) => (
          <SelectItem key={a.user_id} value={a.user_id}>
            {a.name ?? a.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NewClientDialog({
  ams,
  onCreated,
}: {
  ams: AmProfile[];
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [platformUrl, setPlatformUrl] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [amId, setAmId] = useState<string>("unassigned");
  const [submitting, setSubmitting] = useState(false);
  const [createdClient, setCreatedClient] = useState<{ id: string; name: string; email: string } | null>(null);

  const reset = () => {
    setName(""); setCountry(""); setPlatformUrl(""); setDriveLink("");
    setContactEmail(""); setAmId("unassigned"); setCreatedClient(null);
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
          assigned_am_id: amId === "unassigned" ? null : amId,
        },
      ])
      .select("id, name")
      .single();
    setSubmitting(false);
    if (error || !data) {
      toast.error(error?.message ?? "Failed to create client");
      return;
    }
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
        <DialogFooter>
          <Button variant="outline" onClick={reset}>Create another</Button>
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
            <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Primary contact email *</Label>
          <Input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contact@client.com"
          />
          <p className="text-[11px] text-muted-foreground">
            This person receives the magic link and acts as the client owner.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Assign account manager</Label>
          <Select value={amId} onValueChange={setAmId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {ams.map((a) => (
                <SelectItem key={a.user_id} value={a.user_id}>{a.name ?? a.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
