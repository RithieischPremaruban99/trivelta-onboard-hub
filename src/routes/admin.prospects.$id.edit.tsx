import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  ProspectFormContent,
  type ProspectData,
} from "@/components/prospect/ProspectFormContent";
import { calculateProspectProgress, PROSPECT_SECTIONS } from "@/lib/prospect-fields";
import { logActivity } from "@/lib/activity-log";

export const Route = createFileRoute("/admin/prospects/$id/edit")({
  component: AdminProspectEditPage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

function AdminProspectEditPage() {
  const { id } = useParams({ from: "/admin/prospects/$id/edit" });
  const { user, role, loading: authLoading } = useAuth();

  const [prospect, setProspect] = useState<ProspectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(PROSPECT_SECTIONS[0].id);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Load ── */
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    (async () => {
      const { data, error } = await db
        .from("prospects")
        .select(
          "id, legal_company_name, primary_contact_name, primary_contact_email, notion_page_id, form_progress, token_expires_at, submitted_at, company_details, payment_providers, kyc_compliance, marketing_stack, technical_requirements, optional_features, assigned_account_manager",
        )
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        setForbidden(true);
        setLoading(false);
        return;
      }

      // AMs can only edit their own assigned prospects
      if (
        role === "account_manager" &&
        data.assigned_account_manager !== user.email
      ) {
        setForbidden(true);
        setLoading(false);
        return;
      }

      setProspect({
        ...data,
        company_details: (data.company_details as Record<string, unknown>) ?? {},
        payment_providers: (data.payment_providers as Record<string, unknown>) ?? {},
        kyc_compliance: (data.kyc_compliance as Record<string, unknown>) ?? {},
        marketing_stack: (data.marketing_stack as Record<string, unknown>) ?? {},
        technical_requirements:
          (data.technical_requirements as Record<string, unknown>) ?? {},
        optional_features: (data.optional_features as Record<string, unknown>) ?? {},
      } as ProspectData);
      setLoading(false);
    })();
  }, [authLoading, user, id, role]);

  /* ── Auth guards ── */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (
    role !== "admin" &&
    role !== "account_executive" &&
    role !== "account_manager"
  ) {
    return <Navigate to="/" />;
  }

  if (forbidden) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold tracking-tight mb-2">Not found</h1>
          <p className="text-sm text-muted-foreground">
            This prospect doesn't exist or you don't have access to edit it.
          </p>
          <button
            onClick={() => history.back()}
            className="mt-4 text-sm text-primary hover:underline"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  if (!prospect) return null;

  /* ── Field change + debounced save ── */
  const handleFieldChange = (storageKey: string, fieldKey: string, value: unknown) => {
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
        const { error } = await db
          .from("prospects")
          .update({
            [storageKey]: updated[storageKey as keyof ProspectData],
            form_progress: updated.form_progress,
          })
          .eq("id", prospect.id);
        if (!error) {
          setSavedAt(new Date());
          logActivity({
            actorEmail: user?.email ?? "",
            actorRole: role ?? "account_manager",
            prospectId: prospect.id,
            action: "prospect_form_edited",
            details: { section_edited: storageKey, actor_type: "admin_or_am" },
          });
        }
      } catch (err) {
        console.error("[ProspectEdit] autosave failed:", err);
      } finally {
        setSaving(false);
      }
    }, 1500);
  };

  /* ── Submit + Notion sync ── */
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const { error: updateError } = await db
        .from("prospects")
        .update({ submitted_at: now })
        .eq("id", prospect.id);
      if (updateError) throw updateError;

      const { data, error: fnError } = await supabase.functions.invoke(
        "prospect-submitted",
        {
          body: {
            client_prospect_id: prospect.id,
            submitted_by: "admin_or_am",
            submitter_email: user?.email ?? "",
          },
        },
      );
      if (fnError) {
        console.error("[ProspectEdit] Notion sync failed:", fnError);
        toast.warning("Submitted — Notion sync queued.");
      } else {
        toast.success("Prospect data sent to Trivelta team.");
      }

      setProspect({
        ...prospect,
        submitted_at: now,
        notion_page_id:
          (data as { notion_page_id?: string } | null)?.notion_page_id ??
          prospect.notion_page_id,
      });
    } catch (err) {
      console.error("[ProspectEdit] Submit failed:", err);
      toast.error("Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProspectFormContent
      prospect={prospect}
      mode="authenticated"
      saving={saving}
      savedAt={savedAt}
      submitting={submitting}
      openSection={openSection}
      onSectionToggle={(sectionId) => setOpenSection(sectionId)}
      onFieldChange={handleFieldChange}
      onSubmit={handleSubmit}
    />
  );
}
