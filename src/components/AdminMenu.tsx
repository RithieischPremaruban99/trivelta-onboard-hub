import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Shield, Lock, LockOpen, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Extract clientId from URLs like /onboarding/<clientId>/... */
function useClientIdFromUrl(): string | null {
  const location = useLocation();
  const m = location.pathname.match(/\/onboarding\/([^/]+)/);
  return m?.[1] ?? null;
}

export function AdminMenu() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const clientId = useClientIdFromUrl();
  const [locked, setLocked] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const isAdmin = role === "admin" || role === "account_executive";

  useEffect(() => {
    if (!isAdmin || !clientId) {
      setLocked(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("onboarding_forms")
      .select("studio_locked")
      .eq("client_id", clientId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setLocked(Boolean(data?.studio_locked));
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, clientId]);

  if (!isAdmin) return null;

  const toggleLock = async () => {
    if (!clientId) {
      toast.error("Open a client's Studio first.");
      return;
    }
    setBusy(true);
    try {
      const next = !locked;
      const { error } = await supabase
        .from("onboarding_forms")
        .update({
          studio_locked: next,
          studio_locked_at: next ? new Date().toISOString() : null,
        })
        .eq("client_id", clientId);
      if (error) throw error;
      setLocked(next);
      toast.success(next ? "Studio locked." : "Studio unlocked.");
    } catch {
      toast.error("Failed to toggle lock.");
    } finally {
      setBusy(false);
    }
  };

  const goToStudio = () => {
    if (!clientId) {
      toast.error("Open a client's Studio first.");
      return;
    }
    navigate({ to: "/onboarding/$clientId/studio", params: { clientId } });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-8 items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
        title="Admin tools"
      >
        <Shield className="h-3.5 w-3.5" />
        Admin
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Admin Tools {clientId ? `· ${clientId.slice(0, 8)}…` : ""}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleLock} disabled={busy || !clientId}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : locked ? (
            <LockOpen className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          {locked === null
            ? "Lock / Unlock Studio"
            : locked
              ? "Unlock Studio for this client"
              : "Lock Studio for this client"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={goToStudio} disabled={!clientId}>
          <Send className="h-4 w-4" />
          Force re-submit Studio
        </DropdownMenuItem>
        {!clientId && (
          <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
            Open a client's Studio to enable.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
