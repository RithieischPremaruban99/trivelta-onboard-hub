import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

export async function logActivity(params: {
  clientId?: string;
  prospectId?: string;
  action: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("[ActivityLog] No user session - skipping:", params.action);
      return;
    }

    const { data: roleData } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const { error } = await db.from("client_activity_log").insert({
      client_id: params.clientId ?? null,
      prospect_id: params.prospectId ?? null,
      actor_user_id: user.id,
      actor_email: user.email ?? "unknown",
      actor_role: roleData?.role ?? "unknown",
      action: params.action,
      details: params.details ?? {},
    });

    if (error) {
      console.error("[ActivityLog] Insert failed:", error, { params });
      // Don't throw - logging should never break the parent flow
    }
  } catch (err) {
    console.error("[ActivityLog] Exception:", err, { params });
  }
}
