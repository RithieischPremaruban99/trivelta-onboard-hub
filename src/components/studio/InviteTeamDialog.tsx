import { useEffect, useState } from "react";
import { Loader2, Mail, Users, Trash2, Crown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Member = {
  id: string;
  email: string;
  name: string | null;
  client_role: "client_owner" | "client_member";
};

export function InviteTeamDialog({ clientId }: { clientId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);

  const isOwner =
    !!user?.email &&
    members.some(
      (m) => m.email.toLowerCase() === user.email!.toLowerCase() && m.client_role === "client_owner",
    );

  const loadMembers = async () => {
    setLoadingMembers(true);
    const { data } = await supabase
      .from("team_members")
      .select("id, email, name, client_role")
      .eq("client_id", clientId)
      .order("client_role", { ascending: true })
      .order("created_at", { ascending: true });
    setMembers((data ?? []) as Member[]);
    setLoadingMembers(false);
  };

  useEffect(() => {
    if (open) loadMembers();
  }, [open, clientId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke("invite-team-member", {
      body: { clientId, email: email.trim(), name: name.trim() || undefined },
    });
    setSending(false);
    if (error || (data && (data as { error?: string }).error)) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Invite failed");
      return;
    }
    const status = (data as { status?: string })?.status ?? "sent";
    toast.success(
      status === "already_active"
        ? "Teammate added — they already have an account and can sign in"
        : "Invite sent — they'll receive a magic link by email",
    );
    setEmail("");
    setName("");
    loadMembers();
  };

  const handleRemove = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Remove ${memberEmail} from this studio?`)) return;
    const { error } = await supabase.from("team_members").delete().eq("id", memberId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Teammate removed");
    loadMembers();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Invite teammates to this studio"
        >
          <Users className="h-3.5 w-3.5" />
          Team
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Studio Team
          </DialogTitle>
          <DialogDescription>
            Invite teammates from your company to collaborate on this studio. Everyone gets full
            access to the form, design, and AI chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member list */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Current team ({members.length})
            </Label>
            <div className="max-h-[180px] space-y-1 overflow-y-auto rounded-md border border-border bg-muted/30 p-1.5">
              {loadingMembers ? (
                <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Loading…
                </div>
              ) : members.length === 0 ? (
                <div className="py-3 text-center text-xs text-muted-foreground">
                  No teammates yet
                </div>
              ) : (
                members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-background"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate font-medium text-foreground">
                        {m.client_role === "client_owner" && (
                          <Crown className="h-3 w-3 shrink-0 text-amber-500" />
                        )}
                        <span className="truncate">{m.name || m.email}</span>
                      </div>
                      {m.name && (
                        <div className="truncate font-mono text-[10px] text-muted-foreground">
                          {m.email}
                        </div>
                      )}
                    </div>
                    {isOwner && m.client_role !== "client_owner" && (
                      <button
                        onClick={() => handleRemove(m.id, m.email)}
                        className="ml-2 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Remove"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Invite form */}
          <form onSubmit={handleInvite} className="space-y-3 border-t border-border pt-4">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Invite a teammate
            </Label>
            <div className="space-y-2">
              <Input
                type="email"
                required
                placeholder="teammate@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9"
              />
              <Input
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9"
              />
            </div>
            <Button type="submit" disabled={sending || !email.trim()} className="w-full">
              {sending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending invite…
                </>
              ) : (
                <>
                  <Mail className="h-3.5 w-3.5" /> Send Invite
                </>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              They'll receive a secure magic link to sign in. No password required.
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
