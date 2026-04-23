import { supabase } from "@/integrations/supabase/client";

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

    // Use SECURITY DEFINER RPC - actor identity (user_id, email, role) is
    // resolved server-side from auth.uid(), preventing forgery by the caller.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("log_client_activity", {
      p_client_id:   params.clientId   ?? null,
      p_action:      params.action,
      p_details:     params.details    ?? {},
      p_prospect_id: params.prospectId ?? null,
    });

    if (error) {
      console.error("[ActivityLog] RPC failed:", error, { params });
      // Don't throw - logging should never break the parent flow
    }
  } catch (err) {
    console.error("[ActivityLog] Exception:", err, { params });
  }
}
