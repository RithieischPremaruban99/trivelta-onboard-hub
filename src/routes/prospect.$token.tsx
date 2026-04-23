import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TriveltaLogo } from "@/components/TriveltaLogo";
import {
  ProspectFormContent,
  type ProspectData,
} from "@/components/prospect/ProspectFormContent";
import {
  PROSPECT_SECTIONS,
  calculateProspectProgress,
} from "@/lib/prospect-fields";

export const Route = createFileRoute("/prospect/$token")({
  component: ProspectPage,
});

/* ── Types ─────────────────────────────────────────────────────────────────── */

type PageState = "loading" | "valid" | "expired" | "invalid";

/* ── Page ───────────────────────────────────────────────────────────────────── */

function ProspectPage() {
  const { token } = useParams({ from: "/prospect/$token" });
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>("loading");
  const [prospect, setProspect] = useState<ProspectData | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(
    PROSPECT_SECTIONS[0].id,
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Load ── */
  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    (async () => {
      // Use SECURITY DEFINER RPC - enforces token validity server-side
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("get_prospect_by_token", {
        p_token: token,
      });

      const row = Array.isArray(data) ? data[0] : data;

      if (error || !row) {
        setState("invalid");
        return;
      }

      if (new Date(row.token_expires_at as string) < new Date()) {
        setState("expired");
        return;
      }

      // Record access time (fire-and-forget, no token needed - RPC handles auth)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).rpc("update_prospect_by_token", {
        p_token: token,
        p_fields: { last_accessed_at: new Date().toISOString() },
      }).then(() => {});

      setProspect({
        ...row,
        update_requested_at: (row.update_requested_at as string | null) ?? null,
        update_request_reason: (row.update_request_reason as string | null) ?? null,
        company_details: (row.company_details as Record<string, unknown>) ?? {},
        payment_providers: (row.payment_providers as Record<string, unknown>) ?? {},
        kyc_compliance: (row.kyc_compliance as Record<string, unknown>) ?? {},
        marketing_stack: (row.marketing_stack as Record<string, unknown>) ?? {},
        technical_requirements:
          (row.technical_requirements as Record<string, unknown>) ?? {},
        optional_features: (row.optional_features as Record<string, unknown>) ?? {},
      } as ProspectData);

      setState("valid");

      // Redirect to welcome screen on first visit
      try {
        const seen = localStorage.getItem(`prospect-welcome-seen-${token}`);
        if (!seen) {
          navigate({ to: "/prospect/welcome/$token", params: { token }, replace: true });
        }
      } catch {
        /* localStorage unavailable - show form directly */
      }
    })();
  }, [token]);

  /* ── Field change + debounced save ── */
  const handleFieldChange = (storageKey: string, fieldKey: string, value: unknown) => {
    if (!prospect) return;

    const updated: ProspectData = {
      ...prospect,
      [storageKey]: {
        ...(prospect[storageKey as keyof ProspectData] as Record<string, unknown>),
        [fieldKey]: value,
      },
    };
    updated.form_progress = calculateProspectProgress(updated);
    setProspect(updated);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).rpc("update_prospect_by_token", {
          p_token: token,
          p_fields: {
            [storageKey]: updated[storageKey as keyof ProspectData],
            form_progress: updated.form_progress,
          },
        });
        if (!error) setSavedAt(new Date());
      } catch (err) {
        console.error("[Prospect] autosave failed:", err);
      } finally {
        setSaving(false);
      }
    }, 1500);
  };

  /* ── Request Update ── */
  const handleRequestUpdate = async (reason: string) => {
    if (!prospect) return;
    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("update_prospect_by_token", {
      p_token: token,
      p_fields: {
        update_requested_at: now,
        update_request_reason: reason || null,
      },
    });
    if (error) {
      console.error("[Prospect] Request update failed:", error);
      toast.error("Could not request update. Please try again.");
      return;
    }
    setProspect({
      ...prospect,
      update_requested_at: now,
      update_request_reason: reason || null,
    });
    toast.success("Update requested - your form is now editable.");
  };

  /* ── Submit + Notion sync ── */
  const handleSubmit = async () => {
    if (!prospect) return;
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any).rpc("update_prospect_by_token", {
        p_token: token,
        p_fields: {
          submitted_at: now,
          update_requested_at: null,
          update_request_reason: null,
        },
      });
      if (updateError) throw updateError;

      // Trigger Notion sync - include prospect_token so the edge function
      // can verify the request originated from a valid token holder
      const { data, error: fnError } = await supabase.functions.invoke("prospect-submitted", {
        body: {
          client_prospect_id: prospect.id,
          prospect_token: token,
          submitted_by: "prospect",
          submitter_email: prospect.primary_contact_email,
        },
      });
      if (fnError) {
        console.error("[Prospect] Notion sync failed:", fnError);
        toast.warning("Submitted - Notion sync queued.");
      } else {
        toast.success("Sent to Trivelta team - we'll be in touch soon.");
      }

      setProspect({
        ...prospect,
        submitted_at: now,
        update_requested_at: null,
        update_request_reason: null,
        notion_page_id: (data as { notion_page_id?: string } | null)?.notion_page_id ?? prospect.notion_page_id,
      });
    } catch (err) {
      console.error("[Prospect] Submit failed:", err);
      toast.error("Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Error screens ── */
  if (state === "loading") {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-sm text-center">
          <div className="flex justify-center mb-6 opacity-50">
            <TriveltaLogo size="sm" withSubtitle={false} />
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-2">Link expired</h1>
          <p className="text-sm text-muted-foreground">
            This pre-onboarding link has expired. Please contact your Trivelta Account
            Manager to receive a new link.
          </p>
        </div>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-sm text-center">
          <div className="flex justify-center mb-6 opacity-50">
            <TriveltaLogo size="sm" withSubtitle={false} />
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-2">Link not found</h1>
          <p className="text-sm text-muted-foreground">
            This link is invalid or has already been used. Please contact your Trivelta
            Account Manager.
          </p>
        </div>
      </div>
    );
  }

  if (!prospect) return null;

  return (
    <ProspectFormContent
      prospect={prospect}
      mode="token"
      saving={saving}
      savedAt={savedAt}
      submitting={submitting}
      openSection={openSection}
      onSectionToggle={(sectionId) => setOpenSection(sectionId)}
      onFieldChange={handleFieldChange}
      onSubmit={handleSubmit}
      onRequestUpdate={handleRequestUpdate}
    />
  );
}
